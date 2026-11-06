# Platform operations runbook

## Release health

- Check Cloud Build status and identify the source SHA, image tags and promotion commit.
- Check Argo CD Application health and sync status. Confirm the desired revision is the promotion commit.
- Check Deployments, HPA, PDB, Services and Ingress in namespace showcaseme.
- Verify the GKE managed certificate status and HTTPS ingress backend health.
- Check API /health (liveness) and /ready (database readiness).

## Common incidents

### API pods restart or fail readiness
Inspect container logs and events. Check the Cloud SQL Auth Proxy sidecar logs, Workload Identity annotation, GSA roles/cloudsql.client binding, connection name, private VPC route, Secret keys and SQL migration errors. Confirm Cloud SQL instance state and private IP.

### Database connection failures
Confirm DATABASE_URL points to localhost:5432 because the proxy shares the pod network namespace. Ensure the sidecar uses the correct instance connection name and --private-ip. Verify the Kubernetes service account is mapped to the API Google service account and that the latter has Cloud SQL Client. Do not add a public Cloud SQL IP as a workaround.

### Asset upload URL errors
Check GCS_BUCKET, bucket name, Workload Identity, storage object creator permission and IAM Service Account Token Creator/signBlob permission. Signed URLs expire after ten minutes. Do not make the bucket public to fix upload failures.

### Argo CD OutOfSync
Check the Git promotion commit and chart values. Inspect Argo CD render/sync errors and Kubernetes events. Resolve the Git source of truth and allow reconciliation; do not patch the live Deployment to mask a bad values file.

### HTTPS certificate stays Provisioning
Confirm the ingress host is a public DNS A record pointing to the GKE ingress IP, the ManagedCertificate domain exactly matches ingress.host, and the load balancer has a healthy backend. DNS and managed certificate propagation can take time.

## Rollback

Revert the latest image promotion commit on main. Argo CD will reconcile the prior immutable image tags. Confirm the old ReplicaSet is ready and ingress serves traffic. If a database migration is not backward compatible, use the documented forward-fix procedure; do not assume image rollback reverses schema changes.

## Data recovery

Cloud SQL automated backups and point-in-time recovery are configured. Perform periodic restore drills in an isolated instance and record RPO/RTO. Bucket object versioning is enabled; test recovery of an object version. Never destroy production data resources as part of an application rollback.
