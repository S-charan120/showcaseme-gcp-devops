# GCP infrastructure with Terraform

## Resources

- Custom VPC and regional GKE subnet with dedicated Pod and Service secondary ranges.
- Private GKE nodes, restricted control-plane authorized CIDR, Workload Identity, VPC-native networking, network policy, regular release channel, and workload/system logging and monitoring.
- Autoscaling GKE node pool with auto-repair/upgrade and shielded nodes.
- Cloud Router and Cloud NAT for private-node egress.
- Artifact Registry Docker repository.
- Cloud SQL for PostgreSQL with private IP only, private service access, automated backups, and point-in-time recovery. Regional HA is optional because it materially increases cost.
- Private Cloud Storage bucket with uniform bucket-level access, public access prevention, and object versioning.
- Dedicated API and Cloud Build identities. Workload Identity grants the API identity Cloud SQL access and narrowly scoped asset-object creation. Cloud Build receives Artifact Registry write and access to one GitHub App token secret.

## Prerequisites

- Dedicated GCP project, billing enabled, sufficient quotas, and permissions to create VPC, GKE, Cloud SQL, IAM, Secret Manager, and Artifact Registry resources.
- Terraform >= 1.6 and Google provider 6.x.
- A trusted operator IPv4 CIDR for GKE control-plane access.

## Remote state and sensitive values

Copy backend.tf.example to backend.tf and create the dedicated GCS state bucket before terraform init. Enable object versioning on that state bucket, restrict IAM, and never commit state files. State may contain database credentials. For shared environments, inject db_password via a secure CI secret rather than plaintext local tfvars. The gitignore excludes state and tfvars.

## Plan and apply

    cp terraform.tfvars.example terraform.tfvars
    # Edit project_id, admin_cidr and db_password. Never commit this file.
    terraform init
    terraform fmt -recursive
    terraform validate
    terraform plan -out=tfplan
    terraform show tfplan
    terraform apply tfplan

Review the plan and cost estimate before apply. GKE, nodes, Cloud NAT, Cloud SQL, storage and external HTTPS Load Balancing are billable. The default is one zonal Cloud SQL instance; set db_high_availability=true for regional HA.

## After apply

1. Add a short-lived GitHub App installation token (contents:write only for this repository) as a new version of the Secret Manager secret output by Terraform.
2. Configure the Cloud Build trigger to use the cloudbuild_service_account output and trigger only when api/**, web/**, or ci/cloudbuild.yaml changes. Do not trigger on deploy/helm/**; the promotion commit must not recursively trigger another build.
3. Create Kubernetes Secret showcaseme-runtime in namespace showcaseme with DATABASE_URL and JWT_SECRET. Example URL: postgres://showcaseme_app:URL_ENCODED_PASSWORD@127.0.0.1:5432/showcaseme. Cloud SQL Auth Proxy runs as a sidecar and uses private IP.
4. Set chart values api.cloudSql.connectionName, api.env.GCS_BUCKET, api.env.GOOGLE_CLOUD_PROJECT, and API Google service account annotation from Terraform outputs.
5. Install Argo CD, configure a repository credential using a scoped GitHub App token, then apply deploy/argocd/application.yaml.
6. Set ingress.host to a domain you control, create a DNS A record to the ingress IP, and wait for the GKE-managed certificate to become Active.

## Security and operating notes

The control-plane endpoint is public but restricted to admin_cidr; worker nodes have private IPs only. Do not widen this CIDR to 0.0.0.0/0. Terraform state and database credentials are sensitive. Confirm IAM, firewall behaviour, Cloud SQL backup/restore, certificate provisioning, quotas and costs in a disposable project before production use. Run destroy only after reviewing deletion protection and data-retention requirements.
