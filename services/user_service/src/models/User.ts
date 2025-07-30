import mongoose, { MongooseError, Schema, model } from 'mongoose';
import validator from 'validator';
import validatePassword from '../utils/password_validation.js';
import checkImage from '../utils/image_checker.js';

const userSchema = new Schema<User>({
    fullName: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (email: string) => {
                return validator.isEmail(email);
            },
            message: 'Email is not valid',
        },
    },
    emailVerification: { type: Boolean, default: false, required: true },
    dateOfBirth: { type: Date, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    profilePicture: { type: String, default: '' }, // default needs to be changed for users who don't have a profile picture
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // list of blocked users' emails
    password: {
        type: String,
        required: true,
    },
    sessionTime: { type: Date },
});

// Password validation
userSchema.pre('validate', validatePassword);

// Profile picture validation
userSchema.pre('validate', checkImage);

const UserModel = model<User>('User', userSchema);
export default UserModel;
