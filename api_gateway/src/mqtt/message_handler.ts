const message_handlers = new Map<
    string,
    {
        resolve: (data: unknown) => void;
        reject: (error: unknown) => void;
    }
>();

/**
 * Adds a handler for a pending message.
 *
 * @param Id - The id of the pending message.
 * @param resolve - A callback that is called when the message is resolved.
 * @param reject - A callback that is called when the message is rejected.
 *
 * @example
 * addPending('12345', (data) => console.log(data), (error) => console.error(error));
 */
export function addPending(
    Id: string,
    resolve: (data: unknown) => void,
    reject: (error: unknown) => void,
) {
    message_handlers.set(Id, { resolve, reject });
}

/**
 * Resolves a pending message.
 *
 * @param Id - The id of the pending message.
 * @param data - The data to resolve the message with.
 *
 * @example
 * resolvePending('12345', { result: 'success' });
 */
export function resolvePending(Id: string, data: unknown) {
    const handler = message_handlers.get(Id);
    if (handler) {
        handler.resolve(data);
        message_handlers.delete(Id);
    } else {
        console.log(`No handler found for id ${Id}`);
    }
}

/**
 * Rejects a pending message.
 *
 * @param Id - The id of the pending message.
 * @param error - The error to reject the message with.
 *
 * @example
 * rejectPending('12345', new Error('Something went wrong'));
 */
export function rejectPending(Id: string, error: unknown) {
    const handler = message_handlers.get(Id);
    if (handler) {
        handler.reject(error);
        message_handlers.delete(Id);
    } else {
        console.log(`No handler found for id ${Id}`);
    }
}

/**
 * Removes a pending message handler.
 *
 * @param Id - The id of the pending message handler to remove.
 *
 * @example
 * removePending('12345');
 */
export function removePending(Id: string) {
    message_handlers.delete(Id);
}
