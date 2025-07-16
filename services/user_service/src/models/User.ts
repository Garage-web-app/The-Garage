import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema<User>({
    fullName: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
    },
    email: { type: String, required: true, unique: true },
    emailVerification: { type: Boolean, default: false, required: true },
    dateOfBirth: { type: Date, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    profilePicture: { type: String, default: "", required: true }, // default needs to be changed for users who don't have a profile picture
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // list of blocked users' emails
    password: { type: String, required: true },
});

const UserModel = model<User>("User", userSchema);
export default UserModel;
