import mongoose, { Schema, model } from "mongoose";

interface Chat {
    adCreator: mongoose.SchemaTypes.ObjectId;
    intrester: mongoose.SchemaTypes.ObjectId;
    linkedAd: mongoose.SchemaTypes.ObjectId;
    massages: [String];
    timeStamps: Date;
}

const chatSchema = new Schema<Chat>({
    adCreator: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
    },
    intrester: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
    },
    linkedAd: {
        type: mongoose.SchemaTypes.ObjectId,
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

const ChatModel = model<Chat>("Chat", chatSchema);
export default ChatModel;
