import mqtt from "mqtt";

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
 * Listens for a message on a specified MQTT topic and parses it as JSON.
 * Resolves with the parsed message if received within the specified timeout,
 * otherwise rejects with a timeout error.
 *
 * @param client - The MQTT client to use for listening to messages.
 * @param message_topic - The MQTT topic to listen for messages on.
 * @param timeoutMs - The maximum time in milliseconds to wait for a message
 *                    before rejecting the promise. Defaults to 5000 ms.
 * @returns A promise that resolves with the parsed message or rejects with an error.
 */

export function dispatchMessage(
    client: mqtt.MqttClient,
    message_topic: string,
    timeoutMs = 5000,
): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            client.removeListener("message", handler);
            reject(
                new Error(`Timeout: No message received on ${message_topic}`),
            );
        }, timeoutMs);

        const handler = (topic: string, message: Buffer) => {
            if (topic === message_topic) {
                clearTimeout(timer);
                client.removeListener("message", handler);
                try {
                    const parsed = JSON.parse(message.toString());
                    resolve(parsed);
                } catch (err) {
                    reject(
                        new Error(
                            `Failed to parse message on ${message_topic}:\n${err}`,
                        ),
                    );
                }
            }
        };

        client.on("message", handler);
    });
}
