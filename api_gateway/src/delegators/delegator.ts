import mqtt from 'mqtt';

/**
 * Publish a message to the specified MQTT topic.
 * @param client - The MQTT client to use for publishing.
 * @param topic - The MQTT topic to publish to.
 * @param message - The message to publish.
 * @throws {Error} If the message cannot be published.
 */
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

/**
 * Publish a message to multiple MQTT topics.
 * @param client - The MQTT client to use for publishing.
 * @param topics - The MQTT topics to publish to.
 * @param message - The message to publish.
 * @throws {Error} If the message cannot be published.
 */
export async function publishToTopics(
    client: mqtt.MqttClient,
    topics: string[],
    message: string,
): Promise<void> {
    for (const topic of topics) {
        await publishToTopic(client, topic, message);
    }
}
