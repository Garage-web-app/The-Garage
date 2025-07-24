export {};

declare global {
    interface ResponseBase {
        status?: number;
        correlationId?: string;
    }

    interface SuccessResponse extends ResponseBase {
        message: string;
        name: string;
    }

    interface ErrorResponse extends ResponseBase {
        error: {
            message: string;
        };
    }

    type WelcomeResponse = SuccessResponse | ErrorResponse;
}
