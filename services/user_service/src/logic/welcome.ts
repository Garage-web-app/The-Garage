/**
 * Says hello to the message sender.
 *
 * @param {Record<string, unknown>} data Object with name and message properties
 * @returns {Record<string, string | number | Record<string, string>>} Response object
 * with status and message.
 */
export const sayHello = (
    data: Record<string, unknown>,
): WelcomeResponse | ErrorResponse => {
    const res: WelcomeResponse | ErrorResponse = {} as
        | WelcomeResponse
        | ErrorResponse;

    if (!data.message || typeof data.message !== 'string') {
        (res as ErrorResponse).error = {
            message: 'No message provided',
        };

        res.status = 400;
        return res;
    }

    if (!data.name || typeof data.name !== 'string') {
        (res as ErrorResponse).error = {
            message: 'No name provided',
        };

        res.status = 400;
        return res;
    }

    console.log(`${data.name} says: ${data.message}`);
    (res as WelcomeResponse).message = `Hello, ${data.name}!`;
    res.status = 200;
    (res as WelcomeResponse).name = 'User Service';
    return res;
};
