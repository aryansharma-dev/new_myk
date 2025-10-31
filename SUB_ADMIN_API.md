# Sub-Admin API Documentation

Base URL: /api/subadmin

All endpoints under `/api/subadmin` require a `subadmin` user (except `/auth/login`). Include header:

Authorization: Bearer <subadmin_token>

Responses follow the format:

{
  success: true|false,
  message: "...",
  data: { ... }
}

---

## POST /auth/login
- Auth required: No
- Body:
  - email (string)
  - password (string)
- Response (200):
{
  success: true,
  message: "Login successful",
  data: { user: { id, name, email, role, miniStoreId } },
  token: "<jwt>"
}

Example cURL:

curl -X POST "https://api.example.com/api/subadmin/auth/login" -H "Content-Type: application/json" -d '{"email":"sub@example.com","password":"pass"}'

---

## GET /mystore
- Auth required: Yes (subadmin)
- Returns the sub-admin's store document, populated with some product fields.
- Response (200):
{
  success: true,
  message: "Store fetched",
  data: { store: { ... } }
}

---

## PUT /mystore
- Auth required: Yes
- Body (any of):
  - displayName, bio, avatarUrl, bannerUrl
- Response (200):
{
  success: true,
  message: "Store updated successfully",
  data: { store: { ... } }
}

---

## GET /mystore/products
- Auth required: Yes
- Response (200):
{
  success: true,
  message: "Products fetched",
  data: { products: [ ... ] }
}

---

## POST /mystore/products
- Auth required: Yes
- Body:
  - productId (string)
- Response (200):
{
  success: true,
  message: "Product added to store successfully",
  data: { store: { ... } }
}

---

## POST /mystore/products/create
- Auth required: Yes
- Body:
  - name (string, required)
  - description (string, required)
  - price (number, required)
  - category (string, required)
  - subCategory (string, required)
  - sizes (array|string - optional) - comma-separated string accepted
  - images (array|string, required) - comma-separated URLs accepted
  - stock (number, optional)
  - bestseller (boolean, optional)
- Response (201):
{
  success: true,
  message: "Product created and added to store",
  data: { product: { ... }, store: { ... } }
}

Example cURL:

curl -X POST "https://api.example.com/api/subadmin/mystore/products/create" \
 -H "Authorization: Bearer <token>" \
 -H "Content-Type: application/json" \
 -d '{"name":"Cool Shirt","description":"Nice","price":499,"category":"Apparel","subCategory":"Tops","sizes":"S,M,L","images":"https://.../1.jpg,https://.../2.jpg"}'

---

## DELETE /mystore/products/:productId
- Auth required: Yes
- Response (200):
{
  success: true,
  message: "Product removed from store successfully",
  data: { store: { ... } }
}

---

## GET /mystore/orders
- Auth required: Yes
- Query params (optional):
  - status (string)
  - search (string) - order id or customer name
- Response (200):
{
  success: true,
  message: "Orders fetched",
  data: { count: <number>, orders: [ ... ] }
}

Example cURL:

curl -X GET "https://api.example.com/api/subadmin/mystore/orders?status=Pending&search=john" -H "Authorization: Bearer <token>"

---

# Authentication flow
1. Sub-admin logs in via `POST /api/subadmin/auth/login` with email/password.
2. Server returns a JWT token (valid 7 days). Store this token as `subadmin_token` in localStorage in the frontend.
3. For all subsequent sub-admin API calls, include `Authorization: Bearer <token>` header.

# Notes
- Legacy mini-store routes under `/api/ministores/subadmin/*` remain available for compatibility.
- All responses follow the `{ success, message, data }` pattern for consistency.
