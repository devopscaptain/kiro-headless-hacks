# Architecture Overview

This repository demonstrates [Kiro CLI Headless Mode](https://kiro.dev/docs/cli/headless/) for CI/CD automation. It contains four GitHub Actions workflows powered by custom Kiro agents, plus intentionally flawed demo code across three stacks for the agents to analyze.

## Repository Structure

```
kiro-headless-hacks/
├── .github/
│   ├── scripts/
│   │   └── clean-kiro-output.js    # Post-processes Kiro CLI output for CI
│   └── workflows/
│       ├── kiro-code-review.yml    # PR code review
│       ├── kiro-pr-summary.yml     # PR description generation
│       ├── kiro-doc-gen.yml        # Auto-documentation on push to main
│       └── kiro-dependency-audit.yml # Weekly dependency audit
├── .kiro/
│   └── agents/
│       ├── code-reviewer.json      # Read-only review agent
│       ├── doc-generator.json      # Read+write documentation agent
│       └── dependency-auditor.json # Read+shell audit agent
├── nodejs-app/                     # Express.js demo API
│   ├── src/
│   │   ├── server.js               # App entrypoint
│   │   ├── db.js                   # MySQL connection & query helper
│   │   ├── routes/
│   │   │   ├── auth.js             # Registration & login
│   │   │   ├── users.js            # User CRUD + avatar upload
│   │   │   └── products.js         # Product CRUD + search + stats
│   │   └── middleware/
│   │       └── auth.js             # JWT authentication & role middleware
│   └── package.json
├── terraform/                      # AWS infrastructure-as-code
│   ├── main.tf                     # VPC, SG, RDS, EC2, S3, IAM resources
│   └── variables.tf                # Input variables
├── docker/                         # Container configuration
│   ├── Dockerfile                  # Single-stage Node.js image
│   └── docker-compose.yml          # Multi-service stack (API, MySQL, Redis)
└── README.md
```

## Module Interactions

```
┌─────────────────────────────────────────────────────┐
│                  GitHub Actions                      │
│                                                      │
│  PR Event ──► code-review.yml ──► code-reviewer agent│
│           └─► pr-summary.yml  ──► default agent      │
│                                                      │
│  Push main ─► doc-gen.yml ──────► doc-generator agent│
│                                                      │
│  Schedule ──► dependency-audit.yml                   │
│                    └──────────► dependency-auditor    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               nodejs-app (Demo API)                  │
│                                                      │
│  server.js                                           │
│    ├── /api/auth     ──► routes/auth.js              │
│    ├── /api/users    ──► routes/users.js             │
│    └── /api/products ──► routes/products.js          │
│                                                      │
│  db.js ◄── shared by all route modules               │
│  middleware/auth.js  (defined but unused)             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               Infrastructure                         │
│                                                      │
│  terraform/main.tf                                   │
│    EC2 (api) ──► Security Group ──► Default VPC      │
│    RDS (mysql) ──► Security Group                    │
│    S3 (uploads)                                      │
│    IAM Role + Policy ──► EC2                         │
│                                                      │
│  docker/docker-compose.yml                           │
│    api service ──► db service (mysql:5.7)            │
│                └─► cache service (redis)             │
└─────────────────────────────────────────────────────┘
```

## Workflow Details

### Code Review (`kiro-code-review.yml`)
- **Trigger**: Pull request opened/updated
- **Agent**: `code-reviewer` (read-only tools)
- **Output**: Posts/updates a PR comment with findings
- **Concurrency**: Cancels in-progress runs on new pushes

### PR Summary (`kiro-pr-summary.yml`)
- **Trigger**: Pull request opened/updated
- **Agent**: Default (no custom agent)
- **Output**: Appends a summary to the PR description

### Doc Generator (`kiro-doc-gen.yml`)
- **Trigger**: Push to `main`
- **Agent**: `doc-generator` (read + write tools)
- **Output**: Opens a new PR with documentation updates

### Dependency Audit (`kiro-dependency-audit.yml`)
- **Trigger**: Weekly (Monday 9:00 UTC) + manual dispatch
- **Agent**: `dependency-auditor` (read + shell tools)
- **Output**: Creates a GitHub issue with audit findings
