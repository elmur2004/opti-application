# Opti — Multi-Tenant Eyewear E-Commerce

Three-folder workspace implementing the spec in
[`opti_application/glasses_ecommerce.md`](opti_application/glasses_ecommerce.md):

```
d:\opti application\
├── backend\            # NestJS + Prisma + SQLite (API + try-on web module)
├── opti_application\   # Flutter mobile app (existing project, wired to the API)
└── admin\              # Next.js 15 + Tailwind admin dashboard
```

## Run the whole thing

You'll need three terminals (or run all three in the background).

### 1. Backend — port 3000

```powershell
cd "d:\opti application\backend"
npm install               # only first time
npm run db:setup          # only first time — SQLite migrate + seed
npm run start:dev         # http://localhost:3000/api
```

### 2. Admin dashboard — port 3001

```powershell
cd "d:\opti application\admin"
npm install               # only first time
npm run dev               # http://localhost:3001
```

### 3. Flutter app

```powershell
cd "d:\opti application\opti_application"
flutter pub get           # only first time
flutter run               # picks up Android emulator / iOS sim / device
```

For non-Android-emulator targets, point Flutter at the right host:

```powershell
flutter run --dart-define=API_URL=http://localhost:3000/api `
            --dart-define=TRYON_URL=http://localhost:3000/tryon.html
```

## Default credentials (after `db:setup`)

All share password `password123`.

| Role            | Email                       | Logs into          |
| --------------- | --------------------------- | ------------------ |
| Customer        | customer@example.com        | Flutter app        |
| Optic admin     | admin@opticvision.com       | Admin dashboard    |
| LensCraft admin | admin@lenscraft.com         | Admin dashboard    |

## What's in each piece

### Backend (`backend/`)

- **Auth**: register / login → JWT
- **Multi-tenant**: `storeId` on every product/order; admins see only their store
- **Customer endpoints**: stores, products, product assets, cart, orders, shipping quotes, wishlist
- **Admin endpoints** (require `STORE_ADMIN` or `SUPER_ADMIN` role):
  - `GET/POST/PATCH/DELETE /admin/products`
  - `PUT /admin/products/:id/assets` (set angle URL)
  - `DELETE /admin/products/:id/assets/:angle`
  - `GET/POST/PATCH/DELETE /admin/shipping-rules`
  - `GET /admin/orders`, `POST /admin/orders/:id/mark-paid`
  - `GET /admin/me` (current admin + their store)
- **Try-on web module** at `/tryon.html` — see below

Full route reference in [`backend/README.md`](backend/README.md).

### Try-on web module (`backend/public/tryon.html`)

A single static HTML file using **MediaPipe Face Landmarker**:

- Loads `@mediapipe/tasks-vision` from CDN (no separate build pipeline)
- Requests camera, runs face detection in real time
- Extracts head **yaw** from the facial transformation matrix
- Maps yaw → angle per spec §6:
  - −15° to 15° → `front`
  - 15° to 35° → `right_45`, > 35° → `right_side`
  - −15° to −35° → `left_45`, < −35° → `left_side`
- Overlays the angle PNG over the eyes using face landmarks 33/263 (eye outer corners),
  scaled and rotated to match face roll, with `tryOnConfig` (scale, offsetX, offsetY) applied
- Manual angle buttons override auto-tracking for ~2.5s after a tap
- Capture button composites video + overlay → `data:image/png` and posts to host

**postMessage bridge** (matches spec §7) — the page posts JSON via either
`window.FlutterChannel.postMessage(...)` or `window.ReactNativeWebView.postMessage(...)`:

| Type           | Payload                                                            |
| -------------- | ------------------------------------------------------------------ |
| `ADD_TO_CART`  | `{ type, productId, angle }`                                       |
| `CLOSE`        | `{ type }`                                                         |
| `SCREENSHOT`   | `{ type, productId, angle, dataUrl }`                              |

**URL parameters:**
- `productId=...` — required; fetches assets from `/api/products/:id/assets`
- `api=...` — override the API base (the Flutter app passes its own)
- `mode=manual` — disable camera/face tracking, show static PNG with angle buttons
  (handy for previews and screenshots)

### Flutter app (`opti_application/`)

- Auth (login + register, JWT in `shared_preferences`)
- Store picker
- Product list with search + cart badge
- Product detail with **Try on** (WebView → backend MediaPipe module) and **Add to cart**
- Cart, checkout (with live shipping quote, mocked Paymob), orders history
- State via `provider` / `ChangeNotifier`; HTTP via `package:http`

The Flutter `TryOnScreen` registers a `FlutterChannel` JS channel matching the
bridge contract above. `ADD_TO_CART` events pop the screen with the payload;
the calling screen then adds the product to the cart.

### Admin dashboard (`admin/`)

Next.js 15 + Tailwind CSS v4. Pages:

- `/login` — admin sign-in
- `/products` — list (filtered to admin's store), delete
- `/products/new` — create form: basics + 5-angle URL inputs + try-on tuning
- `/products/[id]` — edit, with **Preview try-on** and **Preview (no camera)**
  buttons that open `tryon.html` in a new tab
- `/orders` — orders list with **Mark paid** button
- `/shipping` — per-city price rules, inline editing

JWT in `localStorage`. Layout guard redirects to `/login` if missing/invalid.

## Architecture flow

```
┌─────────────────────────────────────┐
│  Flutter customer app               │
│   • Browse, add to cart, checkout   │
│   • Try-on → loads tryon.html in    │
│     WebView, listens for postMessage│
└──────────────┬──────────────────────┘
               │ HTTPS (JWT bearer)
               ▼
┌─────────────────────────────────────┐
│  NestJS backend (port 3000)         │
│   • /api/* — customer + admin REST  │
│   • /tryon.html — MediaPipe overlay │
│   • SQLite via Prisma               │
└──────────────▲──────────────────────┘
               │ HTTPS (JWT bearer)
┌──────────────┴──────────────────────┐
│  Next.js admin (port 3001)          │
│   • Manage products, orders, ship'g │
│   • Opens tryon.html for previews   │
└─────────────────────────────────────┘
```

## What's still mocked

- **Paymob payment**: order creates with `status: PENDING` and a fake
  `paymentUrl`. Wire the real Paymob iframe + webhook into `OrdersService.create`
  when integrating.
- **Image hosting**: the admin dashboard takes image URLs (paste any public URL).
  For real product photo uploads, add an S3 / Cloudflare R2 endpoint and a file
  picker in `ProductForm.tsx` — the schema already stores image URLs.
- **Database**: SQLite for zero-setup. Swap `provider = "postgresql"` in
  `backend/prisma/schema.prisma` and re-migrate for prod.

## Quick troubleshooting

- **Try-on "Could not start"**: append `&mode=manual` to the URL to bypass camera
  + face tracking and just preview the angle PNGs.
- **Camera blocked**: `getUserMedia` requires a secure context — `localhost` is
  fine, but a remote IP needs HTTPS.
- **Flutter physical device can't reach backend**: replace `10.0.2.2` with your
  machine's LAN IP in `--dart-define=API_URL=...`.
- **Admin shows "Failed to load"**: confirm the backend is up (port 3000) and
  `NEXT_PUBLIC_API_URL` in `admin/.env.local` matches.
