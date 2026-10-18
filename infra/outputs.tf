output "ip" {
  value = google_compute_address.ycc.address
}

output "site_url" {
  value = "https://${local.site_address}"
}

output "kakao_redirect_uri" {
  value = "https://${local.site_address}/login/oauth2/code/kakao"
}

output "registry" {
  value = local.registry
}

output "github_workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}

output "github_deploy_service_account" {
  value = google_service_account.deploy.email
}
