provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "ZeptoURL"
      Environment = var.env
      ManagedBy   = "terraform"
    }
  }
}
