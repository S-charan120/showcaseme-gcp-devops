# The Kubernetes service account (KSA) is the principal that calls IAM Credentials
# signBlob when the Storage client creates V4 signed URLs.
resource "google_service_account_iam_member" "api_ksa_signer" {
  # Reference the managed resource so Terraform creates the GSA before its IAM binding.
  service_account_id = google_service_account.api.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[showcaseme/showcaseme-api]"
}
