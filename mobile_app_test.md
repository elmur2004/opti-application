## Eyewear Multi-Tenant E-Commerce Platform

---

## 1. Objective

This document defines the full testing workflow for validating the entire system, including:

- Backend API (NestJS)
- Admin Dashboard (Next.js)
- Mobile Application (Flutter)
- Virtual Try-On Web Module

The AI agent must:

- Run all applications
- Validate integrations between them
- Verify business logic correctness
- Detect failures, inconsistencies, and missing connections

---

## 2. System Components

### Applications to Run

1. Backend API (NestJS)
2. Admin Panel (Next.js)
3. Mobile App (Flutter)
4. Web AR Module (Try-On)

---

## 3. Environment Setup

### Backend

- Install dependencies
- Setup `.env`
- Run migrations
- Seed database (if exists)
- Start server

Expected:

- Server runs without errors
- Database connected
- API accessible

---

### Admin Panel (Next.js)

- Install dependencies
- Setup `.env`
- Run dev server

Expected:

- Loads without build errors
- Can connect to backend API

---

### Mobile App (Flutter)

- Install dependencies
- Run on emulator/device

Expected:

- App launches successfully
- API calls working
- No crashes on startup

---

### Web AR Module

- Install dependencies
- Start dev server

Expected:

- Camera initializes
- Face detection loads
- No console errors

---

## 4. Core Testing Workflow

The agent must follow this order:

### Step 1: System Boot Validation

- Ensure all services are running
- Check ports availability
- Validate API base URL connectivity

---

## 5. Authentication Testing

### Test Cases

- Register new user
- Login with valid credentials
- Login with invalid credentials
- Token returned correctly
- Token required for protected routes

---

## 6. Multi-Tenant Validation

### Test Cases

- Create multiple stores
- Assign products to different stores
- Ensure:
  - Store A cannot access Store B data
  - Admin scoped to correct store

---

## 7. Product Management Testing

### Admin Panel

- Create product
- Upload:
  - Thumbnail
  - Multi-angle images

- Save try-on configuration

### Validation

- Product appears in mobile app
- Assets load correctly from API

---

## 8. Virtual Try-On Testing

### Functional Tests

- Camera permission request
- Face detection starts
- Glasses overlay appears

### Behavior Tests

- Move head left/right:
  - Verify angle switching works correctly

- Switch products:
  - Overlay updates instantly

- Screenshot:
  - Captures correctly

### Integration Tests

- Click "Add to Cart" inside WebView
- Verify Flutter cart updates

---

## 9. Flutter ↔ WebView Communication

### Test Cases

- WebView sends message:
  - ADD_TO_CART

- Flutter receives message
- Product added to cart

### Negative Case

- Invalid message format → handled safely

---

## 10. Cart Testing

- Add product
- Remove product
- Update quantity

Validation:

- Correct totals
- Persisted state

---

## 11. Checkout & Payment (Paymob)

### Flow

1. Add items to cart
2. Proceed to checkout
3. Enter address
4. Select city
5. Shipping calculated correctly
6. Redirect to Paymob

### Validation

- Payment success callback works
- Order created
- Status = paid

### Edge Cases

- Payment failed
- Payment cancelled

---

## 12. Orders Testing

### Customer

- View order history
- Order details correct

### Admin

- View all orders
- Filter by status
- Update status

---

## 13. Shipping Rules Testing

- Create rules per city
- Apply during checkout

Edge Cases:

- City not found → fallback handling

---

## 14. API Testing

The agent must:

- List all endpoints
- Test each endpoint:
  - Valid request
  - Invalid request
  - Unauthorized request

Validation:

- Correct status codes
- Correct response structure

---

## 15. Database Integrity Testing

- Verify:
  - Relationships (orders, users, products)
  - No orphan records
  - Correct storeId isolation

---

## 16. Error Handling Testing

### Try-On

- Camera denied
- Face not detected
- Image missing

### System

- API down
- Invalid payloads
- Network failures

---

## 17. Performance Checks (Basic)

- API response time acceptable
- Try-On FPS stable
- App navigation smooth

---

## 18. Security Testing

- Unauthorized access blocked
- Admin routes protected
- JWT validation working

---

## 19. Final Validation Checklist

The system is considered valid if:

- All apps run without errors
- All integrations work correctly
- Try-On feature works smoothly
- Checkout flow completes successfully
- Multi-tenant isolation is enforced
- No critical errors detected

---

## 20. Agent Output Requirements

The AI agent must generate:

### Report شامل:

- Failed tests
- Passed tests
- API issues
- UI issues
- Integration issues

### Priority Levels:

- Critical (blocking)
- High
- Medium
- Low

---
