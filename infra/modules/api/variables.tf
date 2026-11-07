variable "table_arn" {
  description = "ARN URL table"
  type        = string
}

variable "table_name" {
  description = "Table name"
  type        = string
}

variable "backend_path" {
  description = "backend path"
  type        = string

}
variable "issuer_url" {
  description = "Issuer URL"
  type        = string
}

variable "client_id" {
  description = "Client Pool ID"
  type        = string
}

variable "env" {
  description = "Environment"
  type        = string
}

variable "site_domain" {
  description = "CloudFront domain of the frontend, used for CORS"
  type        = string
}
