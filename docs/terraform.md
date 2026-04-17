# Terraform Infrastructure (`terraform/`)

Demo AWS infrastructure defined in Terraform with intentional security and best-practice issues for Kiro agent review.

## Resources

| Resource | Type | Name/ID |
|----------|------|---------|
| VPC | `aws_default_vpc` | `main` (default VPC) |
| Security Group | `aws_security_group` | `api` |
| RDS Instance | `aws_db_instance` | `kiro-demo-db` (MySQL 5.7) |
| EC2 Instance | `aws_instance` | `kiro-demo-api` |
| S3 Bucket | `aws_s3_bucket` | `kiro-demo-uploads` |
| S3 Public Access Block | `aws_s3_bucket_public_access_block` | `uploads` |
| IAM Role | `aws_iam_role` | `kiro-demo-api-role` |
| IAM Policy | `aws_iam_role_policy` | `kiro-demo-api-policy` |

## Architecture

```
Internet
  │
  ├── :22  (SSH)  ──► EC2 (api)
  ├── :3000 (API) ──► EC2 (api) ──► RDS (MySQL 5.7)
  │
  └── S3 (kiro-demo-uploads) — public access not blocked
```

All resources are deployed in `us-east-1` using the default VPC.

## Files

### `main.tf`

Contains all resource definitions:
- **Provider** — AWS provider pinned to `~> 4.0`
- **VPC** — Uses the default VPC
- **Security Group** — Allows SSH (22) and API (3000) from `0.0.0.0/0`, unrestricted egress
- **RDS** — MySQL 5.7, `db.t3.micro`, 20 GB, publicly accessible, no encryption, no backups
- **EC2** — `t2.micro`, user data script starts the Node.js app, gp2 root volume, IMDSv1 enabled
- **S3** — Upload bucket with public access block set to `false` on all settings
- **IAM** — Role for EC2 with `*:*` wildcard policy

**Outputs:**
| Output | Value | Sensitive |
|--------|-------|-----------|
| `db_endpoint` | RDS endpoint | No |
| `db_password` | RDS password | No (should be) |
| `api_public_ip` | EC2 public IP | No |

### `variables.tf`

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `region` | `string` | `us-east-1` | AWS region |
| `environment` | `string` | — | Deployment environment (no validation) |
| `db_password` | `string` | `SuperSecret123!` | Database password (not marked sensitive) |
| `instance_type` | `string` | `t2.micro` | EC2 instance type |
| `allowed_ssh_cidrs` | `list(string)` | `["0.0.0.0/0"]` | CIDR blocks allowed to SSH |

> **Note:** Variables are defined but not referenced in `main.tf` — values are hardcoded directly in resource blocks.
