# ISSUE: No required_version constraint for Terraform
# ISSUE: No backend configuration — state stored locally
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0" # ISSUE: Major version behind (5.x is current)
    }
  }
}

# ISSUE: Hardcoded credentials instead of using environment/profile
provider "aws" {
  region     = "us-east-1"
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

# ---------- VPC ----------

# ISSUE: Using default VPC instead of creating a proper one
resource "aws_default_vpc" "main" {
  tags = {
    Name = "default-vpc"
  }
}

# ---------- Security Groups ----------

resource "aws_security_group" "api" {
  name        = "api-sg"
  description = "Security group for API servers"
  vpc_id      = aws_default_vpc.main.id

  # ISSUE: Allows SSH from anywhere
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # ISSUE: Allows all traffic on app port from anywhere
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "API access"
  }

  # ISSUE: Overly permissive egress
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # ISSUE: No tags for cost tracking or ownership
}

# ---------- RDS ----------

resource "aws_db_instance" "main" {
  identifier     = "kiro-demo-db"
  engine         = "mysql"
  engine_version = "5.7" # ISSUE: End-of-life MySQL version
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 0 # ISSUE: Auto-scaling disabled

  db_name  = "kiro_demo"
  username = "admin"
  password = "SuperSecret123!" # ISSUE: Hardcoded password in plain text

  # ISSUE: Publicly accessible database
  publicly_accessible = true

  # ISSUE: No encryption at rest
  storage_encrypted = false

  # ISSUE: No multi-AZ for production
  multi_az = false

  # ISSUE: No backup retention
  backup_retention_period = 0

  # ISSUE: Deletion protection disabled
  deletion_protection = false

  # ISSUE: No final snapshot before deletion
  skip_final_snapshot = true

  # ISSUE: No performance insights
  performance_insights_enabled = false

  # ISSUE: No enhanced monitoring
  monitoring_interval = 0

  vpc_security_group_ids = [aws_security_group.api.id]

  tags = {
    Name = "kiro-demo-db"
  }
}

# ---------- EC2 ----------

resource "aws_instance" "api" {
  ami           = "ami-0c55b159cbfafe1f0" # ISSUE: Hardcoded AMI, region-specific
  instance_type = "t2.micro"              # ISSUE: Previous gen instance type

  # ISSUE: No key pair specified — can't SSH in for debugging
  # ISSUE: Using the overly permissive security group
  vpc_security_group_ids = [aws_security_group.api.id]

  # ISSUE: No IAM instance profile — app can't access AWS services securely
  # ISSUE: No EBS optimization

  # ISSUE: User data with secrets in plain text, visible in instance metadata
  user_data = <<-EOF
    #!/bin/bash
    export DB_PASSWORD="SuperSecret123!"
    export JWT_SECRET="my-super-secret-jwt-key-do-not-share"
    cd /app && npm start
  EOF

  # ISSUE: No detailed monitoring
  monitoring = false

  # ISSUE: Root volume not encrypted, no custom size
  root_block_device {
    volume_type = "gp2" # ISSUE: gp2 instead of gp3
    volume_size = 8
    encrypted   = false
  }

  # ISSUE: Metadata service v1 enabled (SSRF risk)
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "optional" # ISSUE: Should be "required" for IMDSv2
  }

  tags = {
    Name = "kiro-demo-api"
    # ISSUE: No Environment, Team, or CostCenter tags
  }
}

# ---------- S3 ----------

resource "aws_s3_bucket" "uploads" {
  bucket = "kiro-demo-uploads"

  # ISSUE: No tags
}

# ISSUE: No bucket versioning
# ISSUE: No lifecycle rules for cost management

# ISSUE: Public access not explicitly blocked
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = false # ISSUE: Should be true
  block_public_policy     = false # ISSUE: Should be true
  ignore_public_acls      = false # ISSUE: Should be true
  restrict_public_buckets = false # ISSUE: Should be true
}

# ISSUE: No server-side encryption configuration
# ISSUE: No bucket policy restricting access
# ISSUE: No access logging enabled

# ---------- IAM ----------

# ISSUE: Overly permissive IAM role
resource "aws_iam_role" "api_role" {
  name = "kiro-demo-api-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        # ISSUE: No condition keys (e.g., source account, org ID)
      }
    ]
  })
}

# ISSUE: Wildcard permissions — grants full access to everything
resource "aws_iam_role_policy" "api_policy" {
  name = "kiro-demo-api-policy"
  role = aws_iam_role.api_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "*"
        Resource = "*"
      }
    ]
  })
}

# ---------- Outputs ----------

# ISSUE: Outputs sensitive data
output "db_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "db_password" {
  value = aws_db_instance.main.password
  # ISSUE: Not marked as sensitive
}

output "api_public_ip" {
  value = aws_instance.api.public_ip
}
