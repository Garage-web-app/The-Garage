import Aedes from "aedes";
import { createServer } from "net";
import { type Server } from "net";
import { config } from "dotenv";

// Load environment variables
config();

// Get the MQTT broker details
const rawPort: string | undefined = process.env.BROKER_PORT;
const host: string | undefined = process.env.BROKER_HOST;

// check if BROKER_HOST is defined
if (!host) {
  throw new Error("BROKER_HOST is not defined");
}

// check if BROKER_PORT is defined
if (!rawPort) {
  throw new Error("BROKER_PORT is not defined");
}

const port: number | undefined = parseInt(rawPort);

// check if BROKER_PORT is a number
if (isNaN(port)) {
  throw new Error("BROKER_PORT is not a number");
}

// create aedes broker
const broker = new Aedes();

// create a server and attach it to the broker
const server: Server = createServer(broker.handle);

// start the broker
server.listen(port, host, () => {
  console.log(`Broker running on port ${port}`);
});
