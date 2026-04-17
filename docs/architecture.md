# Architecture Overview

This repository demonstrates Kiro CLI Headless Mode in CI/CD pipelines. It contains intentionally flawed sample code across three stacks that Kiro agents analyze during automated workflows.

## Repository Structure

```
kiro-headless-hacks/
├── .github/workflows/       # CI/CD workflows using Kiro headless mode
│   ├── kiro-code-review.yml
│   ├── kiro-pr-summary.yml
│   ├── kiro-doc-gen.yml
│   └── kiro-dependency-audit.yml
├── .kiro/agents/            # Custom Kiro agent definitions
│   ├── code-reviewer.json
│   ├── doc-generator.json
│   └── dependency-auditor.json
├── nodejs-app/              # Express.js REST API (demo target)
│   ├── src/
│   │   ├── server.js        # App entry point, middleware setup, route mounting
│   │   ├── db.js            # MySQL connection and raw query helper
│   │   ├── routes/
│   │   │   ├── auth.js      # Registration and login endpoints
│   │   │   ├── users.js     # User CRUD + avatar upload
│   │   │   └── products.js  # Product CRUD, search, and stats
│   │   └── middleware/
│   │       └── auth.js      # JWT authenticate + role-based authorization
│   ├── package.json
│   └── .env                 # Environment variables (intentionally committed)
├── terraform/               # AWS infrastructure as code (demo target)
│   ├── main.tf              # VPC, SG, RDS, EC2, S3, IAM resources
│   └── variables.tf         # Input variable definitions
├── docker/                  # Container configuration (demo target)
│   ├── Dockerfile
│   └── docker-compose.yml   # API + MySQL + Redis services
└── docs/                    # Project documentation
```

## Component Interaction

```
                    ┌─────────────────────────────────┐
                    │        GitHub Actions            │
                    │  (PR events, push, schedule)     │
                    └──────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │      Kiro CLI Headless Mode      │
                    │  kiro-cli chat --agent <name>    │
                    └──────────┬──────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                 ▼
     ┌────────────┐   ┌──────────────┐  ┌──────────────┐
     │ nodejs-app │   │  terraform/  │  │   docker/    │
     │  Express   │   │  AWS infra   │  │  Container   │
     │  REST API  │   │  (HCL)       │  │  config      │
     └────────────┘   └──────────────┘  └──────────────┘
```

## Node.js Application Architecture

```
server.js
  ├── Middleware: cors, morgan, express.json
  ├── /api/auth     → routes/auth.js     (register, login)
  ├── /api/users    → routes/users.js    (CRUD, avatar upload)
  ├── /api/products → routes/products.js (CRUD, search, stats)
  └── Error handler (global)

db.js
  └── Single MySQL connection (shared by all routes)

middleware/auth.js
  ├── authenticate  — JWT token verification
  └── requireRole   — Role-based access control
```

### Data Flow

1. HTTP request → Express middleware stack (CORS, logging, JSON parsing)
2. Route handler receives request
3. Handler calls `query()` from `db.js` with raw SQL
4. MySQL returns results
5. Handler formats and sends JSON response

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | HTTP framework |
| jsonwebtoken | ^9.0.0 | JWT signing/verification |
| mysql | ^2.18.1 | MySQL client |
| bcrypt | >=5.0.0 | Password hashing |
| cors | ^2.8.5 | Cross-origin resource sharing |
| morgan | ~1.10.0 | HTTP request logging |
| lodash | 4.17.20 | Utility functions |
| multer | (transitive) | File upload handling |

## Infrastructure (Terraform)

Provisions AWS resources for hosting the API:

| Resource | Type | Purpose |
|----------|------|---------|
| `aws_default_vpc.main` | VPC | Network (uses default VPC) |
| `aws_security_group.api` | Security Group | Firewall rules for API/SSH |
| `aws_db_instance.main` | RDS MySQL 5.7 | Application database |
| `aws_instance.api` | EC2 t2.micro | API server |
| `aws_s3_bucket.uploads` | S3 | File upload storage |
| `aws_iam_role.api_role` | IAM Role | EC2 service role |
| `aws_iam_role_policy.api_policy` | IAM Policy | Permissions (wildcard) |

### Terraform Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `region` | string | `us-east-1` | AWS region |
| `environment` | string | — | Deployment environment |
| `db_password` | string | *(set)* | Database password |
| `instance_type` | string | `t2.micro` | EC2 instance type |
| `allowed_ssh_cidrs` | list(string) | `["0.0.0.0/0"]` | SSH access CIDR blocks |

## Docker

### Services (docker-compose.yml)

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `api` | Custom (Dockerfile) | 3000, 22, 9229 | Node.js API |
| `db` | mysql:5.7 | 3306 | MySQL database |
| `cache` | redis:latest | 6379 | Cache layer |

## CI/CD Workflows

| Workflow | File | Trigger | Agent | Output |
|----------|------|---------|-------|--------|
| Code Review | `kiro-code-review.yml` | PR opened/updated | `code-reviewer` | PR comment |
| PR Summary | `kiro-pr-summary.yml` | PR opened/updated | default | PR description update |
| Doc Generator | `kiro-doc-gen.yml` | Push to `main` | `doc-generator` | New PR with doc changes |
| Dependency Audit | `kiro-dependency-audit.yml` | Weekly + manual | `dependency-auditor` | GitHub issue |

### Agent Permissions

| Agent | Read | Write | Shell | Grep |
|-------|------|-------|-------|------|
| `code-reviewer` | ✅ | ❌ | ❌ | ✅ |
| `doc-generator` | ✅ | ✅ | ❌ | ✅ |
| `dependency-auditor` | ✅ | ❌ | ✅ | ✅ |
