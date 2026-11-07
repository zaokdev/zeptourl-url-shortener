output "table_arn" {
  value = aws_dynamodb_table.urls_shortener.arn
}
output "table_name" {
  value = aws_dynamodb_table.urls_shortener.name
}
