locals {

  cors_config = {
    allowed_origins = [
      "http://localhost:5173",
      "https://${var.site_domain}",
    ],
    allowed_headers = ["authorization", "content-type"],
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
  lambdas = {
    redirect = {
      route        = "GET /{code}"
      public       = true
      actions      = ["dynamodb:GetItem"]
      resource_arn = var.table_arn
    }
    create = {
      route        = "POST /links"
      public       = false
      actions      = ["dynamodb:PutItem"]
      resource_arn = var.table_arn
    }
    list   = { route = "GET /links", public = false, actions = ["dynamodb:Query"], resource_arn = "${var.table_arn}/index/*" }
    delete = { route = "DELETE /links/{code}", public = false, actions = ["dynamodb:DeleteItem"], resource_arn = var.table_arn }
  }
}
