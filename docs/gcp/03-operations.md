# Phase 3 — Operations and recovery

## 1. Check the rollout

```bash
kubectl -n showcaseme get pods -o wide
kubectl -n showcaseme get deployments,services,ingress
kubectl -n showcaseme get hpa,pdb
kubectl -n showcaseme describe deployment showcaseme-api
```

Check both API and web Deployments. Readiness probes should pass before traffic is sent to a pod. The API readiness endpoint also verifies database connectivity.

## 2. Inspect application logs

```bash
kubectl -n showcaseme logs deployment/showcaseme-api -c api --tail=100
kubectl -n showcaseme logs deployment/showcaseme-api -c cloud-sql-proxy --tail=100
kubectl -n showcaseme logs deployment/showcaseme-web --tail=100
```

Use Cloud Logging for centralized workload and system logs. The Terraform configuration also defines alert policies for application error events, pod restarts and HTTPS backend latency. Attach notification channels in the GCP console or Terraform before relying on alerts for incident response.

## 3. Check the GitOps source of truth

```bash
kubectl -n argocd get application showcaseme
kubectl -n argocd describe application showcaseme
```

The desired revision should match the Git commit that updated production image tags. Resolve configuration drift in Git and let Argo CD reconcile; do not patch a production Deployment manually.

## 4. Common failure checks

| Symptom | Check |
|---|---|
| API readiness fails | API logs, SQL proxy logs, runtime secret, Cloud SQL connection name, Workload Identity and database permissions |
| ImagePullBackOff | Image SHA, Artifact Registry path, region, node service-account Artifact Registry Reader permission |
| Argo CD OutOfSync | Git revision, repository credential, Helm render error and values file |
| HPA stays at minimum | CPU requests, metrics availability and actual pod utilization |
| HTTPS certificate not active | DNS A record, exact hostname, ingress backend health and ManagedCertificate status |
| Asset upload URL fails | Bucket name, Workload Identity, Storage Object Creator and signBlob permission |

## 5. Roll back an application release

Find the commit that promoted the failing image SHA and revert it:

```bash
git log --oneline -- deploy/helm/showcaseme/values-prod.yaml
git revert <PROMOTION_COMMIT>
git push origin main
```

Argo CD detects the revert and reconciles the previous image tags. Confirm the old ReplicaSet is healthy and the HTTPS backend is serving requests.

Do not treat an image rollback as a database rollback. Use backward-compatible schema changes and the Cloud SQL restore procedure for data recovery.

## 6. Restore testing

Cloud SQL automated backups and point-in-time recovery are configured. Run periodic restore drills into a separate instance and record the recovery point and recovery time achieved. Cloud Storage object versioning is enabled; test recovery of a previous object version. A backup configuration is not evidence of a successful restore until it has been exercised.
