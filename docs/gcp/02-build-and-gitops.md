# Phase 2 — Cloud Build and Argo CD

The pipeline is defined in `ci/cloudbuild.yaml`. Cloud Build builds and publishes container images; Argo CD deploys them. Keeping those responsibilities separate makes the release path auditable.

## 1. Prepare Artifact Registry

Terraform creates the `showcaseme-images` Docker repository. The Cloud Build service account receives Artifact Registry Writer and logging permissions; the GKE node identity receives Artifact Registry Reader.

The image path follows this format:

```text
REGION-docker.pkg.dev/PROJECT_ID/showcaseme-images/api:FULL_COMMIT_SHA
REGION-docker.pkg.dev/PROJECT_ID/showcaseme-images/web:FULL_COMMIT_SHA
```

The Terraform-managed Docker repository enforces immutable tags. Cloud Build uses the full source commit SHA (`$COMMIT_SHA`) rather than the seven-character `$SHORT_SHA`; it checks for an existing image before publishing so retries do not attempt to overwrite an immutable tag. Do not use `latest` as a production release identifier.

## 2. Configure the GitHub App token

Terraform creates a Secret Manager secret and grants the Cloud Build service account access to that secret. Add a short-lived GitHub App installation token as a secret version.

Limit the GitHub App installation to this repository and the Contents read/write permission required to update the image tags. Do not use a personal access token with broad account or organization permissions.

## 3. Create the Cloud Build trigger

Create a trigger for the `main` branch with build configuration `ci/cloudbuild.yaml`. Use the Terraform output `cloudbuild_service_account`.

Recommended trigger paths:

- Include: `api/**`, `web/**`, `ci/cloudbuild.yaml`.
- Exclude: `deploy/helm/**`, `docs/**`, `infra/terraform/**`.

The exclusion for `deploy/helm/**` matters. Cloud Build writes an image-promotion commit to that directory; allowing this commit to retrigger the build would create an unnecessary loop.

## 4. Run the initial image promotion before Argo CD sync

The checked-in production Helm values use `bootstrap` tags as placeholders. After the trigger and GitHub App secret are configured, use the Cloud Build trigger's **Run** action against branch `main` once.

Wait for the build to test the API, build and push any missing images to Artifact Registry, and commit the resulting full source commit SHA tags to `deploy/helm/showcaseme/values-prod.yaml`. Confirm that both production image tags are no longer `bootstrap` and that the tagged images exist in Artifact Registry before the first Argo CD sync. This avoids an initial `ImagePullBackOff` caused by trying to pull placeholder tags.

## 5. Install Argo CD

Install Argo CD in the target GKE cluster using the official installation method for your chosen version. Configure repository access through a scoped GitHub App credential or another approved Git credential mechanism.

Connect to the cluster:

```bash
gcloud container clusters get-credentials CLUSTER_NAME --region REGION --project PROJECT_ID
kubectl get nodes
kubectl create namespace argocd
```

If Argo CD is already installed, do not recreate its namespace.

## 6. Configure application secrets and chart values

Create the application namespace and runtime secret:

```bash
kubectl create namespace showcaseme
kubectl -n showcaseme create secret generic showcaseme-runtime \
  --from-literal=DATABASE_URL='postgres://showcaseme_app:URL_ENCODED_PASSWORD@127.0.0.1:5432/showcaseme' \
  --from-literal=JWT_SECRET="$(openssl rand -base64 48)"
```

The Cloud SQL Auth Proxy sidecar listens on localhost:5432 within the API pod. The application database URL therefore uses 127.0.0.1, not the Cloud SQL private IP directly.

Before first sync, replace the `PROJECT_ID`, Cloud SQL connection name, bucket name, and example host in `deploy/helm/showcaseme/values-prod.yaml`. Do not put database passwords or JWT secrets in Helm values.

Cloud SQL creates the database and application user. Connect as the administrative database user and grant ownership to the application user so the migration process can create its tables:

```sql
ALTER DATABASE showcaseme OWNER TO showcaseme_app;
```

## 7. Apply the Argo CD application

```bash
kubectl apply -f deploy/argocd/application.yaml
kubectl -n argocd get applications
kubectl -n showcaseme get deployments,services,ingress
```

The Argo CD application tracks the chart in this repository and uses `values.yaml` plus `values-prod.yaml`. Once sync completes, check API and web readiness before pointing users at the hostname.

## 8. Configure HTTPS

Set `ingress.host` to an exact hostname you control, create a public DNS A record pointing to the GKE ingress address, and wait for the GKE ManagedCertificate to become Active. The bundled managed-certificate configuration is for an exact hostname; it does not provide wildcard subdomain certificates.
