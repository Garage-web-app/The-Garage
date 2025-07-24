import { Request, Response, NextFunction } from 'express';

/**
 * A global error handler that catches all unhandled errors, logs them to the
 * console, and sends a "Internal Server Error" response back to the user.
 *
 * @param err - The error object that was thrown.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next function.
 */
export default function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    console.error(err);
    res.status(500).send({
        error: {
            message: 'Internal Server Error',
        },
    });
}
