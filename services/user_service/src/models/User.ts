import {Schema, model } from 'mongoose';

interface User {
  _id: string;                                           //_id is the user's email (primary key)
  fullName: {
    firstName: string, 
    lastName: string
  };
  emailVerification: boolean;
  dateOfBirth: Date;
  isAdmin: boolean;
  profilePicture: string;                                //url to the profile picture
  blockedUsers: User[];                                  
  password: string;
  isInterestedIn: [{                                  //list of ads that this user is interested in
    adCreator: User,
    linkedAd: String,                                   //referencing the ad id
    messages: [{
      message: string,
      timeStamp: Date
    }]
  }];                              
  postedInterests:                                      //list of users that are interested in this user's posted ads
  [{                                    
    interestedUser: User,
    linkedAd: String,                                   //referencing the ad id
    messages: [{
      message: string,
      timeStamp: Date
    }],
  }];                            
}

const userSchema = new Schema<User>({
  _id: { type: String, required: true},                 //_id is the user's email (primary key)
  fullName: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
  emailVerification: { type: Boolean, default: false },
  dateOfBirth: { type: Date, required: true },
  isAdmin: { type: Boolean, default: false },
  profilePicture: { type: String, default: ""},        // default needs to be changed for users who don't have a profile picture
  blockedUsers: [{ type: String, ref: 'User' }],       // list of blocked users' emails
  password: { type: String, required: true },
  isInterestedIn: [{                                   //list of ads that this user is interested in
    adCreator: { type: String, ref: 'User' },
    linkedAd: { type: String, ref: 'Ad' },              //referencing the ad id
    messages: [{
      message: String,
      timeStamp: { type: Date, default: Date.now }
    }]
  }],
  postedInterests: [{                                   //list of users that are interested in this user's posted ads
    interestedUser: { type: String, ref: 'User' },
    linkedAd: { type: String, ref: 'Ad' },              //referencing the ad id
    messages: [{
      message: String,
      timeStamp: { type: Date, default: Date.now }
    }]
  }]

});


const UserModel = model<User>('User', userSchema);
export default UserModel;
