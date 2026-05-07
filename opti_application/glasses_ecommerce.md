# 📄 Eyewear Multi-Tenant E-Commerce with Virtual Try-On (MVP Spec)

---

## 1. System Overview

A **multi-tenant eyewear e-commerce platform** where multiple stores can sell glasses online.

Each store has:

- Its own products
- Its own branding
- Its own orders
- Its own customers

Core differentiator:

- **Virtual Try-On using multi-angle PNG switching (not 3D)**

---

## 2. Architecture Overview

### Components

- **Mobile App (Flutter)**
  - Main e-commerce experience
  - Uses WebView for Try-On module

- **Web AR Module**
  - React / Next.js
  - MediaPipe Face Landmarker
  - Canvas/WebGL rendering
  - Multi-angle image switching

- **Backend API**
  - NestJS (REST API)
  - PostgreSQL + Prisma
  - JWT Auth
  - Multi-tenant architecture

- **Admin Dashboard**
  - Next.js
  - Store-based access control

- **Storage**
  - S3 / Cloudflare R2
  - CDN for images

---

## 3. Multi-Tenant Model

### Tenant Isolation Strategy

- Shared database
- Each table includes:

```ts
storeId: string;
```

### Store Entity

```ts
Store {
  id
  name
  domain
  logoUrl
  createdAt
}
```

---

## 4. User Roles

- Customer
- Store Admin
- Super Admin (platform owner)

---

## 5. Core Features (MVP Scope)

### Included

- Multi-store system
- Product catalog
- Virtual Try-On (multi-angle PNG)
- Cart
- Checkout
- Paymob integration
- Shipping (manual rules)
- Orders
- Wishlist
- Admin dashboard
- Try-on preview in admin

### Excluded (V2)

- Analytics advanced
- AI recommendations
- Native AR
- Multi-currency

---

## 6. Virtual Try-On (Multi-Angle System)

### Concept

Instead of 3D:

- Use multiple PNG images
- Switch based on head rotation angle

---

### Required Product Assets

```json
{
  "angles": {
    "front": "url",
    "left_45": "url",
    "right_45": "url",
    "left_side": "url",
    "right_side": "url"
  },
  "tryOnConfig": {
    "scale": 1.1,
    "offsetX": 0,
    "offsetY": -0.02,
    "rotationSensitivity": 1.2
  }
}
```

---

### Face Tracking Logic

- Use MediaPipe Face Landmarks
- Extract:
  - Head rotation (yaw)
  - Eye positions

### Angle Mapping

| Yaw Angle | Image      |
| --------- | ---------- |
| -15 → 15  | front      |
| 15 → 35   | right_45   |
| > 35      | right_side |
| -15 → -35 | left_45    |
| < -35     | left_side  |

---

### Features

- Real-time camera overlay
- Auto image switching
- Capture screenshot
- Add to cart
- Switch products instantly

---

## 7. Flutter ↔ WebView Bridge

### Method: postMessage (Recommended)

#### Web → Flutter

```js
window.ReactNativeWebView.postMessage(
  JSON.stringify({
    type: "ADD_TO_CART",
    productId: "123",
  }),
);
```

#### Flutter Listener

```dart
onMessageReceived(message) {
  final data = jsonDecode(message);
  if (data.type == "ADD_TO_CART") {
    addToCart(data.productId);
  }
}
```

---

## 8. Database Schema (Prisma-style)

### User

```ts
User {
  id
  email
  password
  role
  storeId
}
```

---

### Product

```ts
Product {
  id
  storeId
  name
  price
  description
  thumbnailUrl
  createdAt
}
```

---

### ProductAsset

```ts
ProductAsset {
  id
  productId
  angle // front, left_45...
  imageUrl
}
```

---

### Cart

```ts
Cart {
  id
  userId
}
```

---

### CartItem

```ts
CartItem {
  id
  cartId
  productId
  quantity
}
```

---

### Order

```ts
Order {
  id
  userId
  storeId
  totalPrice
  status // pending, paid, shipped
  shippingAddress
  createdAt
}
```

---

### OrderItem

```ts
OrderItem {
  id
  orderId
  productId
  quantity
  price
}
```

---

### ShippingRule

```ts
ShippingRule {
  id
  storeId
  city
  price
}
```

---

## 9. API Design (REST)

### Auth

```
POST /auth/register
POST /auth/login
```

---

### Products

```
GET /stores/:storeId/products
GET /products/:id
POST /products (admin)
```

---

### Cart

```
GET /cart
POST /cart/add
POST /cart/remove
```

---

### Orders

```
POST /orders
GET /orders/my
GET /admin/orders
```

---

### Try-On

```
GET /products/:id/assets
```

---

## 10. Checkout Flow (Step-by-Step)

1. User adds product to cart
2. Opens cart screen
3. Clicks checkout
4. Enters shipping address
5. System calculates shipping based on city
6. User selects payment method (Paymob)
7. Redirect to Paymob
8. Payment success callback
9. Order created with status = paid
10. Admin notified

---

## 11. Admin Dashboard Features

- CRUD Products
- Upload angle images
- Configure try-on settings
- Preview try-on داخل dashboard
- Manage orders
- Set shipping prices per city

---

## 12. Edge Cases

### Try-On

- Face not detected → show message
- Camera permission denied → fallback UI
- Low FPS → reduce rendering frequency
- Image not loaded → fallback to front

---

### E-commerce

- Product out of stock
- Payment failed
- Shipping city not found → default rate
- Duplicate orders (retry protection)

---

### Multi-Tenant

- User accessing wrong store → forbidden
- Admin accessing another store data → forbidden

---

## 13. Security

- JWT authentication
- Role-based access
- Store isolation via storeId
- Rate limiting on auth

---

## 14. MVP Acceptance Criteria

- User can:
  - Browse products
  - Try glasses via camera
  - Add to cart from try-on
  - Checkout with Paymob
  - Receive order confirmation

- Admin can:
  - Add products
  - Upload try-on assets
  - Manage orders
  - Set shipping rules

---

## 15. Future Enhancements (V2)

- 3D models
- Face shape detection
- AI recommendations
- Native ARKit / ARCore
- Multi-currency
- Advanced analytics

---
