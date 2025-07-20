// aedes-persistance-redis does not have a type definition
// define it here

declare module 'aedes-persistence-redis' {
    import { Persistence } from 'aedes';
    import { RedisClientOptions } from 'redis';

    interface RedisPersistenceOptions extends RedisClientOptions {
        port?: number;
        host?: string;
        db?: number;
        ttl?: {
            packets?: number;
            subscriptions?: number;
        };
    }

    function RedisPersistence(options?: RedisPersistenceOptions): Persistence;

    export = RedisPersistence;
}
