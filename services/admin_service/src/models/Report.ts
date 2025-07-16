import mongoose, { Schema, model, Types } from "mongoose";

interface Report {
    sendsReport: Types.ObjectId;
    getsReported: Types.ObjectId;
    timeStamps: Date;
    discription: [String];
}

const reportSchema = new Schema<Report>({
    sendsReport: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    getsReported: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    timeStamps: {
        type: Date,
        required: true,
        default: () => Date.now(),
    },
    discription: {
        type: [String],
        required: true,
    },
});

reportSchema.index({ sendsReport: 1, timeStamps: 1 }, { unique: true });

const ReportModel = model<Report>("Report", reportSchema);
export default ReportModel;
