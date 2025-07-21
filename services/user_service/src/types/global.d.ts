export {};

declare global {
    type MQTTHandler = (
        data: Record<string, unknown>,
        client: mqtt.MqttClient,
    ) => Promise<void>;

    type Handler = Record<string, MQTTHandler>;

    interface User {
        fullName: {
            firstName: string;
            lastName: string;
        };
        email: string;
        emailVerification: boolean;
        dateOfBirth: Date;
        isAdmin: boolean;
        profilePicture: string; //url to the profile picture
        blockedUsers: User[];
        password: string;
    }
}
