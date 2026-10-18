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
