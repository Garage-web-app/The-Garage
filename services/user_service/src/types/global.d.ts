import { mongo } from 'mongoose';

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
        dateOfBirth: Date | number;
        isAdmin: boolean;
        profilePicture?: string; //url to the profile picture
        blockedUsers: User[];
        password: string;
        sessionTime?: Date;
    }

    interface ResponseBase {
        status?: number;
        correlationId?: string;
    }

    interface ErrorResponse extends ResponseBase {
        error: {
            message: string;
        };
    }

    interface WelcomeResponse extends ResponseBase {
        message: string;
        name: string;
    }

    interface UserRes extends ResponseBase {
        fullName: {
            firstName: string;
            lastName: string;
        };
        email: string;
        emailVerification: boolean;
        dateOfBirth: Date | number;
        isAdmin: boolean;
        profilePicture?: string; //url to the profile picture
        blockedUsers: User[];
        password?: string;
        sessionTime?: Date;
    }

    interface SightengineResponse {
        nudity: { none: number };
        recreational_drug: { prob: number };
        medical: { prob: number };
        offensive: Record<string, number>;
        text: Record<string, unknown>;
        gore: { prob: number };
    }
}
