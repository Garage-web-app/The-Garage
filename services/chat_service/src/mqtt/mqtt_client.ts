import mqtt from "mqtt";

let client: mqtt.MqttClient | null = null;

export async function getClient(): Promise<mqtt.MqttClient> {
    const rawMqttPort: string | undefined = process.env.BROKER_PORT;
    const mqttHost: string | undefined = process.env.BROKER_HOST;
    const mqttReconTries: number = 5;

    if (!rawMqttPort || isNaN(parseInt(rawMqttPort))) {
        throw new Error("BROKER_PORT is not a number");
    }

    if (!mqttHost) {
        throw new Error("BROKER_HOST is not defined");
    }

    const mqttPort: number = parseInt(rawMqttPort);

    if (!client) {
        client = await connectWithRetry(mqttReconTries, mqttHost, mqttPort);
    }
    return client;
}

export async function connectWithRetry(
    numOfAttempts: number,
    host: string,
    port: number,
): Promise<mqtt.MqttClient> {
    const url = `mqtt://${host}:${port}`;

    for (let attempt = 1; attempt <= numOfAttempts; attempt++) {
        try {
            const client = await mqtt.connectAsync(url);
            console.log("Connected to MQTT broker");
            return client;
        } catch (err) {
            console.error(`Connection attempt ${attempt} failed:\n${err}`);
            if (attempt < numOfAttempts) {
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
