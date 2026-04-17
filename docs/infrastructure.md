# Infrastructure Documentation

## Docker

### Dockerfile

**Location:** `docker/Dockerfile`

Builds the Node.js API into a container image.

| Setting | Value |
|---------|-------|
| Base image | `node:latest` |
| Working directory | `/app` |
| Exposed ports | 3000 (API), 22 (SSH), 9229 (Node debug) |
| Entry command | `npm start` |

**Build:**

```bash
docker build -f docker/Dockerfile -t kiro-demo-api ./nodejs-app
```

### Docker Compose

**Location:** `docker/docker-compose.yml`

Runs the full local stack with three services:

| Service | Image | Port(s) | Purpose |
|---------|-------|---------|---------|
| `api` | Built from Dockerfile | 3000, 22, 9229 | Express.js API |
| `db` | `mysql:5.7` | 3306 | MySQL database |
| `cache` | `redis:latest` | 6379 | Redis cache |

**Start the stack:**

```bash
docker compose -f docker/docker-compose.yml up -d
```

**Stop the stack:**

```bash
docker compose -f docker/docker-compose.yml down
```

**Environment variables (api service):**

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Database hostname (set to `db` service) |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key for JWT signing |
| `NODE_ENV` | Node environment (`production`) |

**Volumes:**

| Volume | Mount | Purpose |
|--------|-------|---------|
| `db-data` | `/var/lib/mysql` | Persistent MySQL data |

**Network:** All services share the `app-network` bridge network.

---

## Terraform — AWS Infrastructure

**Location:** `terraform/`

### Resources

#### VPC & Networking

| Resource | Name | Description |
|----------|------|-------------|
| `aws_default_vpc.main` | `default-vpc` | Uses the AWS default VPC |

#### Security Groups

| Resource | Name | Ingress Rules |
|----------|------|---------------|
| `aws_security_group.api` | `api-sg` | SSH (22) from `0.0.0.0/0`, API (3000) from `0.0.0.0/0` |

#### Database

| Resource | Identifier | Engine | Instance Class |
|----------|-----------|--------|----------------|
| `aws_db_instance.main` | `kiro-demo-db` | MySQL 5.7 | `db.t3.micro` |

Key settings:
- 20 GB allocated storage
- Publicly accessible
- No encryption at rest
- No Multi-AZ
- No backup retention
- Deletion protection disabled

#### Compute

| Resource | Name | AMI | Instance Type |
|----------|------|-----|---------------|
| `aws_instance.api` | `kiro-demo-api` | `ami-0c55b159cbfafe1f0` | `t2.micro` |

Key settings:
- 8 GB gp2 root volume (unencrypted)
- IMDSv2 optional (v1 enabled)
- User data script starts the application

#### Storage

| Resource | Bucket Name | Description |
|----------|-------------|-------------|
| `aws_s3_bucket.uploads` | `kiro-demo-uploads` | File upload storage |

Public access block: all settings set to `false` (public access allowed).

#### IAM

| Resource | Name | Description |
|----------|------|-------------|
| `aws_iam_role.api_role` | `kiro-demo-api-role` | EC2 assume role |
| `aws_iam_role_policy.api_policy` | `kiro-demo-api-policy` | Full `*:*` permissions |

### Input Variables

**Location:** `terraform/variables.tf`

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `region` | string | `us-east-1` | AWS region |
| `environment` | string | — | Deployment environment |
| `db_password` | string | *(has default)* | Database password |
| `instance_type` | string | `t2.micro` | EC2 instance type |
| `allowed_ssh_cidrs` | list(string) | `["0.0.0.0/0"]` | CIDR blocks allowed SSH access |

### Outputs

| Output | Value |
|--------|-------|
| `db_endpoint` | RDS instance endpoint |
| `db_password` | RDS password (not marked sensitive) |
| `api_public_ip` | EC2 instance public IP |

### Usage

```bash
cd terraform
terraform init
terraform plan
terraform apply
```
