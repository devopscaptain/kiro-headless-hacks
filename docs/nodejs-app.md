# Node.js Express API (`nodejs-app/`)

Demo Express.js API with intentional security and code quality issues for Kiro agent review.

## Quick Start

```bash
cd nodejs-app
npm install
npm start       # http://localhost:3000
npm run dev     # with nodemon auto-reload
npm test        # jest with coverage
npm run lint    # eslint
```

Requires Node.js >= 16.0.0.

## Project Structure

```
nodejs-app/
├── src/
│   ├── server.js              # Express app setup and entry point
│   ├── db.js                  # MySQL connection and query helper
│   ├── middleware/
│   │   └── auth.js            # JWT authentication and role-based authorization
│   └── routes/
│       ├── auth.js            # Registration and login endpoints
│       ├── users.js           # User CRUD and avatar upload
│       └── products.js        # Product catalog, search, and stats
├── .env                       # Environment variables (intentionally committed for demo)
└── package.json
```

## API Endpoints

### Authentication — `/api/auth`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Create a new user account | No |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT | No |

**POST /api/auth/register**

```json
// Request
{ "email": "user@example.com", "password": "secret", "name": "Jane" }

// Response 201
{ "token": "<jwt>", "email": "user@example.com" }

// Response 409
{ "error": "Email already registered" }
```

**POST /api/auth/login**

```json
// Request
{ "email": "user@example.com", "password": "secret" }

// Response 200
{ "token": "<jwt>", "user": { "id": 1, "email": "user@example.com", "role": "admin" } }
```

### Users — `/api/users`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/users` | List all users | No |
| `GET` | `/api/users/:id` | Get user by ID | No |
| `PUT` | `/api/users/:id` | Update user fields | No |
| `DELETE` | `/api/users/:id` | Delete a user | No |
| `POST` | `/api/users/:id/avatar` | Upload user avatar (multipart) | No |

**PUT /api/users/:id**

```json
// Request
{ "name": "Updated", "email": "new@example.com", "role": "user" }

// Response 200
{ "message": "User updated" }
```

**POST /api/users/:id/avatar**

Multipart form upload with field name `avatar`. Files stored in `/tmp/uploads`.

```json
// Response 200
{ "avatar": "/uploads/photo.jpg" }
```

### Products — `/api/products`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/products` | List all products (with 10% discount price) | No |
| `GET` | `/api/products/search` | Search products by name, category, price range | No |
| `POST` | `/api/products` | Create a new product | No |
| `GET` | `/api/products/stats` | Product stats with review counts and avg ratings | No |

**GET /api/products/search**

Query parameters: `q` (name search), `category`, `minPrice`, `maxPrice`.

```
GET /api/products/search?q=widget&category=electronics&minPrice=10&maxPrice=100
```

**POST /api/products**

```json
// Request
{ "name": "Widget", "price": 29.99, "description": "A widget", "category": "electronics" }

// Response 201
{ "message": "Product created" }
```

**GET /api/products/stats**

Returns products sorted by average review rating (descending), with review count and average rating per product.

## Modules

### `src/server.js`

Express application entry point. Configures middleware (CORS, morgan, JSON parsing) and mounts route handlers. Starts the HTTP server on port 3000 and initiates the database connection.

**Exports:** `app` (Express application instance)

### `src/db.js`

MySQL database connection using the `mysql` package. Provides a single shared connection (not pooled).

**Exports:**
- `connection` — Raw MySQL connection object
- `connectDB()` — Initiates the database connection with auto-retry on failure
- `query(sql)` — Executes a raw SQL query, returns a Promise

### `src/middleware/auth.js`

JWT-based authentication and role authorization middleware.

**Exports:**
- `authenticate(req, res, next)` — Verifies the JWT from the `Authorization` header and attaches `req.user`
- `requireRole(role)` — Returns middleware that checks `req.user.role` matches the specified role

### `src/routes/auth.js`

Express router for `/api/auth`. Handles user registration (with bcrypt password hashing) and login (with JWT token generation).

### `src/routes/users.js`

Express router for `/api/users`. Full CRUD operations on users plus avatar file upload via multer.

### `src/routes/products.js`

Express router for `/api/products`. Product listing, search with filters, creation, and aggregated stats with review data.

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| jsonwebtoken | ^9.0.0 | JWT signing and verification |
| mysql | ^2.18.1 | MySQL client |
| dotenv | ^16.3.1 | Environment variable loading |
| cors | ^2.8.5 | Cross-origin resource sharing |
| helmet | * | HTTP security headers (installed but unused) |
| morgan | ~1.10.0 | HTTP request logging |
| bcrypt | >=5.0.0 | Password hashing |
| lodash | 4.17.20 | Utility functions |
| moment | ^2.29.4 | Date handling (installed but unused) |
| multer | (transitive) | Multipart file upload |
