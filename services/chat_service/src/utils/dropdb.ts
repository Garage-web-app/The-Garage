/**
 * @file dropdb.ts
 * @description This file contains the dropDB function, which drops the MongoDB database specified by the DATABASE_URI environment variable.
 * Note that this file is supposed to be used in test mode only.
 */
import mongoose from "mongoose";
import { config } from "dotenv";

/**
 * Drops the MongoDB database specified by the DATABASE_URI environment variable.
 *
 * This function only works in test mode. If NODE_ENV is not set to "test", an error
 * is thrown. The .env.test file is loaded, and the DATABASE_URI environment
 * variable must be set. If it is not set, an error is thrown.
 *
 * The function first connects to the database using the provided connection
 * string. It then checks if the database is found. If the database is not
 * found, an error is thrown. Finally, the function drops the database, and
 * then disconnects from the database.
 *
 * @throws {Error} If NODE_ENV is not set to "test"
 * @throws {Error} If DATABASE_URI is not set
 * @throws {Error} If the database is not found
 */
async function dropDB(): Promise<void> {
    // If we are not in test mode, throw an error
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== "test") {
        throw new Error("NODE_ENV is not test");
    }

    // Load the .env.test file
    config({ path: "./.env.test" });

    // MongoDB connection string
    const connectionString: string = process.env.DATABASE_URI || "";

    // If DATABASE_URI is not defined, throw an error
    if (!connectionString) {
        throw new Error("DATABASE_URI is not defined");
    }

    // Drop the database
    try {
        // Connect to the database
        await mongoose.connect(connectionString);
        console.log(`connected to ${connectionString}`);

        // If the database is not found, throw an error
        if (!mongoose.connection.db) {
            throw new Error("Database not found");
        }

        // Drop the database
        await mongoose.connection.db.dropDatabase();
        console.log("Database dropped successfully");
    } catch (error) {
        console.error("Error dropping database:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from database");
    }
}

try {
    dropDB();
} catch (error) {
    console.error("Error dropping database:", error);
    process.exit(1);
}
