# System architecture

## Product flow

The React application provides account registration/sign-in, a profile editor, experience and project capture, skills, template selection, draft management, publish/unpublish, and a public portfolio view. The frontend selects a public portfolio with the `?portfolio=<slug>` query parameter and loads its data from the API endpoint `/api/public/:slug`; it does not implement a clean `/<slug>` path or per-user subdomains. Dynamic per-user hostnames require a separate DNS/certificate design; the bundled GKE ManagedCertificate is configured for an exact hostname.

## Runtime components

- React SPA, served by Nginx.
- Node.js/Express REST API with short-lived JWT access tokens, password hashing, ownership-scoped portfolio CRUD, and validation.
- Cloud SQL for PostgreSQL stores account and portfolio data. SQL migrations are applied by the API at startup.
- Cloud Storage stores optional portfolio assets. The API issues short-lived signed upload URLs; the bucket stays private.
- GKE hosts API and web Deployments. Helm provides probes, rolling updates, CPU/memory requests and limits, HPA, PDB, Kubernetes ServiceAccounts, NetworkPolicy and ingress.
- Cloud SQL Auth Proxy runs as a sidecar in each API pod and connects to the instance over private IP. The pod's Kubernetes ServiceAccount is mapped to a Google service account through Workload Identity.
- Cloud Build tests and builds immutable container images, pushes them to Artifact Registry, and promotes those image tags in Git. Argo CD reconciles the Helm release from Git.

## Network boundaries

The VPC uses a custom subnet and separate secondary Pod and Service ranges. GKE worker nodes have private IPs and use Cloud NAT for controlled outbound access. The GKE control-plane endpoint is restricted to a trusted administrator CIDR. Cloud SQL has no public IPv4 address and is exposed only through private service access. Cloud Storage has uniform bucket-level access and Public Access Prevention.

## Resilience and scaling

Kubernetes readiness/liveness probes prevent unhealthy pods receiving traffic and detect failed processes. Rolling updates set maxUnavailable=0. API and web HPA scale on CPU utilization; the node pool has cluster autoscaling. PodDisruptionBudgets protect minimum serving capacity during voluntary disruptions. Cloud SQL automated backups and point-in-time recovery are enabled; restore testing remains an operator responsibility.
