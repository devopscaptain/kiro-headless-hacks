# ISSUE: Variables defined but not used — hardcoded values in main.tf instead

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  # ISSUE: No validation block to restrict to known environments
}

variable "db_password" {
  description = "Database password"
  type        = string
  # ISSUE: No sensitive = true flag
  # ISSUE: Has a default password — should be required with no default
  default = "SuperSecret123!"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  # ISSUE: Defaults to open access
  default = ["0.0.0.0/0"]
}
