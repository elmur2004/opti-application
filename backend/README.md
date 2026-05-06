# Opti Backend

NestJS + Prisma backend for the Opti multi-tenant eyewear e-commerce app.

## Run

```bash
npm install
npm run db:setup       # prisma migrate + seed
npm run start:dev      # http://localhost:3000/api
```

The API mounts under `/api`. The try-on web stub is served at `http://localhost:3000/tryon.html`.

## Default credentials (after seed)

| Role           | Email                      | Password    |
| -------------- | -------------------------- | ----------- |
| Customer       | customer@example.com       | password123 |
| Optic admin    | admin@opticvision.com      | password123 |
| LensCraft admin| admin@lenscraft.com        | password123 |

## Endpoints (mounted under `/api`)

### Auth (public)
- `POST /auth/register` — `{ email, password }`
- `POST /auth/login` — `{ email, password }` → `{ token, user }`

### Stores (public)
- `GET /stores`
- `GET /stores/:id`

### Products (public)
- `GET /stores/:storeId/products?search=`
- `GET /products/:id`
- `GET /products/:id/assets` — returns `{ productId, angles, tryOnConfig }`

### Cart (auth required)
- `GET /cart`
- `POST /cart/add` — `{ productId, quantity? }`
- `POST /cart/remove` — `{ productId }`
- `DELETE /cart/clear`

### Orders (auth required)
- `POST /orders` — `{ shippingAddress: { name, phone, city, address } }`
- `GET /orders/my`
- `GET /orders/:id`
- `GET /admin/orders` (STORE_ADMIN | SUPER_ADMIN)
- `POST /admin/orders/:id/mark-paid`

### Shipping (public)
- `GET /stores/:storeId/shipping`
- `GET /stores/:storeId/shipping/quote?city=`

### Wishlist (auth required)
- `GET /wishlist`
- `POST /wishlist/add` — `{ productId }`
- `DELETE /wishlist/:productId`

## Notes

- **Database:** SQLite (`prisma/dev.db`). Swap `provider = "postgresql"` in `prisma/schema.prisma` and re-migrate for prod.
- **Paymob:** the order endpoint is mocked — it creates the order with `status: PENDING` and returns a fake `paymentUrl`. Wire the real Paymob iframe / callback into `OrdersService.create` when integrating.
- **Try-on stub:** `public/tryon.html` is a multi-angle PNG switcher with `postMessage` bridge wired (`FlutterChannel` / `ReactNativeWebView`). It is *not* a MediaPipe-based AR module — that module is a separate React/Next.js project per the spec. The stub demonstrates the bridge contract end-to-end.
- **JWT secret:** set `JWT_SECRET` in `.env` for prod.
