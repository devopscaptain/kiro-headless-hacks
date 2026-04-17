# Infrastructure Reference

## Terraform (`terraform/`)

Provisions AWS resources for the demo API. All resources are in `us-east-1`.

### Resources

| Resource | Type | Identifier | Description |
|----------|------|------------|-------------|
| Default VPC | `aws_default_vpc` | `main` | Uses the account's default VPC |
| Security Group | `aws_security_group` | `api` | Allows SSH (22), API (3000), all egress |
| RDS Instance | `aws_db_instance` | `main` | MySQL 5.7, `db.t3.micro`, 20 GB |
| EC2 Instance | `aws_instance` | `api` | `t2.micro`, runs the Node.js API |
| S3 Bucket | `aws_s3_bucket` | `uploads` | File upload storage |
| S3 Public Access Block | `aws_s3_bucket_public_access_block` | `uploads` | All blocks set to `false` |
| IAM Role | `aws_iam_role` | `api_role` | EC2 assume-role for the API |
| IAM Policy | `aws_iam_role_policy` | `api_policy` | Inline policy attached to `api_role` |

### Variables (`variables.tf`)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `region` | `string` | `us-east-1` | AWS region |
| `environment` | `string` | — | Deployment environment (no validation) |
| `db_password` | `string` | `SuperSecret123!` | Database password |
| `instance_type` | `string` | `t2.micro` | EC2 instance type |
| `allowed_ssh_cidrs` | `list(string)` | `["0.0.0.0/0"]` | CIDR blocks for SSH access |

### Outputs

| Output | Value | Sensitive |
|--------|-------|-----------|
| `db_endpoint` | RDS endpoint | No |
| `db_password` | RDS password | No (should be) |
| `api_public_ip` | EC2 public IP | No |

---

## Docker (`docker/`)

### Dockerfile

Single-stage build based on `node:latest`. Copies the full `nodejs-app/` context and runs `npm install`.

**Exposed Ports**:

| Port | Purpose |
|------|---------|
| `3000` | Express API |
| `22` | SSH |
| `9229` | Node.js debugger |

**Entrypoint**: `npm start` → `node src/server.js`

### Docker Compose (`docker-compose.yml`)

Three-service stack:

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `api` | Built from Dockerfile | 3000, 22, 9229 | Express.js API (privileged) |
| `db` | `mysql:5.7` | 3306 | MySQL database |
| `cache` | `redis:latest` | 6379 | Redis cache (no auth) |

**Networks**: `app-network` (bridge driver)

**Volumes**: `db-data` (MySQL data persistence)
