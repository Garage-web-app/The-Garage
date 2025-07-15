import mongoose, { Schema, model, Types } from "mongoose";

async function checkingUser(
    adCreatorId: Types.ObjectId,
    interesterId: Types.ObjectId,
) {
    if (interesterId.equals(adCreatorId)) {
        throw new Error("Ad creator and interester can't have same id.");
    }
}

interface Chat {
    adCreator: Types.ObjectId;
    interester: Types.ObjectId;
    checkingUser(): void;
    linkedAd: Types.ObjectId;
    massages: [String];
    timeStamps: Date;
}

const chatSchema = new Schema<Chat>({
    adCreator: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    interester: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    linkedAd: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Ad",
        required: true,
    },
    massages: {
        type: [String],
        required: true,
    },
    timeStamps: {
        type: Date,
        required: true,
        default: () => Date.now(),
    },
});

chatSchema.methods.checkingUser = function () {
    if (this.adCreator.equals(this.interester)) {
        throw new Error("Ad creator and interester can't have same id.");
    }
};

const ChatModel = model<Chat>("Chat", chatSchema);
export default ChatModel;
