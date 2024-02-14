import { APIGatewayProxyWebsocketEventV2, Context } from 'aws-lambda';
import { DeleteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

// Construct service client with region and credentials
const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

export const handler = async (event: APIGatewayProxyWebsocketEventV2, context: Context) => {
    // function body
    const putCommand = new DeleteItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
            connectionId: { S: event.requestContext.connectionId },
        },
    });

    try {
        const newConnection = await dynamoDbClient.send(putCommand);
        console.log({ newConnection });
    } catch (err) {
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }

    return { statusCode: 200, body: 'Disconnected.', context };
};
