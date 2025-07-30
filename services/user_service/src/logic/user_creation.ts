import mongoose, { mongo } from 'mongoose';
import UserModel from '../models/User.js';
import bcrypt from 'bcrypt';

export async function createUser(
    data: unknown,
): Promise<UserRes | ErrorResponse> {
    try {
        // Create a new user Document
        const user = new UserModel(data);

        // Validate the user
        await user.validate();

        // Hash the password
        user.password = await bcrypt.hash(
            user.password + process.env.PEPPER,
            10,
        );

        await user.save();

        // Get the object of the user document
        const res: UserRes = user.toObject();

        // Remove the password from the response
        delete res.password;

        // Remove the __v and _id from the response
        if ('__v' in res) {
            delete res.__v;
        }

        if ('_id' in res) {
            delete res._id;
        }

        // Set status to 201
        res.status = 201;

        // Convert date of birth to timestamp
        res.dateOfBirth = new Date(res.dateOfBirth).getTime();

        // Return the user
        return res;
    } catch (error) {
        // Default error response
        const res: ErrorResponse = {
            status: 500,
            error: { message: 'Unknown error' },
        };

        // Check if the error is a validation error
        if (
            error instanceof mongoose.Error.ValidationError ||
            error instanceof mongoose.Error.CastError
        ) {
            console.log(error);
            res.status = 400;
            res.error.message = error.message;
            return res;
        }

        // Check if the error is a mongo server error
        if (error instanceof mongo.MongoServerError) {
            console.log(error);
            // Check if the error is a duplicate key error
            res.status = error.code === 11000 ? 409 : 500;
            res.error.message = `User with email ${error.keyValue.email} already exists`;
            return res;
        }

        // If control reaches here, we have an unknown error
        console.log(error);
        return res;
    }
}
