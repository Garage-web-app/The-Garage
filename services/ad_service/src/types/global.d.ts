export {};

declare global {
    type MQTTHandler = (
        data: Record<string, unknown>,
        client: mqtt.MqttClient,
    ) => Promise<void>;

    type Handler = Record<string, MQTTHandler>;

    interface Ad {
        productionYear: number;
        price: number;
        plateNumber: string;
        picture: string; //String is the picture's url
        model: string;
        location: {
            country: string;
            city: string;
            street: string;
            zipCode: number;
        };
        userEmail: string; //userEmail is the foreign key to the user which creates the add
        adCreationDate: Date;
    }
}
