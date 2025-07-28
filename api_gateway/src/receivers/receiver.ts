import mqtt from 'mqtt';
import {
    resolvePending,
    addPending,
    rejectPending,
} from '../mqtt/message_handler.js';
import { publishToTopic } from '../delegators/delegator.js';

/**
 * Subscribe to the given MQTT topics.
 * @param client - The MQTT client to use to subscribe.
 * @param topics - The MQTT topics to subscribe to.
 */
export async function subscribeToTopics(
    client: mqtt.MqttClient,
    topics: string[],
): Promise<void> {
    for (const topic of topics) {
        await subscribeToTopic(client, topic);
    }
}
/**
 * Unsubscribe from the given MQTT topics.
 * @param client - The MQTT client to use to unsubscribe.
 * @param topics - The MQTT topics to unsubscribe from.
 */

export async function unsubscribeFromTopics(
    client: mqtt.MqttClient,
    topics: string[],
): Promise<void> {
    for (const topic of topics) {
        await unsubscribeFromTopic(client, topic);
    }
}

/**
 * Subscribe to the given MQTT topic.
 * @param client - The MQTT client to use to subscribe.
 * @param topic - The MQTT topic to subscribe to.
 */
export async function subscribeToTopic(
    client: mqtt.MqttClient,
    topic: string,
): Promise<void> {
    try {
        await client.subscribeAsync(topic);
        console.log(`Subscribed to topic: ${topic}`);
    } catch (err) {
        throw new Error(`Failed to subscribe to topic: ${topic}\n${err}`);
    }
}

/**
 * Unsubscribe from the given MQTT topic.
 * @param client - The MQTT client to use to unsubscribe.
 * @param topic - The MQTT topic to unsubscribe from.
 */
export async function unsubscribeFromTopic(
    client: mqtt.MqttClient,
    topic: string,
): Promise<void> {
    try {
        await client.unsubscribeAsync(topic);
        console.log(`Unsubscribed from topic: ${topic}`);
    } catch (err) {
        throw new Error(`Failed to unsubscribe from topic: ${topic}\n${err}`);
    }
}

/**
 * Set up an MQTT message router for the given client. The router is responsible
 * for routing incoming messages to the appropriate handler. The handler is
 * determined by the correlation ID in the message payload. The router is also
 * responsible for logging any errors that occur while parsing the message.
 *
 * @param client - The MQTT client to set up the message router for.
 */
export function setupMessageRouter(client: mqtt.MqttClient) {
    client.on('message', (topic: string, message: Buffer) => {
        try {
            const payload = JSON.parse(message.toString());
            const { correlationId } = payload;
            resolvePending(correlationId, payload);
        } catch (err) {
            console.error('Invalid message received:', err);
        }
    });
}

/**
 * Handle an incoming message by subscribing to the reply topic, publishing
 * the request to the specified topic, waiting for the response, and
 * unsubscribing from the reply topic.
 * @param client - The MQTT client to use for subscriptions and publishing.
 * @param topic - The topic to publish the request to.
 * @param replyTopic - The topic to subscribe to for the response.
 * @param payload - The payload to publish in the request.
 * @param timeoutMs - The amount of time to wait for the response (in ms).
 * @returns A promise that resolves with the response payload or rejects
 * with an error if the request times out, or if there is an error
 * subscribing, publishing, or unsubscribing.
 */
export async function handleIncomingMessage(
    client: mqtt.MqttClient,
    topic: string,
    replyTopic: string,
    payload: Record<string, unknown>,
    timeoutMs = 5000,
): Promise<unknown> {
    if (payload.correlationId === undefined) {
        throw new Error('No correlation ID provided');
    }

    if (typeof payload.correlationId !== 'string') {
        throw new Error('Correlation ID must be a string');
    }

    const { correlationId } = payload;

    // Step 1: Subscribe
    try {
        await subscribeToTopic(client, replyTopic);
    } catch (err) {
        throw new Error(`Failed to subscribe to ${replyTopic}: ${String(err)}`);
    }

    // Step 2: Prepare the response promise
    let timeoutHandle: NodeJS.Timeout;
    const responsePromise = new Promise<unknown>((resolve, reject) => {
        const wrappedResolve = (data: unknown) => {
            clearTimeout(timeoutHandle);
            resolve(data);
        };

        const wrappedReject = (error: unknown) => {
            clearTimeout(timeoutHandle);
            reject(error);
        };

        addPending(correlationId, wrappedResolve, wrappedReject);

        timeoutHandle = setTimeout(() => {
            rejectPending(correlationId, new Error('Request timed out'));
        }, timeoutMs);
    });

    // Step 3: Publish the request
    try {
        await publishToTopic(client, topic, JSON.stringify(payload));
    } catch (err) {
        rejectPending(correlationId, err);
    }

    // Step 4: Await response and always unsubscribe
    try {
        return await responsePromise;
    } finally {
        try {
            await unsubscribeFromTopic(client, replyTopic);
        } catch (err) {
            console.error(`Failed to unsubscribe from ${replyTopic}: ${err}`);
        }
    }
}
