output "client_id" {
  value = aws_cognito_user_pool_client.client.id
}

output "issuer_url" {
  value = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.app_pool.id}"
}

data "aws_region" "current" {}
