export {};

declare global {
    interface ResponseBase {
        status?: number;
        correlationId?: string;
    }

    interface WelcomeResponse extends ResponseBase {
        message: string;
        name: string;
    }

    interface ErrorResponse extends ResponseBase {
        error: {
            message: string;
        };
    }

    interface User extends ResponseBase {
        fullName: {
            firstName: string;
            lastName: string;
        };
        email: string;
        emailVerification: boolean;
        dateOfBirth: Date;
        isAdmin: boolean;
        profilePicture: string; //url to the profile picture
        blockedUsers?: User[];
        password?: string;
    }
}
