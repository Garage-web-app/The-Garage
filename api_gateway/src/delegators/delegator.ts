import mqtt from "mqtt";

export async function publishToTopic(
    client: mqtt.MqttClient,
    topic: string,
    message: string,
): Promise<void> {
    try {
        await client.publishAsync(topic, message);
        console.log(`Published message to topic: ${topic}`);
    } catch (err) {
        throw new Error(`Failed to publish message to topic: ${topic}\n${err}`);
    }
}

export async function publishToTopics(
    client: mqtt.MqttClient,
    topics: string[],
    message: string,
): Promise<void> {
    for (const topic of topics) {
        await publishToTopic(client, topic, message);
    }
}
