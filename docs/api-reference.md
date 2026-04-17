# Node.js Demo API Reference

Base URL: `http://localhost:3000`

> **Note**: This API contains intentional security and quality issues for demonstration purposes. Do not use in production.

## Server Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Port | `3000` | Hardcoded |
| CORS | All origins | No restrictions |
| Body parser | `express.json()` | No size limit |
| Logging | `morgan("dev")` | |

**Entrypoint**: `nodejs-app/src/server.js`

---

## Authentication (`/api/auth`)

**Source**: `nodejs-app/src/routes/auth.js`

### `POST /api/auth/register`

Register a new user account.

**Request Body**:

```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

**Response** (`201 Created`):

```json
{
  "token": "string (JWT)",
  "email": "string"
}
```

**Error Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| `409` | `{"error": "Email already registered"}` | Duplicate email |
| `500` | `{"error": "<message>"}` | Server error |

---

### `POST /api/auth/login`

Authenticate and receive a JWT token.

**Request Body**:

```json
{
  "email": "string",
  "password": "string"
}
```

**Response** (`200 OK`):

```json
{
  "token": "string (JWT)",
  "user": {
    "id": "number",
    "email": "string",
    "role": "string"
  }
}
```

**Error Responses**:

| Status | Body | Condition |
|--------|------|-----------|
| `401` | `{"error": "No account found with this email"}` | Unknown email |
| `401` | `{"error": "Incorrect password"}` | Wrong password |
| `500` | `{"error": "<message>"}` | Server error |

---

## Users (`/api/users`)

**Source**: `nodejs-app/src/routes/users.js`

### `GET /api/users`

List all users.

**Response** (`200 OK`): Array of user objects (includes all columns).

---

### `GET /api/users/:id`

Get a single user by ID.

**Parameters**:

| Name | In | Type | Description |
|------|----|------|-------------|
| `id` | path | number | User ID |

**Response** (`200 OK`): User object.

---

### `PUT /api/users/:id`

Update a user.

**Parameters**:

| Name | In | Type | Description |
|------|----|------|-------------|
| `id` | path | number | User ID |

**Request Body**:

```json
{
  "name": "string",
  "email": "string",
  "role": "string"
}
```

**Response** (`200 OK`):

```json
{
  "message": "User updated"
}
```

---

### `DELETE /api/users/:id`

Delete a user (hard delete).

**Parameters**:

| Name | In | Type | Description |
|------|----|------|-------------|
| `id` | path | number | User ID |

**Response** (`200 OK`):

```json
{
  "message": "User deleted"
}
```

---

### `POST /api/users/:id/avatar`

Upload a user avatar image.

**Parameters**:

| Name | In | Type | Description |
|------|----|------|-------------|
| `id` | path | number | User ID |

**Request Body**: `multipart/form-data` with field `avatar` (file).

**Response** (`200 OK`):

```json
{
  "avatar": "/uploads/<filename>"
}
```

---

## Products (`/api/products`)

**Source**: `nodejs-app/src/routes/products.js`

### `GET /api/products`

List all products with a 10% discount price calculated.

**Response** (`200 OK`):

```json
[
  {
    "id": "number",
    "name": "string",
    "price": "number",
    "discountedPrice": "number"
  }
]
```

---

### `GET /api/products/search`

Search products by name with optional filters.

**Query Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `q` | string | Yes | Search term (matched with SQL `LIKE`) |
| `category` | string | No | Filter by category |
| `minPrice` | number | No | Minimum price |
| `maxPrice` | number | No | Maximum price |

**Response** (`200 OK`): Array of product objects.

---

### `POST /api/products`

Create a new product.

**Request Body**:

```json
{
  "name": "string",
  "price": "number",
  "description": "string",
  "category": "string"
}
```

**Response** (`201 Created`):

```json
{
  "message": "Product created"
}
```

---

### `GET /api/products/stats`

Get product statistics with review counts and average ratings, sorted by rating descending.

**Response** (`200 OK`):

```json
[
  {
    "productId": "number",
    "name": "string",
    "reviewCount": "number",
    "avgRating": "number"
  }
]
```

---

## Database Module

**Source**: `nodejs-app/src/db.js`

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `connection` | `mysql.Connection` | Raw MySQL connection instance |
| `connectDB()` | `function` | Establishes the database connection with auto-retry (1s interval) |
| `query(sql, params)` | `function → Promise` | Executes a raw SQL query and returns a Promise resolving to the result rows |

---

## Auth Middleware

**Source**: `nodejs-app/src/middleware/auth.js`

> **Note**: This middleware is defined but never imported or used by any route.

### Exports

| Export | Signature | Description |
|--------|-----------|-------------|
| `authenticate` | `(req, res, next) → void` | Verifies JWT from `Authorization` header and attaches decoded payload to `req.user` |
| `requireRole(role)` | `(role: string) → middleware` | Returns middleware that checks `req.user.role` matches the given role |
