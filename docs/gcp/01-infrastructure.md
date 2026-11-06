# Phase 1 — GCP infrastructure

Terraform is in `infra/terraform/`. It provisions the VPC foundation, GKE cluster and node pool, Artifact Registry, private Cloud SQL, private Cloud Storage, service accounts and monitoring alerts.

## 1. Prepare the project

Set the project and region you intend to use:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services list --enabled
```

The Terraform configuration enables the APIs it uses. Billing must already be active, and the operator running Terraform needs sufficient project permissions.

## 2. Configure remote state

Create a dedicated GCS bucket for Terraform state before initializing Terraform. Enable object versioning and limit bucket access to the people and automation identities that need it.

Copy `infra/terraform/backend.tf.example` to `infra/terraform/backend.tf` and replace the bucket placeholder. The backend file is ignored by Git. Do not commit state files; Terraform state can contain sensitive values.

## 3. Configure variables

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

Set these values in your local tfvars or inject them through a secure CI secret:

- `project_id`: your GCP project ID.
- `admin_cidr`: your trusted public IPv4 address with a /32 mask; do not use 0.0.0.0/0.
- `db_password`: a strong unique password for the application database user.
- Adjust region, zone, machine type and node count for your chosen region and budget.

The example tfvars file is ignored by Git. Do not commit it or paste the database password into documentation or issue comments.

## 4. Review and apply

```bash
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
```

Review the plan for resource names, IP ranges, deletion protection, IAM bindings and estimated costs before applying. The configuration defaults to a zonal Cloud SQL instance to keep the learning environment smaller; regional HA costs more.

## 5. Review outputs

```bash
terraform output
```

Keep the following outputs for the next phase:

- `cluster_name` and `cluster_region`
- `artifact_registry_repository`
- `cloud_sql_connection_name`
- `asset_bucket`
- `api_workload_service_account`
- `cloudbuild_service_account`
- `github_token_secret_id`

## 6. Understand the network boundary

- GKE worker nodes have private addresses and use Cloud NAT for egress.
- The cluster control plane uses a public endpoint restricted to `admin_cidr`.
- The VPC subnet has separate Pod and Service secondary ranges.
- Cloud SQL has private IP only and uses private service access.
- The asset bucket has uniform bucket-level access and Public Access Prevention.
- The API uses Workload Identity instead of a downloaded service-account key.

## 7. Cost and cleanup

GKE nodes, Cloud NAT, Cloud SQL, external HTTPS load balancing and storage can incur charges even when traffic is low. Stop or destroy resources you no longer need, but review deletion protection and data-retention requirements first. Cloud SQL deletion protection is enabled by default; removing it is an explicit operational decision.
