import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.jwt.claims.sub;
    const code = event.pathParameters.code;

    await docClient.send(
      new DeleteCommand({
        TableName: `ZeptoURL_urls-${process.env.ENV}`,
        Key: { code },
        ConditionExpression: "ownerId = :o",
        ExpressionAttributeValues: { ":o": ownerId },
      }),
    );

    return { statusCode: 204 };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return json(404, { message: "Url Not Found" });
    }
    console.error(error);
    return json(500, { message: "Internal Server Error" });
  }
};

//Helpers
const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
