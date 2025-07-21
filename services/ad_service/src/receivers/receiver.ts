import { getClient } from '../mqtt/mqtt_client.js';
import mqtt from 'mqtt';

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
 * Subscribe to the given MQTT topics.
 * @param topics - The list of MQTT topics to subscribe to.
 */
export async function runSubscriptions(topics: string[]): Promise<void> {
    const client: mqtt.MqttClient = await getClient();
    await subscribeToTopics(client, topics);
}

/**
 * Given a list of MQTT message handlers, subscribe to the topics
 * and dispatch messages to the corresponding handlers.
 *
 * @param handlers - An array of objects mapping topic names to
 *                   functions that take a parsed MQTT message and
 *                   an MQTT client as arguments.
 */
export async function dispatchMessages(
    handlers: Handler[],
    topics: string[],
): Promise<void> {
    // Get the client
    const client: mqtt.MqttClient = await getClient();
    const tpicsSet = new Set<string>(topics);
    // Create a map of topics and their corresponding handlers
    const topicHandlerMap: Map<string, MQTTHandler> = new Map<
        string,
        MQTTHandler
    >();

    // Loop through the handlers and add them to the map
    for (const handler of handlers) {
        for (const [topic, fn] of Object.entries(handler)) {
            topicHandlerMap.set(topic, fn);
        }
    }

    // Set up the message handler. Based on the topic, call the corresponding handler
    // If the handler for a topic is not found, print a message
    client.on('message', async (topic: string, message: Buffer) => {
        // Check if the topic is subscribed
        if (!tpicsSet.has(topic)) {
            throw new Error(`Topic ${topic} is not subscribed`);
        }
        const fn = topicHandlerMap.get(topic);
        if (fn) {
            const data = JSON.parse(message.toString());
            await fn(data, client);
        } else {
            console.log(`No handler found for topic: ${topic}`);
        }
    });
}
