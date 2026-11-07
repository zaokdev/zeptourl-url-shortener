module "data" {
  source = "../../modules/data"

  env = var.env
}

module "api" {
  source = "../../modules/api"

  backend_path = "${path.root}/../../../backend/lambdas"
  table_arn    = module.data.table_arn
  table_name   = module.data.table_name
  env          = var.env
  client_id    = module.auth.client_id
  issuer_url   = module.auth.issuer_url
  site_domain  = module.site.cloudfront_domain

}

module "auth" {
  source = "../../modules/auth"
  env    = var.env

}

module "site" {
  source = "../../modules/site"

  env = var.env
}
