export {};

declare global {
    type MQTTHandler = (
        data: Record<string, unknown>,
        client: mqtt.MqttClient,
    ) => Promise<void>;

    type Handler = Record<string, MQTTHandler>;
    interface Report {
        reporter: string;
        reported: string;
        timeStamp: Date;
        discription: [String];
    }
}
