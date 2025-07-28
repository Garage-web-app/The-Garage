import mongoose, { MongooseError, Schema, model } from 'mongoose';
import validator from 'validator';

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
    profilePicture: { type: String, default: '', required: true }, // default needs to be changed for users who don't have a profile picture
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // list of blocked users' emails
    password: {
        type: String,
        required: true,
    },
    sessionTime: { type: Date },
});

userSchema.pre('validate', function (next) {
    const user = this as mongoose.Document;

    const password = user.get('password'); // safer in case it's not typed well
    if (!password) return next();

    const errors = [];
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[a-z]/.test(password)) errors.push('a lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('an uppercase letter');
    if (!/[0-9]/.test(password)) errors.push('a number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
        errors.push('a special character');

    if (errors.length > 0) {
        const err = new mongoose.Error.ValidationError();
        err.addError(
            'password',
            new mongoose.Error.ValidatorError({
                message: `Password must contain ${errors.join(', ')}`,
                path: 'password',
                value: password,
            }),
        );
        return next(err);
    }

    next();
});

const UserModel = model<User>('User', userSchema);
export default UserModel;
