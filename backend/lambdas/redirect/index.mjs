import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

/**
 * @param {string} code
 */
const getUrlByCode = async (code) => {
  const { Item: item } = await docClient.send(
    new GetCommand({
      TableName: `ZeptoURL_urls-${process.env.ENV}`,
      Key: { code },
    }),
  );
  return item;
};

//@ts-ignore
export const handler = async (event) => {
  try {
    const code = event.pathParameters.code;
    const item = await getUrlByCode(code);
    if (!item) {
      return {
        statusCode: 404,
        headers: { "Cache-Control": "no-store" },
        body: "Url Not Found",
      };
    }

    return {
      statusCode: 302,
      headers: { Location: item.url, "Cache-Control": "public, max-age=60" },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
