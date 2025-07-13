import { getClient } from "../mqtt/mqtt_client.js";
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

export async function runSubscriptions(topics: string[]): Promise<void> {
    const client: mqtt.MqttClient = await getClient();
    await subscribeToTopics(client, topics);
}

export async function dispatchMessages(
    handlers: Handler[],
    topics: string[],
): Promise<void> {
    const client: mqtt.MqttClient = await getClient();
    const handlerTopics: Set<string> = new Set<string>();
    const topicHandlerMap: Map<string, MQTTHandler> = new Map<
        string,
        MQTTHandler
    >();

    for (const handler of handlers) {
        for (const [topic, fn] of Object.entries(handler)) {
            handlerTopics.add(topic);
            topicHandlerMap.set(topic, fn);
        }
    }

    client.on("message", async (topic: string, message: Buffer) => {
        const fn = topicHandlerMap.get(topic);
        if (fn) {
            const data = JSON.parse(message.toString());
            await fn(data, client);
        } else {
            console.log(`No handler found for topic: ${topic}`);
        }
    });
}
