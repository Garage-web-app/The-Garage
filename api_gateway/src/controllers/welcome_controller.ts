import {
    userTopics,
    adminTopics,
    adTopics,
    chatTopics,
    notificationTopics,
} from '../mqtt/topics.js';
import { publishToTopic } from '../delegators/delegator.js';
import { getClient } from '../mqtt/mqtt_client.js';
import {
    subscribeToTopic,
    unsubscribeFromTopic,
    handleIncomingMessage,
} from '../receivers/receiver.js';
import { Request, Response, NextFunction } from 'express';
import { findTopic } from '../utils/topic_finder.js';
import { addPending, rejectPending } from '../mqtt/message_handler.js';
import { randomUUID } from 'crypto';

/**
 * The welcome controller is a special controller that is used to test the
 * setup of the whole application. It is not a normal controller that handles
 * user requests. Instead, it is used to send a message to each of the services
 * and log the response from each of the services.
 *
 * The welcome controller is not meant to be used in production. It is only
 * meant to be used during development to test the setup of the application.
 *
 * The welcome controller sends a message to each of the services and logs
 * the response from each of the services. The response from each of the
 * services is also sent back to the user in the response to the request.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next function.
 */
export async function welcomeController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const client = await getClient();

        const userTopic = findTopic(userTopics, 'user/test');
        const userReplyTopic = userTopic + '/1';
        const userMessage = {
            correlationId: randomUUID(),
            name: 'Gateway',
            message: 'Hell user service',
            replyTopic: userReplyTopic,
        };

        const userResponse = await handleIncomingMessage(
            client,
            userTopic,
            userReplyTopic,
            userMessage,
        );

        const adminTopic = findTopic(adminTopics, 'admin/test');
        const adminReplyTopic = adminTopic + '/1';
        const adminMessage = {
            correlationId: randomUUID(),
            name: 'Gateway',
            message: 'Hello admin service',
            replyTopic: adminReplyTopic,
        };

        const adminResponse = await handleIncomingMessage(
            client,
            adminTopic,
            adminReplyTopic,
            adminMessage,
        );

        const adTopic = findTopic(adTopics, 'ad/test');
        const adReplyTopic = adTopic + '/1';
        const adMessage = {
            correlationId: randomUUID(),
            name: 'Gateway',
            message: 'Hello ad service',
            replyTopic: adReplyTopic,
        };

        const adResponse = await handleIncomingMessage(
            client,
            adTopic,
            adReplyTopic,
            adMessage,
        );

        const chatTopic = findTopic(chatTopics, 'chat/test');
        const chatReplyTopic = chatTopic + '/1';
        const chatMessage = {
            correlationId: randomUUID(),
            name: 'Gateway',
            message: 'Hello chat service',
            replyTopic: chatReplyTopic,
        };

        const chatResponse = await handleIncomingMessage(
            client,
            chatTopic,
            chatReplyTopic,
            chatMessage,
        );

        const notificationTopic = findTopic(
            notificationTopics,
            'notification/test',
        );
        const notificationReplyTopic = notificationTopic + '/1';
        const notificationMessage = {
            correlationId: randomUUID(),
            name: 'Gateway',
            message: 'Hello notification service',
            replyTopic: notificationReplyTopic,
        };

        const notificationResponse = await handleIncomingMessage(
            client,
            notificationTopic,
            notificationReplyTopic,
            notificationMessage,
        );

        console.log(userResponse);
        console.log(adminResponse);
        console.log(adResponse);
        console.log(chatResponse);
        console.log(notificationResponse);

        const response: Record<string, unknown> = {
            user: userResponse,
            admin: adminResponse,
            ad: adResponse,
            chat: chatResponse,
            notification: notificationResponse,
        };

        res.status(200).send(response);
    } catch (err) {
        next(err);
    }
}
