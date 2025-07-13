import { config } from "dotenv";
import {
    runSubscriptions,
    dispatchMessages,
    unsubscribeFromTopics,
} from "./receivers/receiver.js";
import { chatTopics } from "./mqtt/topics.js";
import { getClient } from "./mqtt/mqtt_client.js";
import mqtt from "mqtt";
import handlers from "./repliers/replier.js";

async function main(): Promise<void> {
    config();
    let client: mqtt.MqttClient;

    try {
        client = await getClient();
    } catch (error) {
        console.log(error);
        process.exit(0);
    }

    try {
        await runSubscriptions(chatTopics);
        await dispatchMessages(handlers, chatTopics);
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }

        console.log(error);

        await unsubscribeFromTopics(client, chatTopics);
        process.exit(0);
    }
}

main();
