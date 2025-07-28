import { config } from 'dotenv';
import {
    runSubscriptions,
    dispatchMessages,
    unsubscribeFromTopics,
} from './receivers/receiver.js';
import { chatTopics } from './mqtt/topics.js';
import { getClient } from './mqtt/mqtt_client.js';
import mqtt from 'mqtt';
import handlers from './repliers/replier.js';
import connectToDatabase from './utils/database_connection.js';

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
    let client: mqtt.MqttClient;

    // If we are in test mode, load the .env.test file
    // Otherwise, load the .env file
    if (process.env.NODE_ENV === 'test') {
        config({ path: './.env.test' });
    } else {
        config();
    }

    // Connect to the MQTT broker
    try {
        client = await getClient();

        // Setup MQTT lifecycle event logging
        client.on('connect', () => console.log('MQTT connected'));
        client.on('reconnect', () => console.log('MQTT reconnecting...'));
        client.on('close', () => console.log('MQTT connection closed'));
        client.on('error', (err) => console.error('MQTT error:', err));
    } catch (error) {
        console.log(error);
        process.exit(1);
    }

    // Connect to the database
    try {
        await connectToDatabase();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }

    // Subscribe to the MQTT topics and handle messages
    try {
        await runSubscriptions(chatTopics);
        console.log('Subscribed to MQTT topics');
        await dispatchMessages(handlers, chatTopics);
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }

        console.log(error);

        // Unsubscribe from all MQTT topics before exiting
        await unsubscribeFromTopics(client, chatTopics);
        process.exit(1);
    }
}

await main();
