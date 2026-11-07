# Release, promotion and rollback

## Release identity

Every API and web image is tagged with the full 40-character source commit SHA (`$COMMIT_SHA`). Deployments do not use the mutable latest tag. Cloud Build first tests the API, reuses any immutable images already published for the source commit, builds and publishes missing images exactly once, then updates both production image tags in the Helm values file using a narrowly scoped GitHub App token stored in Secret Manager.

## Approval and promotion

For a learning environment, automatic main-branch promotion is enabled. For a team production environment, protect main, require review for changes under deploy/helm, and make the promotion bot use a constrained branch/pull-request workflow. Argo CD remains the sole deployment controller.

## Rollback

1. Identify the last known-good image SHA from Argo CD history and Cloud Build.
2. Revert the promotion commit that introduced the failing SHA.
3. Confirm Argo CD syncs the old tag.
4. Verify readiness, liveness, ingress and error/latency signals.
5. Record the incident, root cause and corrective action.

Database schema changes should follow expand/migrate/contract so old and new application versions can safely coexist during rollback.
