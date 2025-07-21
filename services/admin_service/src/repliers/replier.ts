import { sayHello } from '../logic/welcome.js';
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
 * The MQTT message handler for the "admin/test" topic. The handler checks for
 * the presence of a "replyTopic" property in the parsed MQTT message data before
 * calling the main logic function.
 * Note that this handler is a an object that has the topic name as the key and
 * the handler function as the value.
 * @param data - The parsed MQTT message data.
 * @param client - The MQTT client that received the message.
 */
const welcomeHandler: Handler = {
    'admin/test': async (
        data: Record<string, unknown>,
        client: mqtt.MqttClient,
    ): Promise<void> => {
        let res: Record<string, unknown> = {};
        if (!data.replyTopic || typeof data.replyTopic !== 'string') {
            throw new Error('No reply topic provided');
        }

        const replyTopic = data.replyTopic;
        res = sayHello(data);
        await publishToTopic(client, replyTopic, JSON.stringify(res));
    },
};

const handlers: Handler[] = [welcomeHandler];

export default handlers;
