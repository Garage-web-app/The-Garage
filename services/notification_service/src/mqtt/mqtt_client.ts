import mqtt from 'mqtt';

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
    // Get the MQTT broker URI
    const brokerURI: string | undefined = process.env.BROKER_URI;
    const mqttReconTries: number = 5;

    // If BROKER_URI is not defined, throw an error
    if (!brokerURI) {
        throw new Error('BROKER_URI is not defined');
    }

    // If the client doesn't exist yet, create and connect to the MQTT broker (singelton pattern)
    if (!client) {
        client = await connectWithRetry(mqttReconTries, brokerURI);
    }
    return client;
}

/**
 * Connects to the MQTT broker and retries if the connection fails. If the
 * maximum number of attempts is reached, an error is thrown.
 *
 * @param {number} numOfAttempts - The number of connection attempts
 * @param {string} brokerURI - The MQTT broker URI
 *
 * @returns {Promise<mqtt.MqttClient>}
 *
 * @throws {Error} if the connection fails after the maximum number of attempts
 */
export async function connectWithRetry(
    numOfAttempts: number,
    brokerURI: string,
): Promise<mqtt.MqttClient> {
    // Attempt to connect to the MQTT broker numOfAttempts times
    for (let attempt = 1; attempt <= numOfAttempts; attempt++) {
        try {
            const client = await mqtt.connectAsync(brokerURI);
            console.log('Connected to MQTT broker');
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
    throw new Error('Unreachable');
}
