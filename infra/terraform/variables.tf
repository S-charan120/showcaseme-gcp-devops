variable "project_id" {
  description = "Dedicated GCP project ID"
  type        = string
}

variable "region" {
  description = "Primary GCP region"
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "Primary GKE node zone"
  type        = string
  default     = "asia-south1-a"
}

variable "network_name" {
  type    = string
  default = "showcaseme-vpc"
}

variable "subnet_name" {
  type    = string
  default = "showcaseme-gke-subnet"
}

variable "cluster_name" {
  type    = string
  default = "showcaseme-gke"
}

variable "node_machine_type" {
  type    = string
  default = "e2-standard-2"
}

variable "node_min_count" {
  type    = number
  default = 1
}

variable "node_max_count" {
  type    = number
  default = 3
}

variable "admin_cidr" {
  description = "Trusted operator public IPv4 CIDR allowed to reach GKE control plane"
  type        = string
  validation {
    condition     = can(cidrhost(var.admin_cidr, 0)) && var.admin_cidr != "0.0.0.0/0"
    error_message = "Use a valid, narrow administrator CIDR; 0.0.0.0/0 is prohibited."
  }
}

variable "db_instance_name" {
  type    = string
  default = "showcaseme-postgres"
}

variable "db_tier" {
  description = "Cloud SQL machine tier; select a tier appropriate to the workload and budget"
  type        = string
  default     = "db-custom-1-3840"
}

variable "db_password" {
  description = "Strong PostgreSQL application user password; Terraform state remains sensitive"
  type        = string
  sensitive   = true
}

variable "db_high_availability" {
  description = "Enable regional Cloud SQL HA; this materially increases cost"
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  type    = bool
  default = true
}

variable "cluster_deletion_protection" {
  type    = bool
  default = true
}

variable "github_app_token_secret_id" {
  description = "Secret Manager secret holding a short-lived GitHub App installation token"
  type        = string
  default     = "showcaseme-github-app-token"
}
