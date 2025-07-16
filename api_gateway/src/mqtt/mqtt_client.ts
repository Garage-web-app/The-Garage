import mqtt from "mqtt";

let client: mqtt.MqttClient | null = null;

/**
 * Retrieves a connected MQTT client. If the client doesn't exist yet,
 * one is created and connected to the MQTT broker.
 *
 * @throws {Error} if BROKER_PORT is not a number
 * @throws {Error} if BROKER_HOST is not defined
 *
 * @returns {Promise<mqtt.MqttClient>}
 */
export async function getClient(): Promise<mqtt.MqttClient> {
    // Get the MQTT broker details
    const rawMqttPort: string | undefined = process.env.BROKER_PORT;
    const mqttHost: string | undefined = process.env.BROKER_HOST;
    const mqttReconTries: number = 5;

    // Validate the MQTT broker details
    if (!rawMqttPort || isNaN(parseInt(rawMqttPort))) {
        throw new Error("BROKER_PORT is not a number");
    }

    if (!mqttHost) {
        throw new Error("BROKER_HOST is not defined");
    }

    const mqttPort: number = parseInt(rawMqttPort);

    // If the client doesn't exist yet, create and connect to the MQTT broker (singelton pattern)
    if (!client) {
        client = await connectWithRetry(mqttReconTries, mqttHost, mqttPort);
    }
    return client;
}

/**
 * Connects to the MQTT broker and retries if the connection fails. If the
 * maximum number of attempts is reached, an error is thrown.
 *
 * @param {number} numOfAttempts - The number of connection attempts
 * @param {string} host - The host name of the MQTT broker
 * @param {number} port - The port of the MQTT broker
 *
 * @returns {Promise<mqtt.MqttClient>}
 *
 * @throws {Error} if the connection fails after the maximum number of attempts
 */
export async function connectWithRetry(
    numOfAttempts: number,
    host: string,
    port: number,
): Promise<mqtt.MqttClient> {
    const url = `mqtt://${host}:${port}`;

    // Attempt to connect to the MQTT broker numOfAttempts times
    for (let attempt = 1; attempt <= numOfAttempts; attempt++) {
        try {
            const client = await mqtt.connectAsync(url);
            console.log("Connected to MQTT broker");
            return client;
        } catch (err) {
            console.error(`Connection attempt ${attempt} failed:\n${err}`);
            if (attempt < numOfAttempts) {
                // Wait for a sendonds corresponding to the current attempt
                await new Promise((res) => setTimeout(res, attempt * 1000));
            } else {
                throw new Error(
                    `Failed to connect to MQTT after ${numOfAttempts} attempts\n${err}`,
                );
            }
        }
    }

    // This is unreachable but satisfies TypeScript
    throw new Error("Unreachable");
}
