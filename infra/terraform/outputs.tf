output "cluster_name" {
  value = google_container_cluster.gke.name
}
output "cluster_region" {
  value = google_container_cluster.gke.location
}
output "vpc_name" {
  value = google_compute_network.vpc.name
}
output "subnet_name" {
  value = google_compute_subnetwork.gke.name
}
output "artifact_registry_repository" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
}
output "cloud_sql_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}
output "cloud_sql_private_ip" {
  value = google_sql_database_instance.postgres.private_ip_address
}
output "asset_bucket" {
  value = google_storage_bucket.assets.name
}
output "api_workload_service_account" {
  value = google_service_account.api.email
}
output "cloudbuild_service_account" {
  value = google_service_account.cloudbuild.email
}
output "github_token_secret_id" {
  value = google_secret_manager_secret.github_app_token.secret_id
}
