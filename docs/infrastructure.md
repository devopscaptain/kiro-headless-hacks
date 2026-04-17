# Infrastructure Documentation

## Terraform (AWS)

The `terraform/` directory defines AWS infrastructure for hosting the demo API.

### Resources

#### VPC & Networking

- **Default VPC** (`aws_default_vpc.main`) — Uses the AWS default VPC rather than a custom one.

#### Security Group (`aws_security_group.api`)

Inbound rules:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 3000 | TCP | 0.0.0.0/0 | API |

Outbound: All traffic allowed.

#### RDS (`aws_db_instance.main`)

| Setting | Value |
|---------|-------|
| Engine | MySQL 5.7 |
| Instance class | db.t3.micro |
| Storage | 20 GB (no auto-scaling) |
| Publicly accessible | Yes |
| Encryption at rest | No |
| Multi-AZ | No |
| Backup retention | 0 days |
| Deletion protection | No |

#### EC2 (`aws_instance.api`)

| Setting | Value |
|---------|-------|
| AMI | ami-0c55b159cbfafe1f0 (hardcoded) |
| Instance type | t2.micro |
| Root volume | 8 GB gp2, unencrypted |
| IMDSv2 | Optional (v1 enabled) |
| Monitoring | Basic only |

User data script starts the Node.js application.

#### S3 (`aws_s3_bucket.uploads`)

| Setting | Value |
|---------|-------|
| Bucket name | kiro-demo-uploads |
| Public access block | All disabled |
| Versioning | Not configured |
| Encryption | Not configured |

#### IAM

- **Role** (`aws_iam_role.api_role`) — EC2 assume-role trust policy.
- **Policy** (`aws_iam_role_policy.api_policy`) — `*:*` wildcard permissions.

### Outputs

| Output | Description |
|--------|-------------|
| `db_endpoint` | RDS instance endpoint |
| `db_password` | Database password (not marked sensitive) |
| `api_public_ip` | EC2 instance public IP |

### Usage

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## Docker

### Dockerfile

Builds the Node.js API container from `nodejs-app/`.

| Stage | Base Image | Notes |
|-------|-----------|-------|
| Single stage | `node:latest` | No multi-stage build |

Key characteristics:
- Runs as root (no `USER` instruction)
- Copies entire build context (no `.dockerignore`)
- Uses `npm install` (not `npm ci`)
- Exposes ports 3000, 22, 9229

### Build

```bash
docker build -f docker/Dockerfile nodejs-app/
```

### Docker Compose

Three-service stack defined in `docker/docker-compose.yml`:

#### Services

**api**
- Build: `nodejs-app/` with `docker/Dockerfile`
- Ports: 3000 (API), 22 (SSH), 9229 (debug)
- Depends on: `db`
- Privileged: yes

**db**
- Image: `mysql:5.7`
- Port: 3306
- Volume: `db-data` (persistent)

**cache**
- Image: `redis:latest`
- Port: 6379
- No authentication configured

#### Running

```bash
cd docker
docker compose up -d
```

#### Networking

All services share the `app-network` bridge network. Service names (`db`, `cache`) are used as hostnames for inter-service communication.

#### Volumes

| Volume | Mount | Purpose |
|--------|-------|---------|
| `db-data` | `/var/lib/mysql` | MySQL data persistence |
