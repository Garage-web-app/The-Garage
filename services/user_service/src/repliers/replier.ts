import { sayHello } from "../logic/welcome.js";
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

const welcomeHandler: Handler = {
    "user/test": async (
        data: Record<string, unknown>,
        client: mqtt.MqttClient,
    ): Promise<void> => {
        let res: Record<string, unknown> = {};
        if (!data.replyTopic || typeof data.replyTopic !== "string") {
            throw new Error("No reply topic provided");
        }

        const replyTopic = data.replyTopic;
        res = sayHello(data);
        await publishToTopic(client, replyTopic, JSON.stringify(res));
    },
};

const handlers: Handler[] = [welcomeHandler];

export default handlers;
