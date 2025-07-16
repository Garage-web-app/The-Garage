import { config } from "dotenv";
import {
    runSubscriptions,
    dispatchMessages,
    unsubscribeFromTopics,
} from "./receivers/receiver.js";
import { adminTopics } from "./mqtt/topics.js";
import { getClient } from "./mqtt/mqtt_client.js";
import mqtt from "mqtt";
import handlers from "./repliers/replier.js";

/**
 * The main entry point for the user service.
 *
 * This function initializes the service, by loading the configuration,
 * setting up the MQTT client, subscribing to the relevant topics,
 * and starting to dispatch messages.
 *
 * If any of the initialisation steps fail, the function will log the
 * error message and terminate the process with exit code 1.
 *
 * If an error is encountered while running, the function will log the
 * error message and attempt to unsubscribe from all topics before
 * terminating the process with exit code 1.
 */
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
        await runSubscriptions(adminTopics);
        await dispatchMessages(handlers, adminTopics);
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }

        console.log(error);

        await unsubscribeFromTopics(client, adminTopics);
        process.exit(0);
    }
}

main();
