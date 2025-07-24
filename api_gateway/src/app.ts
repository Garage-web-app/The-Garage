import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import errorHandler from './utils/error_handler.js';
import { getClient } from './mqtt/mqtt_client.js';
import mqtt from 'mqtt';
import { setupMessageRouter } from './receivers/receiver.js';
import { router as homeRouter } from './routers/home_router.js';

// Load environment variables
config();

// Get the gateway port and environment
const rawPort: string | undefined = process.env.GATEWAY_PORT;
const env: string | undefined = process.env.NODE_ENV;
const host: string | undefined = process.env.GATEWAY_HOST;

// If GATEWAY_HOST is not defined, throw an error
if (!host) {
    throw new Error('GATEWAY_HOST is not defined');
}

// If GATEWAY_PORT is not a number, throw an error
if (!rawPort || isNaN(parseInt(rawPort))) {
    throw new Error('GATEWAY_PORT is not a number');
}

// If NODE_ENV is not defined, throw an error
if (!env) {
    throw new Error('NODE_ENV is not defined');
}

// Convert GATEWAY_PORT to a number
const port: number = parseInt(rawPort);

// Create an Express app
const app: Express = express();

// Set up mqtt client and messgae router
try {
    const mqttClient: mqtt.MqttClient = await getClient();

    // Setup MQTT lifecycle event logging
    mqttClient.on('connect', () => console.log('MQTT connected'));
    mqttClient.on('reconnect', () => console.log('MQTT reconnecting...'));
    mqttClient.on('close', () => console.log('MQTT connection closed'));
    mqttClient.on('error', (err) => console.error('MQTT error:', err));

    setupMessageRouter(mqttClient);
    console.log('Message router set up');
} catch (error) {
    console.error(error);
}

// Middlewares
app.use(cors()); // Enable CORS which allows cross-origin requests. For now we allow all origins
app.use(express.json()); // Parse JSON which parses the body of the request to JSON
app.use(cookieParser()); // Parse cookies which allows us to access cookies by using req.cookies

// If the environment is development or test, use morgan
if (env === 'development' || env === 'test') {
    // Morgan is a logger that logs requests to the console
    app.use(morgan('dev'));
}

// Routers
app.use('/api/v1/', homeRouter); // Use the home router for the root route

// Error handler which is called for 500 status codes
app.use(errorHandler);

// Start the server
app.listen(port, host, () => {
    console.log(`Gateway running on port ${port}`);
});
