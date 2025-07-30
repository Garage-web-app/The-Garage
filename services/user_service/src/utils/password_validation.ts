import mongoose from 'mongoose';

/**
 * Validates the user's password according to specified criteria.
 *
 * This function checks if the password exists and meets the following criteria:
 * - At least 8 characters long
 * - Contains at least one lowercase letter
 * - Contains at least one uppercase letter
 * - Contains at least one number
 * - Contains at least one special character
 *
 * If the password does not meet any of these criteria, a validation error is
 * added to the mongoose error object and passed to the next callback.
 * If the password is valid, the function simply calls the next callback.
 *
 * @param this - The current mongoose document representing the user.
 * @param next - The mongoose callback to proceed with validation or handle errors.
 */
export default function validatePassword(
    this: User & mongoose.Document,
    next: mongoose.CallbackWithoutResultAndOptionalError,
) {
    const user = this;

    const password = user.password;

    // If the password doesn't exist, move on
    if (!password) {
        next();
    }

    const errors = [];
    // Password must contain at least 8 characters, 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[a-z]/.test(password)) errors.push('a lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('an uppercase letter');
    if (!/[0-9]/.test(password)) errors.push('a number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
        errors.push('a special character');

    // If the password doesn't meet the requirements, throw an error in validation
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

    // If the password meets the requirements, move on
    next();
}
