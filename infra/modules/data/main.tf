//Table links: partition key code (string). Attributes: url, createdAt, ownerId

resource "aws_dynamodb_table" "urls_shortener" {
  name         = "ZeptoURL_urls-${var.env}"
  hash_key     = "code"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "code"
    type = "S"
  }
  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "ownerId"
    type = "S"
  }

  global_secondary_index {
    name            = "ZeptoURL_urls_GSI_by_owner-${var.env}"
    projection_type = "ALL"
    key_schema {
      attribute_name = "ownerId"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "createdAt"
      key_type       = "RANGE"
    }
  }
}
