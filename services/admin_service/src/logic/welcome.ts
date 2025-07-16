/**
 * Says hello to the message sender.
 *
 * @param {Record<string, unknown>} data Object with name and message properties
 * @returns {Record<string, string | number | Record<string, string>>} Response object
 * with status and message.
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
    res.name = "Admin Service";
    return res;
};
