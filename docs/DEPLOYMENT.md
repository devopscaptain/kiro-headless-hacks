# Docker & Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- (Optional) Terraform >= 1.0 for AWS deployment
- Node.js >= 16.0.0 for local development

## Local Development (without Docker)

```bash
cd nodejs-app
npm install
npm run dev
```

The server starts on `http://localhost:3000`.

## Docker Compose

From the repository root:

```bash
docker compose -f docker/docker-compose.yml up --build
```

This starts three services:

| Service | Port | Description       |
|---------|------|-------------------|
| `api`   | 3000 | Express API       |
| `db`    | 3306 | MySQL 5.7         |
| `cache` | 6379 | Redis             |

### Stopping

```bash
docker compose -f docker/docker-compose.yml down
```

To also remove volumes (database data):

```bash
docker compose -f docker/docker-compose.yml down -v
```

## Building the Docker Image

```bash
docker build -f docker/Dockerfile -t kiro-demo-api nodejs-app/
```

## Terraform (AWS)

The `terraform/` directory contains infrastructure-as-code for deploying to AWS.

### Resources Provisioned

- Default VPC with security group
- RDS MySQL instance (`db.t3.micro`)
- EC2 instance (`t2.micro`)
- S3 bucket for uploads
- IAM role and policy for EC2

### Usage

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Variables

| Variable            | Type         | Default         | Description                  |
|---------------------|--------------|-----------------|------------------------------|
| `region`            | string       | `us-east-1`     | AWS region                   |
| `environment`       | string       | —               | Deployment environment       |
| `db_password`       | string       | *(has default)* | Database password            |
| `instance_type`     | string       | `t2.micro`      | EC2 instance type            |
| `allowed_ssh_cidrs` | list(string) | `["0.0.0.0/0"]` | CIDR blocks allowed for SSH  |

## Environment Variables

The application uses the following environment variables (see `nodejs-app/.env`):

| Variable                | Description                |
|-------------------------|----------------------------|
| `DB_HOST`               | MySQL host                 |
| `DB_USER`               | MySQL username             |
| `DB_PASSWORD`           | MySQL password             |
| `DB_NAME`               | MySQL database name        |
| `JWT_SECRET`            | Secret for signing JWTs    |
| `AWS_ACCESS_KEY_ID`     | AWS access key             |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key             |
| `STRIPE_SECRET_KEY`     | Stripe API key             |

> **Note:** The `.env` file in this repository contains placeholder demo values. Never commit real credentials.
