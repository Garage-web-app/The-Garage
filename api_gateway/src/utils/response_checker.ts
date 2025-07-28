import { error } from 'console';
import { Response } from 'express';

/**
 * Handles a service error by returning false if the response status is 200 or 201.
 * If the response status is not 200 or 201, then there is an error.
 * If the response status is 500, throw an error.
 * If the response status is not 500, return true and send the error message.
 *
 * @param serviceName The name of the service.
 * @param response The response object.
 * @param res The express response object.
 * @returns A boolean indicating whether there was an error.
 */
export function handleServiceError(
    serviceName: string,
    response: ResponseBase,
    res: Response,
): boolean {
    // If the response status is 200 or 201, return false as it is not an error
    if (response.status === 200 || response.status === 201) {
        return false;
    }

    // If the response status is not 200 or 201, then there is an error
    const errResp = response as ErrorResponse;

    if (errResp.status === 500) {
        const message = errResp.error?.message || 'Unknown error';
        throw new Error(`${serviceName}: ${message}`);
    } else {
        const message = errResp.error?.message || 'Unknown error';
        res.status(errResp.status as number).send({ error: { message } });
        return true;
    }
}
