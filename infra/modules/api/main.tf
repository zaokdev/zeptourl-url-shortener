data "archive_file" "lambda_zip" {
  for_each    = local.lambdas
  type        = "zip"
  source_dir  = "${var.backend_path}/${each.key}"
  output_path = "${path.module}/.build/${each.key}.zip"
}

resource "aws_lambda_function" "lambda_functions" {
  for_each         = local.lambdas
  function_name    = "ZeptoURL-${var.env}-${each.key}"
  filename         = data.archive_file.lambda_zip[each.key].output_path
  source_code_hash = data.archive_file.lambda_zip[each.key].output_base64sha256
  role             = aws_iam_role.lambda_role[each.key].arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"

  environment {
    variables = {
      ENV = var.env
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  for_each = local.lambdas
  name     = "ZeptoURL-${var.env}-${each.key}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

}

resource "aws_iam_role_policy_attachment" "logs" {
  for_each   = local.lambdas
  role       = aws_iam_role.lambda_role[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

}

resource "aws_iam_role_policy" "dynamodb" {
  for_each = local.lambdas
  name     = "dynamodb"
  role     = aws_iam_role.lambda_role[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = each.value.actions
      Resource = each.value.resource_arn
    }]
  })
}

//API GATEWAY
resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "ZeptoURL_api-${var.env}"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = local.cors_config.allowed_origins
    allow_headers = local.cors_config.allowed_headers
    allow_methods = local.cors_config.allowed_methods
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  for_each               = local.lambdas
  api_id                 = aws_apigatewayv2_api.api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.lambda_functions[each.key].invoke_arn
  payload_format_version = "2.0"
}


resource "aws_apigatewayv2_route" "api_routes" {
  for_each  = local.lambdas
  api_id    = aws_apigatewayv2_api.api_gateway.id
  route_key = each.value.route
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"

  authorization_type = each.value.public ? "NONE" : "JWT"
  authorizer_id      = each.value.public ? null : aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "apigw" {
  for_each      = local.lambdas
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api_gateway.id
  name        = "$default"
  auto_deploy = true
  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format = jsonencode({
      requestId = "$context.requestId"
      time      = "$context.requestTime"
      ip        = "$context.identity.sourceIp"
      userAgent = "$context.identity.userAgent"
      route     = "$context.routeKey"
      status    = "$context.status"
      user      = "$context.authorizer.claims.sub"
      error     = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.api_gateway.id
  authorizer_type  = "JWT"
  name             = "cognito_authorizer-${var.env}"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    issuer   = var.issuer_url
    audience = [var.client_id]
  }
}

# Cloudwatch log group

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/ZeptoURL-${var.env}"
  retention_in_days = 14
}

