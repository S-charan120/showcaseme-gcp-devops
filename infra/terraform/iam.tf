# The Kubernetes service account (KSA) is the principal that calls IAM Credentials
# signBlob when the Storage client creates V4 signed URLs.
resource "google_service_account_iam_member" "api_ksa_signer" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/showcaseme-api@${var.project_id}.iam.gserviceaccount.com"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[showcaseme/showcaseme-api]"
}
