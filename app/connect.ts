import { APIGatewayProxyWebsocketEventV2, Context } from 'aws-lambda';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

// Construct service client with region and credentials
const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

export const handler = async (event: APIGatewayProxyWebsocketEventV2, context: Context) => {
    // function body
    const putCommand = new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
            connectionId: { S: event.requestContext.connectionId },
        },
    });

    try {
        const newConnection = await dynamoDbClient.send(putCommand);
        console.log({ newConnection });
    } catch (err) {
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }

    return { statusCode: 200, body: 'Connected.', context };
};
