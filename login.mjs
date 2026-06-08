import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'job-tracker';
const EMAIL_INDEX = 'emailGSI';
const EMAIL_GSIKEY = 'email_gsi_pk';
const EMAIL_GSIKEY_SK = 'email_gsi_sk';
const EMAIL_PREFIX = 'EMAIL#';

export async function login(email, password) {
    const result = await docClient.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: EMAIL_INDEX,
            KeyConditionExpression: `${EMAIL_GSIKEY} = :email`,
            ExpressionAttributeValues: {
                ':email': `${EMAIL_PREFIX}${email.toLowerCase()}`
            },
            Limit: 1
        })
    );

    if (!result.Items || result.Items.length === 0) {
        throw new Error('Invalid email or password');
    }

    const user = result.Items[0];

    const passwordMatch = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!passwordMatch) {
        throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
        {
            userId: user.userId,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    return {
        success: true,
        token,
        user: {
            name: user.name,
            email: user.email,
            userId: user.userId
        }
    };
}