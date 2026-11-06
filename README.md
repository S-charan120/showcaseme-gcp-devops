# Showcaseme — GCP DevOps Portfolio Platform

A portfolio project scaffold for a React-based portfolio UI and Node.js API, with infrastructure-as-code foundations for Google Cloud Platform (GCP), Google Kubernetes Engine (GKE), Artifact Registry, Helm, and Cloud Build.

## Repository layout

- `frontend/` — React portfolio application.
- `backend/` — Node.js/Express API with MongoDB integration.
- `infra/terraform/` — baseline GCP networking, GKE, Artifact Registry, and IAM resources.
- `deploy/helm/` — Helm charts for application workloads.
- `cloudbuild.yaml` — example Cloud Build pipeline.
- `docs/` — architecture, operations, security, and roadmap notes.

## Local development

Prerequisites: Docker Engine and Docker Compose.

```bash
docker compose -f deploy/docker-compose.yml up --build
```

Use the frontend and API URLs printed by Compose. Review the environment variables in the compose file before running.

## GCP deployment direction

1. Create a dedicated GCP project and enable billing and required APIs.
2. Configure Terraform state in a secured remote GCS bucket before team use.
3. Review IAM, network ranges, GKE access, and Workload Identity settings.
4. Provision infrastructure with Terraform in a non-production project.
5. Build and publish images to Artifact Registry.
6. Deploy workloads with Helm and configure Cloud Build triggers.

Do not apply infrastructure until you have reviewed `infra/terraform/` variables and security controls. Costs may be incurred by GKE, NAT, disks, load balancers, and Artifact Registry.

## Project status

This is a learning/portfolio scaffold, not a production-certified platform. Validate Terraform plans, pin provider and action versions, configure least-privilege IAM, secure remote state, use workload identity, enable image scanning that fails on policy violations, and add tests and monitoring before production use.

## Learning outcomes

- Containerize a full-stack application.
- Provision GCP infrastructure with Terraform.
- Deploy workloads to GKE using Helm.
- Build and publish containers with Cloud Build.
- Document operational, security, and troubleshooting practices.

## License

Educational and portfolio use. Add an explicit license before redistributing this project.