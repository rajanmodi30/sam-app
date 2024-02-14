import { APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { DeleteItemCommand, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// Construct service client with region and credentials
const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
    const client = new ApiGatewayManagementApiClient({
        region: process.env.AWS_REGION,
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
    });

    try {
        const connectionData = await dynamoDbClient.send(
            new ScanCommand({ TableName: process.env.TABLE_NAME, ProjectionExpression: 'connectionId' }),
        );

        const postData = event.body ? JSON.parse(event.body).data : 'no data';
        if (connectionData.Items) {
            const postCalls = connectionData.Items.map(async ({ connectionId }) => {
                try {
                    // await client.send(new PostToConnectionCommand({ ConnectionId: { S: connectionId }, Data: postData }));
                    await client.send(
                        new PostToConnectionCommand({
                            ConnectionId: connectionId.S,
                            Data: postData,
                        }),
                    );
                } catch (e: any) {
                    if (e.statusCode === 410) {
                        console.log(`Found stale connection, deleting ${connectionId}`);
                        await dynamoDbClient.send(
                            new DeleteItemCommand({ TableName: process.env.TABLE_NAME, Key: { connectionId } }),
                        );
                    } else {
                        throw e;
                    }
                }
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
