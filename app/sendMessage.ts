import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// Construct service client with region and credentials
const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
    const endpoint = 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage;
    const client = new ApiGatewayManagementApiClient({
        region: process.env.AWS_REGION,
        endpoint,
    });

    try {
        const connectionData = await dynamoDbClient.send(
            new ScanCommand({ TableName: process.env.TABLE_NAME, ProjectionExpression: 'connectionId' }),
        );

        const postData = event.body ? JSON.parse(event.body).data : 'no data';
        if (connectionData.Items) {
            const postCalls = connectionData.Items.map(async ({ connectionId }) => {
                await client.send(
                    new PostToConnectionCommand({
                        ConnectionId: connectionId.S,
                        Data: JSON.stringify(postData),
                    }),
                );
            });
            await Promise.all(postCalls);
        }
    } catch (e) {
        console.error(e);

        return {
            statusCode: 500,
            body: 'Something went wrong',
        };
    }

    return { statusCode: 200, body: 'Data sent.' };
};
