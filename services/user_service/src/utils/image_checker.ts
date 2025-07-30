import mongoose from 'mongoose';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { randomUUID } from 'crypto';
import os from 'os';
import path from 'path';

/**
 * Tests if a given string is a valid base64 image.
 * @param base64Image The string to test.
 * @returns true if the string is a valid base64 image, false otherwise.
 */
function isBase64(base64Image: string): boolean {
    return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(
        base64Image,
    );
}

/**
 * Extracts the base64 image from a data URL.
 * @param imageDtaURL The data URL to extract the image from.
 * @returns The base64 image.
 */
function extractBase64(imageDtaURL: string): string {
    return imageDtaURL.split(',')[1];
}

/**
 * Extracts the MIME type from a data URL.
 * @param imageDataURL The data URL to extract the MIME type from.
 * @returns The MIME type.
 */
function extractMIMEType(imageDataURL: string): string {
    return imageDataURL.split(',')[0].split(':')[1].split(';')[0];
}

/**
 * Checks if the given MIME type is valid.
 * @param MIMEType The MIME type to check.
 * @returns true if the MIME type is valid, false otherwise.
 * Valid MIME types are:
 * - image/jpeg
 * - image/png
 */
function hasValidMIMEType(MIMEType: string): boolean {
    return MIMEType === 'image/jpeg' || MIMEType === 'image/png';
}

/**
 * Writes a base64 image to a temporary file.
 * @param base64Image The base64 image to write.
 * @returns The path to the temporary file.
 * @throws An error if the write operation fails.
 */
export async function writeImageToFile(base64Image: string): Promise<string> {
    /// Create a buffer from the base64 image
    const buffer = Buffer.from(base64Image, 'base64');
    /// Generate a random file name
    const imageName = `${randomUUID()}.jpg`;
    /// Create a path to the temporary file
    const tempPath = path.join(os.tmpdir(), imageName);

    try {
        /// Write the buffer to the temporary file
        await fs.promises.writeFile(tempPath, buffer);
        // If there is an error, throw an error
    } catch (error) {
        throw new Error(
            `Failed to write image file: ${(error as Error).message}`,
        );
    }

    // Return the path to the temporary file
    return tempPath;
}

/**
 * Deletes the image file at the given path.
 * @param imageName The path to the image to delete.
 * @throws If the deletion fails.
 */
async function deleteImage(imageName: string): Promise<void> {
    try {
        await fs.promises.unlink(imageName);
    } catch (error) {
        throw error;
    }
}

async function isSuitableImage(base64Image: string): Promise<boolean> {
    // Get the environment variables needed for SightEngine
    const apiUsername = process.env.SIGHT_ENGINE_USER_ID;
    const apiKey = process.env.SIGHT_ENGINE_API_KEY;
    const sightEngineURL = process.env.SIGHT_ENGINE_URL;

    // Check if the environment variables are defined
    if (!apiKey) {
        throw new Error('SIGHT_ENGINE_API_KEY is not defined');
    }

    if (!apiUsername) {
        throw new Error('SIGHT_ENGINE_USER_ID is not defined');
    }

    if (!sightEngineURL) {
        throw new Error('SIGHT_ENGINE_URL is not defined');
    }

    // Write the image to a temporary file
    const imagePath = await writeImageToFile(base64Image);

    // Create a FormData object and append the image and the models needed for checking the image
    // Append the api username and api key as well
    const data = new FormData();
    data.append('media', fs.createReadStream(imagePath));
    data.append(
        'models',
        'nudity-2.1,recreational_drug,medical,offensive-2.0,text-content,gore-2.0,text',
    );
    data.append('api_user', apiUsername);
    data.append('api_secret', apiKey);

    try {
        // Make a POST request to the SightEngine API and get the response
        const response = await axios.post<SightengineResponse>(
            sightEngineURL,
            data,
        );

        console.log(response.data);

        // Check if nudity is above 50%
        if (response.data.nudity.none < 0.5) {
            return false;
        }

        // Check if recreational drug is above 50%
        if (response.data.recreational_drug.prob > 0.5) {
            return false;
        }

        // Check if medical (pills, drugs) is above 50%
        if (response.data.medical.prob > 0.5) {
            return false;
        }

        // Offensive has categories and each category has a probability
        // Check if the probability is above 50%
        for (const category in response.data.offensive) {
            if (response.data.offensive[category] > 0.5) {
                return false;
            }
        }

        // Check if there is any offensive text
        // Text category has an array of categories
        // If the array is not empty, return false
        for (const category in response.data.text) {
            // Check if the category is an array
            if (Array.isArray(response.data.text[category])) {
                // if the length is not 0, return false
                if (category.length > 0) {
                    return false;
                }
            }
        }

        // Check if gore is above 50%
        if (response.data.gore.prob > 0.5) {
            return false;
        }

        return true;
        // If there is an error, print the error and throw it if it is not an axios error
    } catch (error) {
        // Check if the error is an axios error
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
            return true;
        } else {
            console.log('unexpected error: ', error);
            throw error;
        }
        // Delete the image before ending the function
    } finally {
        await deleteImage(imagePath);
    }
}

/**
 * Validates the user's profile picture by checking its MIME type and suitability.
 *
 * This function performs the following checks on the user's profile picture:
 * 1. Ensures that the image data URL is present. If not, proceeds with the next callback.
 * 2. Extracts the MIME type and checks if it is valid (either 'image/jpeg' or 'image/png').
 *    If invalid, adds a validation error for the 'profilePicture' field and calls the next callback with the error.
 * 3. Extracts the base64 representation of the image and verifies its format.
 *    If the format is invalid, adds a validation error for the 'profilePicture' field and calls the next callback with the error.
 * 4. Determines if the image is suitable using the Sightengine API.
 *    If unsuitable, adds a validation error for the 'profilePicture' field and calls the next callback with the error.
 *
 * If all checks pass, the function simply calls the next callback.
 *
 * @param this - The current mongoose document representing the user.
 * @param next - The mongoose callback to proceed with validation or handle errors.
 */

export default async function checkImage(
    this: mongoose.Document & User,
    next: mongoose.CallbackWithoutResultAndOptionalError,
) {
    // Set user to the current user
    const user = this;
    // Get the image data URL
    const imageDataURL = user.profilePicture;

    // If the image data URL is not present, proceed with the next callback
    // aS it is optional
    if (!imageDataURL) {
        return next();
    }

    // Extract the MIME type
    const MIMEType = extractMIMEType(imageDataURL);

    // If the MIME type is not valid, add a validation error
    if (!hasValidMIMEType(MIMEType)) {
        const err = new mongoose.Error.ValidationError();
        err.addError(
            'profilePicture',
            new mongoose.Error.ValidatorError({
                message: 'Invalid image format',
            }),
        );
        return next(err);
    }

    // Extract the base64 image
    const base64Image = extractBase64(imageDataURL);

    // If the base64 image is not valid, add a validation error
    if (!isBase64(base64Image)) {
        const err = new mongoose.Error.ValidationError();
        err.addError(
            'profilePicture',
            new mongoose.Error.ValidatorError({
                message: 'Invalid image format',
            }),
        );
        return next(err);
    }

    // If the image is not suitable, add a validation error
    if (!(await isSuitableImage(base64Image))) {
        const err = new mongoose.Error.ValidationError();
        err.addError(
            'profilePicture',
            new mongoose.Error.ValidatorError({
                message: 'Image is not suitable',
            }),
        );
        return next(err);
    }

    // If all checks pass, proceed with the next callback
    return next();
}
