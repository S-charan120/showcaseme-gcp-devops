# CI/CD and GitOps

## Build sequence

1. A Cloud Build trigger watches application and CI paths on main. API dependencies are installed with `npm install` because this repository does not commit an API package lockfile; CI resolves the declared semver ranges at build time.
2. API tests and syntax checks must pass before image builds.
3. Docker builds the API and React/Nginx images and tags both with the full 40-character source commit SHA (`$COMMIT_SHA`).
4. Cloud Build checks whether each immutable Artifact Registry tag already exists. It builds and pushes only missing images, so rerunning a partially completed build safely reuses images already published for that commit.
5. A dedicated GitHub App installation token is read from Secret Manager. The pipeline updates both image tags in the Git-managed production Helm values file and pushes a promotion commit.
6. The promotion step checks the current production tags and Git ancestry so an older build cannot roll back a newer promotion; Argo CD tracks the repository path and automatically reconciles Helm to GKE.

## Required trigger settings

- Repository: S-charan120/showcaseme-gcp-devops
- Branch: main
- Build config: ci/cloudbuild.yaml
- Service account: the Terraform output cloudbuild_service_account
- Included paths: api/**, web/**, ci/cloudbuild.yaml
- Excluded paths: deploy/helm/**, docs/**, infra/terraform/**

This path filter is essential: the promotion commit changes deploy/helm and must not recursively start another build.

## Pipeline identity and permissions

The GitHub App installation token should be short-lived and restricted to Contents: Read and write for this one repository. Store it in the Secret Manager secret created by Terraform. Cloud Build uses a dedicated service account with Artifact Registry Writer, Logs Writer, and access to that one secret. Do not use a personal access token with broad organization permissions.

The Cloud Build trigger must be created with permission to act as the Terraform-created service account. Confirm the trigger identity and IAM binding before the first build.

## GitOps controls

Argo CD is the deployment controller. Production image tags are immutable SHAs. Changes to chart or production values must be reviewed through Git. Rollback by reverting the image promotion commit and allowing Argo CD to reconcile. Do not use a direct Helm upgrade or kubectl patch in production; those introduce drift.
