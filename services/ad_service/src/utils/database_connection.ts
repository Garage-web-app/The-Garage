import mongoose from 'mongoose';

export default async function connectToDatabase(): Promise<void> {
    // MongoDB connection string
    const connectionString: string = process.env.DATABASE_URI || '';

    // If DATABASE_URI is not defined, throw an error
    if (!connectionString) {
        throw new Error('DATABASE_URI is not defined');
    }

    // Connect to the database
    await mongoose.connect(connectionString);

    console.log(`connected to ${connectionString}`);

    // If the database is not found, throw an error
    if (!mongoose.connection.db) {
        throw new Error('Database not found');
    }
}
