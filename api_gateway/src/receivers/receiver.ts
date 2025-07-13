import mqtt from "mqtt";

export async function subscribeToTopics(
    client: mqtt.MqttClient,
    topics: string[],
): Promise<void> {
    for (const topic of topics) {
        await subscribeToTopic(client, topic);
    }
}

export async function unsubscribeFromTopics(
    client: mqtt.MqttClient,
    topics: string[],
): Promise<void> {
    for (const topic of topics) {
        await unsubscribeFromTopic(client, topic);
    }
}

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
