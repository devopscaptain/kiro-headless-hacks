# Setup & Development Guide

## Prerequisites

- Node.js >= 16.0.0
- MySQL 5.7+
- Docker & Docker Compose (for containerized setup)
- Terraform (for AWS infrastructure)

## Quick Start (Docker)

The fastest way to run the full stack locally:

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts the API (port 3000), MySQL (port 3306), and Redis (port 6379).

## Local Development

### 1. Install dependencies

```bash
cd nodejs-app
npm install
```

### 2. Configure environment

Create or edit `nodejs-app/.env` with your database connection details:

```
DB_HOST=localhost
DB_USER=admin
DB_PASSWORD=<your-password>
DB_PORT=3306
DB_NAME=kiro_demo
JWT_SECRET=<your-jwt-secret>
```

### 3. Start the database

If not using Docker Compose, ensure MySQL is running and the `kiro_demo` database exists.

### 4. Run the server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The API will be available at `http://localhost:3000`.

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node src/server.js` | Start the production server |
| `dev` | `nodemon src/server.js` | Start with auto-reload on file changes |
| `test` | `jest --coverage` | Run tests with coverage report |
| `lint` | `eslint src/` | Lint source files |

## Project Layout

```
nodejs-app/
├── src/
│   ├── server.js          # Entry point
│   ├── db.js              # Database connection
│   ├── routes/
│   │   ├── auth.js        # POST /api/auth/register, /api/auth/login
│   │   ├── users.js       # CRUD /api/users, POST /api/users/:id/avatar
│   │   └── products.js    # CRUD /api/products, GET /api/products/search, /stats
│   └── middleware/
│       └── auth.js        # authenticate(), requireRole()
├── .env                   # Environment config
└── package.json
```

## Deploying to AWS

See [infrastructure.md](./infrastructure.md) for full Terraform resource details.

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Further Reading

- [API Reference](./api-reference.md) — All endpoints, parameters, and response formats
- [Architecture Overview](./architecture.md) — Module interactions and data flow
- [Infrastructure](./infrastructure.md) — Docker and Terraform resource details
