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
    res.name = "Chat Service";
    return res;
};
