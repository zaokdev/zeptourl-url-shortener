resource "aws_cognito_user_pool" "app_pool" {
  name                     = "ZeptoURL_pool-${var.env}"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 10
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }
}

resource "aws_cognito_user_pool_client" "client" {
  user_pool_id = aws_cognito_user_pool.app_pool.id
  name         = "ZeptoURL_client-${var.env}"

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",

  ]

  prevent_user_existence_errors = "ENABLED"
}
