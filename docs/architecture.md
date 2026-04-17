# Architecture Overview

## Project Structure

```
kiro-headless-hacks/
├── .github/workflows/       # CI/CD pipelines (Kiro headless agents)
├── .kiro/agents/            # Kiro agent definitions
├── nodejs-app/              # Express.js REST API
│   ├── src/
│   │   ├── server.js        # App entry point, middleware setup, route mounting
│   │   ├── db.js            # MySQL connection and query helper
│   │   ├── routes/
│   │   │   ├── auth.js      # Registration and login endpoints
│   │   │   ├── users.js     # User CRUD + avatar upload
│   │   │   └── products.js  # Product listing, search, creation, stats
│   │   └── middleware/
│   │       └── auth.js      # JWT authentication and role-based authorization
│   ├── .env                 # Environment variables
│   └── package.json         # Dependencies and scripts
├── docker/
│   ├── Dockerfile           # Container image build
│   └── docker-compose.yml   # Multi-service local stack (API + MySQL + Redis)
├── terraform/
│   ├── main.tf              # AWS infrastructure (VPC, SG, RDS, EC2, S3, IAM)
│   └── variables.tf         # Terraform input variables
├── docs/                    # Project documentation
└── README.md                # Project overview and workflow guide
```

## Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Clients                           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP :3000
                       ▼
┌─────────────────────────────────────────────────────┐
│                  server.js                           │
│  ┌─────────┐  ┌────────┐  ┌──────────────────┐     │
│  │  CORS   │→ │ Morgan │→ │  express.json()  │     │
│  └─────────┘  └────────┘  └──────────────────┘     │
│                       │                              │
│         ┌─────────────┼─────────────┐               │
│         ▼             ▼             ▼               │
│  /api/auth      /api/users    /api/products         │
│  (auth.js)      (users.js)   (products.js)          │
│         │             │             │               │
│         └─────────────┼─────────────┘               │
│                       ▼                              │
│                    db.js                             │
│              (MySQL connection)                      │
└──────────────────────┬──────────────────────────────┘
                       │ TCP :3306
                       ▼
                ┌─────────────┐
                │    MySQL    │
                └─────────────┘
```

## Key Modules

### `server.js` — Application Entry Point

Sets up the Express application with middleware (CORS, Morgan logger, JSON body parser) and mounts the three route modules. Starts the HTTP server on port 3000 and initiates the database connection. Includes a global error handler.

### `db.js` — Database Layer

Provides a single MySQL connection and two exports:
- `connectDB()` — connects to MySQL with auto-retry
- `query(sql)` — executes a raw SQL string and returns a Promise

### Route Modules

| Module | Mount Point | Responsibility |
|--------|-------------|----------------|
| `routes/auth.js` | `/api/auth` | User registration and login, JWT issuance |
| `routes/users.js` | `/api/users` | User CRUD operations, avatar file upload |
| `routes/products.js` | `/api/products` | Product listing, search, creation, statistics |

### `middleware/auth.js` — Authentication & Authorization

Exports two middleware functions:
- `authenticate` — verifies JWT from the `Authorization` header
- `requireRole(role)` — checks `req.user.role` against a required role

> **Note:** This middleware is defined but not currently wired into any route.

## Infrastructure

### Docker (`docker/`)

- **Dockerfile** — Builds the Node.js API image from `node:latest`
- **docker-compose.yml** — Orchestrates three services:
  - `api` — the Express app (port 3000)
  - `db` — MySQL 5.7 (port 3306)
  - `cache` — Redis (port 6379, currently unused by the app)

### Terraform (`terraform/`)

Provisions AWS infrastructure:

| Resource | Purpose |
|----------|---------|
| `aws_default_vpc` | Default VPC |
| `aws_security_group.api` | Ingress rules for SSH (22) and API (3000) |
| `aws_db_instance.main` | MySQL 5.7 RDS instance |
| `aws_instance.api` | EC2 instance running the API |
| `aws_s3_bucket.uploads` | S3 bucket for file uploads |
| `aws_iam_role.api_role` | IAM role for the EC2 instance |

### CI/CD (`.github/workflows/`)

Four Kiro headless agent workflows:

| Workflow | Trigger | Agent |
|----------|---------|-------|
| `kiro-code-review.yml` | Pull request | `code-reviewer` |
| `kiro-pr-summary.yml` | Pull request | default |
| `kiro-doc-gen.yml` | Push to `main` | `doc-generator` |
| `kiro-dependency-audit.yml` | Weekly / manual | `dependency-auditor` |

## Data Flow

1. Client sends HTTP request to Express server
2. Request passes through CORS → Morgan → JSON parser middleware
3. Router dispatches to the matching route handler
4. Route handler builds a SQL string and calls `db.query()`
5. MySQL returns results; handler formats and sends JSON response
6. Global error handler catches unhandled exceptions

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | HTTP framework |
| `jsonwebtoken` | ^9.0.0 | JWT signing and verification |
| `mysql` | ^2.18.1 | MySQL client |
| `bcrypt` | >=5.0.0 | Password hashing |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `helmet` | * | HTTP security headers (installed but unused) |
| `morgan` | ~1.10.0 | HTTP request logger |
| `dotenv` | ^16.3.1 | Environment variable loading |
| `lodash` | 4.17.20 | Utility library (used in products route) |
| `moment` | ^2.29.4 | Date library (installed but unused) |
