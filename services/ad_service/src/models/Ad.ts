import {Schema, model } from 'mongoose';

interface Ad {
  productionYear: number;
  price: number;
  plateNumber: string;
  picture: string;
  model: string; // this is fine now
  location: {
    country: string;
    city: string;
    street: string;
    zipCode: number;
  };
}

const adSchema = new Schema<Ad>({
  productionYear: { type: Number, required: true },
  price: { type: Number, required: true },
  plateNumber: { type: String, required: true, unique: true },
  picture: { type: String, required: true },
  model: { type: String, required: true }, // no conflict now
  location: {
    country: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true },
    zipCode: { type: Number, required: true },
  },
});

const AdModel = model<Ad>('Ad', adSchema);
export default AdModel;
