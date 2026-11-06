# Troubleshooting guide

| Symptom | Likely causes | Checks |
|---|---|---|
| Cloud Build cannot push | Wrong region/repository or missing Artifact Registry role | Check image URI, Artifact Registry API, Cloud Build service account IAM |
| Promotion step fails | GitHub App token expired or missing Contents write | Check Secret Manager version and app installation repository permission |
| Argo CD does not deploy | Path filter, repository credentials, branch/path mismatch | Check Application source, repo credential, main branch and sync errors |
| Pods ImagePullBackOff | Wrong project/repository/image SHA or node role | Confirm artifact path/tag and node service account Artifact Registry Reader |
| API readiness fails | SQL proxy, secret, DB, migration issue | Inspect API + proxy logs, secret keys, Workload Identity and Cloud SQL connection name |
| Upload URL fails | GCS IAM signer permissions or bucket mismatch | Verify Storage Object Creator, Token Creator/signBlob, GCS_BUCKET and short URL expiry |
| Ingress has no healthy backend | Service port, pod readiness or GKE ingress health check | Check web Service/Pod and ingress backend health |
| TLS certificate inactive | DNS record mismatch or backend not provisioned | Confirm public A record, host, ManagedCertificate status and ingress IP |
| HPA does not scale | Metrics absent or no CPU requests | Confirm metrics server/Cloud Monitoring and container resource requests |
| Pod evictions / capacity issues | Requests too low, node pool max too small | Inspect events, requests, autoscaler status and quota limits |
