# API Reference

The Node.js demo application exposes a REST API on port `3000`. All endpoints are prefixed with `/api`.

## Authentication — `/api/auth`

Defined in `nodejs-app/src/routes/auth.js`.

### `POST /api/auth/register`

Register a new user account.

**Request body:**

| Field      | Type   | Required | Description        |
|------------|--------|----------|--------------------|
| `email`    | string | Yes      | User email address |
| `password` | string | Yes      | User password      |
| `name`     | string | Yes      | Display name       |

**Response (201):**

```json
{
  "token": "<jwt>",
  "email": "user@example.com"
}
```

A `token` cookie is also set on the response.

**Error responses:**

| Status | Condition              |
|--------|------------------------|
| 409    | Email already registered |
| 500    | Server error           |

---

### `POST /api/auth/login`

Authenticate an existing user.

**Request body:**

| Field      | Type   | Required | Description   |
|------------|--------|----------|---------------|
| `email`    | string | Yes      | User email    |
| `password` | string | Yes      | User password |

**Response (200):**

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

| Status | Condition                |
|--------|--------------------------|
| 401    | Email not found          |
| 401    | Incorrect password       |
| 500    | Server error             |

---

## Users — `/api/users`

Defined in `nodejs-app/src/routes/users.js`.

### `GET /api/users`

List all users.

**Response (200):** Array of user objects.

```json
[
  { "id": 1, "name": "Alice", "email": "alice@example.com", "role": "admin" }
]
```

---

### `GET /api/users/:id`

Get a single user by ID.

**Path parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | number | User ID     |

**Response (200):** Single user object.

---

### `PUT /api/users/:id`

Update a user.

**Path parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | number | User ID     |

**Request body:**

| Field  | Type   | Required | Description |
|--------|--------|----------|-------------|
| `name` | string | Yes      | New name    |
| `email`| string | Yes      | New email   |
| `role` | string | Yes      | New role    |

**Response (200):**

```json
{ "message": "User updated" }
```

---

### `DELETE /api/users/:id`

Delete a user.

**Path parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | number | User ID     |

**Response (200):**

```json
{ "message": "User deleted" }
```

---

### `POST /api/users/:id/avatar`

Upload a user avatar image. Uses `multipart/form-data`.

**Path parameters:**

| Param | Type   | Description |
|-------|--------|-------------|
| `id`  | number | User ID     |

**Form fields:**

| Field    | Type | Description          |
|----------|------|----------------------|
| `avatar` | file | Avatar image to upload |

**Response (200):**

```json
{ "avatar": "/uploads/filename.png" }
```

---

## Products — `/api/products`

Defined in `nodejs-app/src/routes/products.js`.

### `GET /api/products`

List all products. Each product includes a computed `discountedPrice` (10% off).

**Response (200):**

```json
[
  { "id": 1, "name": "Widget", "price": 29.99, "discountedPrice": 26.991 }
]
```

---

### `GET /api/products/search`

Search products with filters.

**Query parameters:**

| Param      | Type   | Required | Description                |
|------------|--------|----------|----------------------------|
| `q`        | string | Yes      | Search term (name LIKE)    |
| `category` | string | No       | Filter by category         |
| `minPrice` | number | No       | Minimum price filter       |
| `maxPrice` | number | No       | Maximum price filter       |

**Response (200):** Array of matching product objects.

---

### `POST /api/products`

Create a new product.

**Request body:**

| Field         | Type   | Required | Description         |
|---------------|--------|----------|---------------------|
| `name`        | string | Yes      | Product name        |
| `price`       | number | Yes      | Product price       |
| `description` | string | Yes      | Product description |
| `category`    | string | Yes      | Product category    |

**Response (201):**

```json
{ "message": "Product created" }
```

---

### `GET /api/products/stats`

Get product statistics with review aggregations. Returns products sorted by average rating (descending).

**Response (200):**

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

Defined in `nodejs-app/src/middleware/auth.js`. Verifies a JWT from the `Authorization` header and attaches the decoded payload to `req.user`.

```js
const { authenticate } = require("./middleware/auth");
router.get("/protected", authenticate, handler);
```

### `requireRole(role)`

Defined in `nodejs-app/src/middleware/auth.js`. Checks that `req.user.role` matches the specified role. Must be used after `authenticate`.

```js
const { authenticate, requireRole } = require("./middleware/auth");
router.get("/admin", authenticate, requireRole("admin"), handler);
```

---

## Database Module

Defined in `nodejs-app/src/db.js`. Exports:

| Export      | Type     | Description                                      |
|-------------|----------|--------------------------------------------------|
| `connection`| object   | Raw MySQL connection instance                    |
| `connectDB` | function | Establishes the database connection with retry   |
| `query(sql)`| function | Executes a SQL query, returns a Promise          |

```js
const { query, connectDB } = require("./db");

// Connect on startup
connectDB();

// Run a query
const users = await query("SELECT * FROM users");
```
