import { Request, Response, NextFunction } from 'express';
import { findTopic } from '../utils/topic_finder.js';
import { handleIncomingMessage } from '../receivers/receiver.js';
import { getClient } from '../mqtt/mqtt_client.js';
import { randomUUID } from 'crypto';
import { userTopics } from '../mqtt/topics.js';
import { handleServiceError } from '../utils/response_checker.js';

export async function createUser(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        // Find the user creation topic
        const userCreationTopic = findTopic(userTopics, 'POST/users');

        // Topic for the user microservice to reply to
        const creationReplyRopic = userCreationTopic + '/' + randomUUID();

        // Get the MQTT client
        const client = await getClient();

        // Construct the user creation message
        const userMessage = {
            correlationId: randomUUID(),
            replyTopic: creationReplyRopic,
            ...req.body,
        };

        // Send the user creation message and wait for the userMicroserviceRes
        const userMicroserviceRes = (await handleIncomingMessage(
            client,
            userCreationTopic,
            creationReplyRopic,
            userMessage,
        )) as User;

        // Remove correlationId from userMicroserviceRes
        delete userMicroserviceRes.correlationId;

        // See if the userMicroserviceRes is okay
        if (handleServiceError('User_Microservice', userMicroserviceRes, res)) {
            return;
        }

        // Delete status from userMicroserviceRes
        delete userMicroserviceRes.status;

        // Send the userMicroserviceRes
        res.status(201).send(userMicroserviceRes);
    } catch (error) {
        next(error);
    }
}
