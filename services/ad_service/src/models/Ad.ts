import {Schema, model } from 'mongoose';

interface Ad {
  productionYear: number;
  price: number;
  plateNumber: string;
  picture: string;                                              //String is the picture's url
  model: string;
  location: {
    country: string;
    city: string;
    street: string;
    zipCode: number;
  };
  userEmail: string;                                            //userEmail is the foreign key to the user which creates the add
  adCreationDate: Date;
}

const adSchema = new Schema<Ad>({
  productionYear: { type: Number, required: true },
  price: { type: Number, required: true },
  plateNumber: { type: String, required: true, unique: true }, //plateNumber is not the key for the add but it is unique
  picture: { type: String, required: true },                   //String is the picture's url
  model: { type: String, required: true }, 
  location: {
    country: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true },
    zipCode: { type: Number, required: true },
    required: true
  },
  userEmail: { type: String, required: true, ref: 'User' },                //userEmail is the foreign key to the user which creates the add
  adCreationDate: { type: Date, required: true, default: Date.now }
});


const AdModel = model<Ad>('Ad', adSchema);
export default AdModel;
