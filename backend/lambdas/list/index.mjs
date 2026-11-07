import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.jwt.claims.sub;

    const { Items: items = [] } = await docClient.send(
      new QueryCommand({
        TableName: `ZeptoURL_urls-${process.env.ENV}`,
        IndexName: `ZeptoURL_urls_GSI_by_owner-${process.env.ENV}`,
        KeyConditionExpression: "ownerId = :o",
        ExpressionAttributeValues: { ":o": ownerId },
        ScanIndexForward: false,
      }),
    );

    return json(200, { items });
  } catch (error) {
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
