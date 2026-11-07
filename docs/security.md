# Security controls and production checklist

## Implemented foundations

- API password hashing with bcryptjs, email uniqueness and short-lived JWT bearer sessions.
- Owner-scoped portfolio reads and writes; public routes only return published portfolios.
- Strict payload bounds, slug allowlist, HTTPS-only project links, Helmet security headers, JSON body limits and rate-limited API/auth endpoints.
- No hard-coded production passwords or tokens. Runtime secrets are injected from a Kubernetes Secret; local secrets are excluded by gitignore.
- GKE private worker nodes, restricted master authorized networks, network policy, Workload Identity, dedicated node/API/Cloud Build service accounts and least-privilege role bindings.
- Cloud SQL private IP, Cloud SQL Auth Proxy, automated backups/PITR.
- Cloud Storage uniform bucket-level access, Public Access Prevention and signed short-lived upload URLs.
- Non-root containers, read-only root filesystem where practical, dropped Linux capabilities, resource sizing, probes and PodDisruptionBudgets.
- Cloud Build immutable SHA image tags; GitOps promotion and Argo CD reconciliation.

## Required before public production

- Add refresh-token rotation or a managed identity provider, verified email, account recovery, MFA and abuse detection.
- Set production JWT secret through a secret manager CSI or external-secrets integration and rotate it. Do not use local example secrets.
- Add project-specific asset ownership checks, upload size enforcement, malware scanning, content moderation and bucket CORS restricted to the real domains.
- Configure a production TLS policy, managed certificate and DNS; validate HTTP-to-HTTPS redirect.
- Attach Cloud Monitoring notification channels and tune error, latency and restart thresholds for your service SLO.
- Pin container base images and GitHub Action versions to digests/SHAs, scan dependencies and images, produce an SBOM, and sign image provenance.
- Enable audit logs, access reviews, log retention, vulnerability response, restore drills and periodic IAM review.
- Add integration, end-to-end, load and penetration tests. Validate HPA thresholds and Cloud SQL capacity using realistic workload profiles.

These platform patterns are not a regulatory compliance certification. Complete security testing, operational ownership, monitoring destinations, DNS/TLS and cloud restore drills for your environment.
