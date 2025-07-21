import { Schema, model } from 'mongoose';

async function checkUser(adCreatorEmail: string, interesterEmail: string) {
    if (interesterEmail === adCreatorEmail) {
        throw new Error("Ad creator and interester can't have same id.");
    }
}

const chatSchema = new Schema<Chat>({
    adCreator: {
        type: String,
        required: true,
    },
    interester: {
        type: String,
        required: true,
    },
    linkedAd: {
        type: String,
        required: true,
    },
    messages: [
        {
            sender: {
                type: String,
                required: true,
            },
            message: {
                type: String,
                required: true,
            },
            timeStamps: {
                type: Date,
                required: true,
                default: Date.now,
            },
        },
    ],
});

chatSchema.methods.checkUser = checkUser;

const ChatModel = model<Chat>('Chat', chatSchema);
export default ChatModel;
