# API Reference

Base URL: `http://localhost:3000`

All endpoints are prefixed under `/api`.

## Authentication — `/api/auth`

**Source:** `nodejs-app/src/routes/auth.js`

### POST `/api/auth/register`

Register a new user account.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password |
| `name` | string | Yes | Display name |

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `201` | `{ token, email }` | Account created, JWT returned |
| `409` | `{ error }` | Email already registered |
| `500` | `{ error }` | Server error |

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "[email]", "password": "[password]", "name": "[name]"}'
```

### POST `/api/auth/login`

Authenticate an existing user.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password |

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `200` | `{ token, user: { id, email, role } }` | Login successful |
| `401` | `{ error }` | Invalid credentials |
| `500` | `{ error }` | Server error |

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "[email]", "password": "[password]"}'
```

---

## Users — `/api/users`

**Source:** `nodejs-app/src/routes/users.js`

### GET `/api/users`

List all users.

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `200` | `User[]` | Array of all user records |
| `500` | `{ error }` | Server error |

**Example:**

```bash
curl http://localhost:3000/api/users
```

### GET `/api/users/:id`

Get a single user by ID.

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | User ID |

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `200` | `User` | User object |
| `500` | `{ error }` | Server error |

### PUT `/api/users/:id`

Update a user.

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | User ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name |
| `email` | string | Yes | Email address |
| `role` | string | Yes | User role |

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `200` | `{ message: "User updated" }` | Success |
| `500` | `{ error }` | Server error |

### DELETE `/api/users/:id`

Delete a user (hard delete).

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | User ID |

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `200` | `{ message: "User deleted" }` | Success |
| `500` | `{ error }` | Server error |

### POST `/api/users/:id/avatar`

Upload a user avatar image.

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | User ID |

**Request Body:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `avatar` | file | Yes | Avatar image file |

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `200` | `{ avatar }` | File path of uploaded avatar |
| `500` | `{ error }` | Server error |

**Example:**

```bash
curl -X POST http://localhost:3000/api/users/1/avatar \
  -F "avatar=@photo.jpg"
```

---

## Products — `/api/products`

**Source:** `nodejs-app/src/routes/products.js`

### GET `/api/products`

List all products with a 10% discount price calculated.

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `200` | `{ id, name, price, discountedPrice }[]` | Product list |
| `500` | `{ error }` | Server error |

### GET `/api/products/search`

Search products by name with optional filters.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | Search term (matched against product name) |
| `category` | string | No | Filter by category |
| `minPrice` | number | No | Minimum price filter |
| `maxPrice` | number | No | Maximum price filter |

**Example:**

```bash
curl "http://localhost:3000/api/products/search?q=widget&category=electronics&minPrice=10&maxPrice=100"
```

### POST `/api/products`

Create a new product.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Product name |
| `price` | number | Yes | Product price |
| `description` | string | Yes | Product description |
| `category` | string | Yes | Product category |

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `201` | `{ message: "Product created" }` | Success |
| `500` | `{ error }` | Server error |

### GET `/api/products/stats`

Get product statistics with review counts and average ratings, sorted by rating descending.

**Response:**

| Status | Body | Description |
|--------|------|-------------|
| `200` | `{ productId, name, reviewCount, avgRating }[]` | Stats sorted by rating |
| `500` | `{ error }` | Server error |

---

## Database Module

**Source:** `nodejs-app/src/db.js`

### Exported Functions

#### `connectDB()`

Establishes a connection to the MySQL database. Retries on failure with a 1-second delay.

#### `query(sql, params)`

Executes a raw SQL query. Returns a Promise that resolves with the result set.

| Param | Type | Description |
|-------|------|-------------|
| `sql` | string | SQL query string |
| `params` | any | Unused (present in signature but not passed to driver) |

**Returns:** `Promise<any[]>`

### Exported Objects

#### `connection`

The raw `mysql` connection instance.

---

## Middleware

**Source:** `nodejs-app/src/middleware/auth.js`

### `authenticate(req, res, next)`

JWT authentication middleware. Reads the token from the `Authorization` header and attaches the decoded payload to `req.user`.

**Behavior:**
- Returns `401` if no token is provided
- Returns `401` if token verification fails
- Calls `next()` on success with `req.user` populated

### `requireRole(role)`

Authorization middleware factory. Returns middleware that checks `req.user.role` against the specified role.

| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Required role (e.g. `"admin"`) |

**Behavior:**
- Returns `403` if user role doesn't match
- Calls `next()` if authorized

> **Note:** `requireRole` should be chained after `authenticate` to ensure `req.user` is populated.
