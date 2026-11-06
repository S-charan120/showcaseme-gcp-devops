# Showcaseme on GKE

This guide follows the same sequence used by the repository's deployment files: build the cloud foundation, connect Cloud Build to Artifact Registry, install the GitOps controller, and validate the running platform.

## Deployment phases

| Phase | Guide | Outcome |
|---|---|---|
| 1 | [GCP foundation](01-infrastructure.md) | VPC, private GKE nodes, Cloud NAT, Artifact Registry, private Cloud SQL, Cloud Storage and workload identities |
| 2 | [Build and GitOps](02-build-and-gitops.md) | Cloud Build, immutable image tags, Git promotion and Argo CD |
| 3 | [Operate and recover](03-operations.md) | Health checks, logs, autoscaling, TLS, rollback and common incident checks |

## End state

```text
Developer
   |
   v
GitHub (application + Helm values)
   |
   v
Cloud Build -----> Artifact Registry
   |                    |
   | updates image SHA  | kubelet pulls image
   v                    v
GitHub -------------> Argo CD -----> GKE
                                      |
                         +------------+------------+
                         |                         |
                      React/Nginx                Node API
                                                    |
                                  +-----------------+----------------+
                                  |                                  |
                              Cloud SQL                         Cloud Storage
                            (private IP)                       (private bucket)
```

## Before you start

- Use a dedicated GCP project with billing enabled.
- Confirm GKE, Cloud SQL, Cloud NAT, Artifact Registry and load-balancer quotas.
- Have a trusted public IPv4 CIDR for Kubernetes control-plane administration.
- Use a GitHub App installation token with access limited to this repository.
- Review the Terraform plan and current GCP pricing before creating resources.

The repository is a learning and portfolio environment. The steps do not create a live production service automatically, and they do not replace a security review or restore test.
