import Aedes from "aedes";
import { createServer } from "net";
import { type Server, type Socket } from "net";
import { config } from "dotenv";
import RedisPersistence from "aedes-persistence-redis";

// Load environment variables
config();

// Get the MQTT broker details
const rawPort: string = process.env.BROKER_PORT || "1883";
const host: string = process.env.BROKER_HOST || "127.0.0.1";

const port: number | undefined = parseInt(rawPort);

// check if BROKER_PORT is a number
if (isNaN(port)) {
  throw new Error("BROKER_PORT is not a number");
}

// Create Redis persistence instance
const persistence = RedisPersistence({
  port: 6379,
  host: host,
  db: 0,
  ttl: {
    packets: 300,
    subscriptions: 3600,
  },
});

// create aedes broker
const broker = new Aedes({ persistence });

// create a server and attach it to the broker
const server: Server = createServer(broker.handle);

// start the broker
server.listen(port, host, () => {
  console.log(`Broker running on port ${port}`);
});
