# Showcaseme — Portfolio Building & Publishing Platform

Showcaseme enables professionals to create and publish personalized portfolios using profile details, experience, projects, skills and profession-oriented layouts. This repository pairs the application with a GCP delivery platform that follows the project architecture in my GCP DevOps resume.

## Resume-aligned stack

React · Node.js REST API · Docker · GCP · GKE · Cloud Build · Artifact Registry · Helm · Argo CD · Terraform · VPC · IAM · Workload Identity · Cloud SQL (PostgreSQL) · Cloud Storage · Cloud Logging · Cloud Monitoring.

## Delivery path

1. A source change triggers Cloud Build. API unit tests and syntax checks run before images are built.
2. Cloud Build builds API and web images and publishes immutable commit-SHA tags to Artifact Registry.
3. The pipeline promotes those exact image tags in the Git-managed Helm values file.
4. Argo CD detects the Git change and reconciles Helm resources on GKE.
5. Terraform provisions a custom VPC, segmented GKE subnet and secondary ranges, Cloud NAT, private-node GKE, autoscaling node pool, Artifact Registry, service accounts, private Cloud SQL, and a private Cloud Storage bucket.
6. The API uses a Kubernetes ServiceAccount mapped through Workload Identity to narrowly scoped Google service-account permissions. Cloud SQL is accessed through the Cloud SQL Auth Proxy sidecar over private IP.

## Repository map

- `api/` — Node.js REST API, auth, portfolio management, signed Cloud Storage upload URLs, SQL migrations and tests.
- `web/` — React profile builder, authenticated content management, public portfolio renderer and Nginx reverse proxy.
- `infra/terraform/` — reusable GCP infrastructure foundation.
- `deploy/helm/showcaseme/` — reusable Kubernetes chart with probes, resource sizing, HPA, PDB, NetworkPolicy and HTTPS ingress.
- `deploy/argocd/` — Argo CD Application for GitOps reconciliation.
- `ci/cloudbuild.yaml` — test, build, publish and GitOps promotion pipeline.
- `docs/` — architecture, setup, runbook, security, CI/CD, release/rollback, and troubleshooting.

## Local development

Prerequisites: Docker Engine and Docker Compose.

```bash
cp .env.example .env
# Set JWT_SECRET to a unique random value of at least 32 bytes.
docker compose up --build
```

Open `http://localhost:8080`. API liveness is `/api/health`; readiness is `/api/ready`. PostgreSQL is persisted in a named Docker volume. Local mode supports profile editing and slug-based public pages. Cloud Storage signed uploads require Application Default Credentials and a configured bucket.

## GCP deployment overview

1. Create a dedicated GCP project with billing enabled. The Terraform configuration enables the required APIs.
2. Configure the remote GCS Terraform backend using `infra/terraform/backend.tf.example`. Keep state access restricted; state can contain sensitive infrastructure values.
3. Copy `terraform.tfvars.example` to `terraform.tfvars`; set the project ID, region, a narrow administrator CIDR, and a strong database password through a secure variable injection mechanism.
4. Run `terraform init`, `terraform validate`, `terraform plan`, inspect the plan and cost estimate, then apply in a non-production project.
5. Create a short-lived GitHub App installation token secret in Secret Manager. Configure the Cloud Build trigger to use the dedicated Cloud Build service account and run only for application/CI paths so the deployment-values commit does not retrigger itself.
6. Configure PostgreSQL database ownership: connect as the Cloud SQL administrative user and run `ALTER DATABASE showcaseme OWNER TO showcaseme_app;` so the application role can create its migration tables. Create Kubernetes Secret `showcaseme-runtime` with `DATABASE_URL` and `JWT_SECRET`. Set `GCS_BUCKET` to the Terraform output. Apply Argo CD after Argo CD is installed in the target cluster.
7. Configure the exact DNS hostname and domain in Helm values for the GKE-managed HTTPS certificate. Wait for certificate provisioning before switching user traffic.
8. Validate rollout health, autoscaler behaviour, Cloud Logging entries, Cloud Monitoring alerts, Cloud SQL backups and a restore drill.

## Release and rollback

Images are tagged with the source commit SHA; do not use `latest` for release promotion. Cloud Build publishes both images and updates the matching immutable tags in `deploy/helm/showcaseme/values-prod.yaml`. Argo CD is the only production deployment controller. For rollback, revert the promotion commit; Argo CD reconciles the prior chart values. Do not make drift-inducing imperative production changes with `kubectl edit`.

## Important deployment note

This repository is an implementation and reproducible deployment blueprint, not evidence that GCP resources are already provisioned or that the service has passed a production certification. Terraform, GKE policies, Cloud SQL connectivity, IAM scopes, pipeline credentials, DNS and certificate configuration must be validated in your own GCP project. GKE, Cloud NAT, Cloud SQL, external HTTPS load balancing and logging/monitoring can incur charges. Review `docs/security.md` and `infra/terraform/README.md` before applying resources.
