# Known Issues & Security Findings

This demo application contains **intentional** security vulnerabilities and anti-patterns for Kiro agents to detect. **Do not deploy this code to production.**

## Node.js Application

### Critical — SQL Injection

All database queries use string concatenation instead of parameterized queries:

- `routes/auth.js` — login and register queries
- `routes/users.js` — all CRUD operations
- `routes/products.js` — search, create, and stats queries

### Critical — Hardcoded Secrets

| Secret          | Location                                  |
|-----------------|-------------------------------------------|
| JWT secret      | `routes/auth.js`, `middleware/auth.js`     |
| DB credentials  | `db.js`, `.env`, `docker-compose.yml`      |
| AWS keys        | `.env`, `Dockerfile`, `terraform/main.tf`  |
| Stripe key      | `.env`                                     |

### High — Authentication & Authorization

- Auth middleware (`middleware/auth.js`) exists but is **never applied** to any route
- New users are assigned `admin` role by default
- JWT tokens have no expiration
- No brute-force protection on login
- User enumeration via different error messages for email vs password
- `requireRole` doesn't verify the token first
- Bearer prefix not stripped from Authorization header

### High — Input Validation

- No validation on any request body fields
- No file type or size validation on avatar upload
- Path traversal possible via uploaded filenames

### Medium — Performance

- No pagination on list endpoints (`GET /users`, `GET /products`)
- N+1 query pattern in `GET /products/stats`
- O(n²) bubble sort instead of SQL `ORDER BY`
- Lodash imported for trivial `Array.map` operation

### Low — Code Quality

- `helmet` and `moment` packages installed but unused
- CORS allows all origins
- Stack traces leaked in error responses
- No graceful shutdown handling
- Single database connection (no pooling)
- `dotenv` in dependencies but never called

## Docker

| Severity | Issue                                          |
|----------|------------------------------------------------|
| Critical | Secrets passed as build args (visible in history) |
| Critical | Secrets baked into ENV layers                  |
| High     | Running as root (no USER instruction)          |
| High     | Privileged container in docker-compose         |
| High     | SSH port (22) and debug port (9229) exposed    |
| Medium   | `node:latest` tag (not reproducible)           |
| Medium   | No `.dockerignore` — copies `.git`, `.env`     |
| Medium   | `npm install` instead of `npm ci`              |
| Medium   | No health checks                               |
| Medium   | No resource limits                             |
| Low      | No multi-stage build                           |
| Low      | No restart policy                              |
| Low      | Redis with no password                         |
| Low      | MySQL 5.7 (end-of-life)                        |

## Terraform

| Severity | Issue                                          |
|----------|------------------------------------------------|
| Critical | Hardcoded AWS credentials in provider block    |
| Critical | IAM policy with `*:*` (full access)            |
| Critical | RDS publicly accessible, no encryption         |
| High     | SSH open to `0.0.0.0/0`                        |
| High     | Secrets in EC2 user data (visible in metadata) |
| High     | IMDSv1 enabled (SSRF risk)                     |
| High     | S3 public access not blocked                   |
| High     | `db_password` output not marked sensitive       |
| Medium   | No Terraform state backend                     |
| Medium   | No backup retention on RDS                     |
| Medium   | Default VPC, no custom networking              |
| Medium   | Variables defined but not referenced            |
| Low      | gp2 volumes instead of gp3                     |
| Low      | Previous-gen instance types                    |
| Low      | No cost-tracking tags                          |
