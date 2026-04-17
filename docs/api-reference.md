# API Reference

The `kiro-demo-api` is an Express.js REST API running on port `3000`. All endpoints are prefixed under `/api`.

> **Note:** This is intentionally flawed demo code. See [Known Issues](#known-issues) for details.

## Authentication

### POST `/api/auth/register`

Register a new user account.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password |
| `name` | string | Yes | Display name |

**Response:** `201 Created`

```json
{
  "token": "<jwt>",
  "email": "user@example.com"
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `409` | Email already registered |
| `500` | Server error |

---

### POST `/api/auth/login`

Authenticate and receive a JWT.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email |
| `password` | string | Yes | User password |

**Response:** `200 OK`

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin"
  }
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401` | Invalid email or password |
| `500` | Server error |

---

## Users

### GET `/api/users`

List all users.

**Response:** `200 OK` — Array of user objects.

---

### GET `/api/users/:id`

Get a single user by ID.

**Parameters:**

| Param | Location | Type | Description |
|-------|----------|------|-------------|
| `id` | path | integer | User ID |

**Response:** `200 OK` — User object.

---

### PUT `/api/users/:id`

Update a user.

**Parameters:**

| Param | Location | Type | Description |
|-------|----------|------|-------------|
| `id` | path | integer | User ID |

**Request body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name |
| `email` | string | Email address |
| `role` | string | User role |

**Response:** `200 OK`

```json
{ "message": "User updated" }
```

---

### DELETE `/api/users/:id`

Delete a user (hard delete).

**Parameters:**

| Param | Location | Type | Description |
|-------|----------|------|-------------|
| `id` | path | integer | User ID |

**Response:** `200 OK`

```json
{ "message": "User deleted" }
```

---

### POST `/api/users/:id/avatar`

Upload a user avatar. Accepts `multipart/form-data` with a `avatar` file field.

**Parameters:**

| Param | Location | Type | Description |
|-------|----------|------|-------------|
| `id` | path | integer | User ID |
| `avatar` | body (multipart) | file | Avatar image file |

**Response:** `200 OK`

```json
{ "avatar": "/uploads/filename.png" }
```

---

## Products

### GET `/api/products`

List all products. Returns products with a computed 10% discount price.

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Widget",
    "price": 29.99,
    "discountedPrice": 26.991
  }
]
```

---

### GET `/api/products/search`

Search products by name with optional filters.

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | Search term (matched against product name) |
| `category` | string | No | Filter by category |
| `minPrice` | number | No | Minimum price |
| `maxPrice` | number | No | Maximum price |

**Response:** `200 OK` — Array of matching product objects.

---

### POST `/api/products`

Create a new product.

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Product name |
| `price` | number | Yes | Product price |
| `description` | string | Yes | Product description |
| `category` | string | Yes | Product category |

**Response:** `201 Created`

```json
{ "message": "Product created" }
```

---

### GET `/api/products/stats`

Get product statistics with review counts and average ratings, sorted by rating descending.

**Response:** `200 OK`

```json
[
  {
    "productId": 1,
    "name": "Widget",
    "reviewCount": 5,
    "avgRating": 4.2
  }
]
```

---

## Middleware

### `authenticate`

**Exported from:** `src/middleware/auth.js`

JWT verification middleware. Reads the token from the `Authorization` header and attaches the decoded payload to `req.user`.

```javascript
const { authenticate } = require("./middleware/auth");
router.get("/protected", authenticate, handler);
```

> **Note:** This middleware exists but is not currently applied to any route.

### `requireRole(role)`

**Exported from:** `src/middleware/auth.js`

Role-based authorization middleware. Must be used after `authenticate`.

```javascript
const { authenticate, requireRole } = require("./middleware/auth");
router.delete("/admin-only", authenticate, requireRole("admin"), handler);
```

---

## Database Module

### `connectDB()`

**Exported from:** `src/db.js`

Establishes a MySQL connection. Called automatically on server startup. Retries on failure with a 1-second delay.

### `query(sql, params)`

**Exported from:** `src/db.js`

Executes a raw SQL query. Returns a Promise resolving to the result rows.

```javascript
const { query } = require("./db");
const users = await query("SELECT * FROM users");
```

---

## Known Issues

This codebase is intentionally flawed for demonstration purposes. Key issues include:

- **SQL injection** in all routes via string interpolation
- **No authentication** on user and product endpoints
- **No input validation** on any endpoint
- **No pagination** on list endpoints
- **Hardcoded JWT secret** duplicated across files
- **JWT tokens never expire**
- **Auth middleware defined but never used**
- **User enumeration** via distinct login error messages
- **File upload** with no type/size validation
- **N+1 query pattern** in `/products/stats`
