import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomInt } from "node:crypto";

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
  try {
    const ownerId = event.requestContext.authorizer.jwt.claims.sub;

    let body;
    try {
      body = JSON.parse(event.body ?? "{}");
    } catch {
      return json(400, { message: "Invalid JSON" });
    }

    const { url, message } = validateUrl(body?.url);
    if (!url) return json(400, { message });

    for (let attempt = 0; attempt < 5; attempt++) {
      const createdAt = new Date().toISOString();
      const code = generateCode();
      try {
        await docClient.send(
          new PutCommand({
            TableName: `ZeptoURL_urls-${process.env.ENV}`,
            Item: { code, url, ownerId, createdAt },
            ConditionExpression: "attribute_not_exists(code)",
          }),
        );
        return json(201, { code, url, createdAt });
      } catch (err) {
        if (err.name !== "ConditionalCheckFailedException") throw err;
        console.log("Retrying code");
      }
    }
    return json(500, { message: "Could not generate a unique code" });
  } catch (error) {
    console.error(error);
    return json(500, { message: "Internal Server Error" });
  }
};

//Helpers
const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const generateCode = (len = 7) =>
  Array.from({ length: len }, () => ALPHABET[randomInt(ALPHABET.length)]).join(
    "",
  );

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const validateUrl = (url) => {
  if (typeof url !== "string" || !url || url.length > 2048) {
    return { message: "Invalid URL" };
  }
  try {
    const { protocol, href } = new URL(url);
    return /^https?:$/.test(protocol)
      ? { url: href }
      : { message: "Only http and https URLs are allowed" };
  } catch {
    return { message: "Invalid URL" };
  }
};
