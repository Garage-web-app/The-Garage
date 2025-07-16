/**
 * Generates a greeting message for the sender of a message.
 *
 * @param {Record<string, unknown>} data - The input data containing the sender's name and message.
 * @returns {Record<string, string | number | Record<string, string>>} - A response object with a
 * greeting message, status code, and service name. If the input data is invalid, returns an error
 * message with a 400 status code.
 */
export const sayHello = (
    data: Record<string, unknown>,
): Record<string, string | number | Record<string, string>> => {
    const res: Record<string, string | number | Record<string, string>> = {};

    if (!data.message || typeof data.message !== "string") {
        res.error = {
            message: "No message provided",
        };

        res.status = 400;
        return res;
    }

    if (!data.name || typeof data.name !== "string") {
        res.error = {
            message: "No name provided",
        };

        res.status = 400;
        return res;
    }

    console.log(`${data.name} says: ${data.message}`);
    res.message = `Hello, ${data.name}!`;
    res.status = 200;
    res.name = "Notification Service";
    return res;
};
