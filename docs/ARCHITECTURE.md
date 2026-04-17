# Architecture Overview

This repository demonstrates Kiro Headless Mode for CI/CD automation. It contains a deliberately flawed demo application (Node.js + Terraform + Docker) and four GitHub Actions workflows powered by Kiro agents.

## Repository Structure

```
kiro-headless-hacks/
├── .github/
│   ├── scripts/
│   │   └── clean-kiro-output.js    # Post-processes Kiro CLI output for CI logs
│   └── workflows/
│       ├── kiro-code-review.yml    # PR code review workflow
│       ├── kiro-pr-summary.yml     # PR summary generation workflow
│       ├── kiro-doc-gen.yml        # Documentation generation workflow
│       └── kiro-dependency-audit.yml # Dependency audit workflow
├── .kiro/
│   └── agents/
│       ├── code-reviewer.json      # Read-only agent for code review
│       ├── doc-generator.json      # Read+write agent for doc generation
│       └── dependency-auditor.json # Read+shell agent for audits
├── nodejs-app/
│   ├── src/
│   │   ├── server.js               # Express app entry point
│   │   ├── db.js                   # MySQL connection and query helper
│   │   ├── routes/
│   │   │   ├── auth.js             # Registration and login endpoints
│   │   │   ├── users.js            # User CRUD endpoints
│   │   │   └── products.js         # Product listing, search, and stats
│   │   └── middleware/
│   │       └── auth.js             # JWT authentication and role middleware
│   ├── package.json
│   └── .env                        # Environment variables (demo only)
├── docker/
│   ├── Dockerfile                  # Container build definition
│   └── docker-compose.yml          # Multi-service orchestration
├── terraform/
│   ├── main.tf                     # AWS infrastructure (VPC, SG, RDS, EC2, S3, IAM)
│   └── variables.tf                # Terraform input variables
├── docs/                           # Generated documentation (this directory)
└── README.md
```

## Component Interaction

```
                    ┌──────────────────────────────────────────┐
                    │           GitHub Actions CI/CD            │
                    │                                          │
                    │  PR opened ──► code-review workflow       │
                    │             ──► pr-summary workflow       │
                    │  Push main ──► doc-gen workflow           │
                    │  Schedule  ──► dependency-audit workflow  │
                    └──────────────┬───────────────────────────┘
                                   │ uses
                                   ▼
                    ┌──────────────────────────────────────────┐
                    │         Kiro CLI (Headless Mode)          │
                    │                                          │
                    │  kiro-cli chat --agent <name>             │
                    │  --trust-tools=<permissions>              │
                    └──────────────┬───────────────────────────┘
                                   │ loads
                                   ▼
                    ┌──────────────────────────────────────────┐
                    │         .kiro/agents/*.json               │
                    │                                          │
                    │  Agent prompt + tool permissions          │
                    └──────────────┬───────────────────────────┘
                                   │ analyzes
                                   ▼
          ┌────────────────────────────────────────────────────┐
          │                  Demo Application                   │
          │                                                    │
          │  nodejs-app/     docker/          terraform/        │
          │  Express API     Dockerfile       AWS infra         │
          │  MySQL DB        docker-compose   EC2, RDS, S3      │
          └────────────────────────────────────────────────────┘
```

## Node.js Application Architecture

The Express application follows a simple layered structure:

```
server.js (entry point)
  ├── Middleware: cors, morgan, express.json
  ├── /api/auth    ──► routes/auth.js     (register, login)
  ├── /api/users   ──► routes/users.js    (CRUD + avatar upload)
  ├── /api/products──► routes/products.js (list, search, create, stats)
  └── Error handler (global)

db.js (data layer)
  └── MySQL single connection with query() helper

middleware/auth.js (security layer)
  ├── authenticate  — JWT token verification
  └── requireRole   — Role-based access control
```

### Key Data Flow

1. Client sends HTTP request to Express server (port 3000)
2. Request passes through global middleware (CORS, logging, JSON parsing)
3. Router dispatches to the matching route handler
4. Route handler calls `query()` from `db.js` to interact with MySQL
5. Response is returned as JSON

### Dependencies

| Package        | Version    | Purpose                          |
|----------------|------------|----------------------------------|
| express        | ^4.18.2    | HTTP framework                   |
| jsonwebtoken   | ^9.0.0     | JWT token signing/verification   |
| mysql          | ^2.18.1    | MySQL client                     |
| bcrypt         | >=5.0.0    | Password hashing                 |
| cors           | ^2.8.5     | Cross-origin resource sharing    |
| morgan         | ~1.10.0    | HTTP request logging             |
| helmet         | *          | Security headers (installed but unused) |
| lodash         | 4.17.20    | Utility functions                |
| moment         | ^2.29.4    | Date handling (installed but unused) |
| dotenv         | ^16.3.1    | Environment variable loading     |
| multer         | (implicit) | File upload handling             |

## Kiro Agent Architecture

Each agent is defined as a JSON file in `.kiro/agents/` with a prompt and tool permissions:

| Agent                | Tools Allowed       | Purpose                                |
|----------------------|---------------------|----------------------------------------|
| `code-reviewer`      | Read-only           | Reviews code for security, bugs, quality |
| `doc-generator`      | Read + Write        | Generates and updates documentation    |
| `dependency-auditor` | Read + Shell        | Runs audit commands, checks licenses   |

Agents follow least-privilege: each only has the tools it needs for its task.

## Infrastructure (Terraform)

The Terraform configuration provisions:

| Resource                | Type              | Purpose                    |
|-------------------------|-------------------|----------------------------|
| `aws_default_vpc`       | VPC               | Network (uses default VPC) |
| `aws_security_group`    | Security Group    | Firewall rules for API     |
| `aws_db_instance`       | RDS MySQL         | Database                   |
| `aws_instance`          | EC2               | Application server         |
| `aws_s3_bucket`         | S3                | File uploads               |
| `aws_iam_role`          | IAM Role          | EC2 service role           |
| `aws_iam_role_policy`   | IAM Policy        | Permissions for API role   |

## Docker Setup

- **Dockerfile** — Single-stage build from `node:latest`, runs the Express app
- **docker-compose.yml** — Three services:
  - `api` — The Node.js application (ports 3000, 22, 9229)
  - `db` — MySQL 5.7 database (port 3306)
  - `cache` — Redis (port 6379)
