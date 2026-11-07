output "api_endpoint" {
  value = module.api.api_endpoint
}

output "client_id" {
  value = module.auth.client_id
}

output "issuer_url" {
  value = module.auth.issuer_url
}

output "cloudfront_domain" {
  value = module.site.cloudfront_domain
}

output "bucket_name" {
  value = module.site.bucket_name
}

output "distribution_id" {
  value = module.site.distribution_id
}
