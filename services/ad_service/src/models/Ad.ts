import { Schema, model } from 'mongoose';

const adSchema = new Schema<Ad>({
    productionYear: { type: Number, required: true },
    price: { type: Number, required: true },
    plateNumber: { type: String, required: true, unique: true }, // plateNumber is not the key for the add but it is unique
    picture: { type: String, required: true }, // String is the picture's url
    model: { type: String, required: true },
    location: {
        country: { type: String, required: true },
        city: { type: String, required: true },
        street: { type: String, required: true },
        zipCode: { type: Number, required: true },
        required: true,
        notNull: true,
    },
    userEmail: { type: String, required: true }, // userEmail is the foreign key to the user which creates the add
    adCreationDate: {
        type: Date,
        required: true,
        default: Date.now,
        notNull: true,
    },
});

const AdModel = model<Ad>('Ad', adSchema);
export default AdModel;
