export {};

declare global {
    type MQTTHandler = (
        data: Record<string, unknown>,
        client: mqtt.MqttClient,
    ) => Promise<void>;

    type Handler = Record<string, MQTTHandler>;

    interface Chat {
        adCreator: string;
        interester: string;
        linkedAd: string;
        messages: [
            {
                sender: string;
                message: string;
                timeStamps: Date;
            },
        ];
        timeStamps: Date;
    }
}
