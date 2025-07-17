import { config } from "dotenv";
import {
    runSubscriptions,
    dispatchMessages,
    unsubscribeFromTopics,
} from "./receivers/receiver.js";
import { notificationTopics } from "./mqtt/topics.js";
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
    // Load environment variables
    config();

    let client: mqtt.MqttClient;

    // Connect to the MQTT broker
    try {
        client = await getClient();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }

    // Subscribe to the MQTT topics and handle messages
    try {
        await runSubscriptions(notificationTopics);
        console.log("Subscribed to MQTT topics");
        await dispatchMessages(handlers, notificationTopics);
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }

        console.log(error);

        // Unsubscribe from all MQTT topics before exiting
        await unsubscribeFromTopics(client, notificationTopics);
        process.exit(1);
    }
}

await main();
