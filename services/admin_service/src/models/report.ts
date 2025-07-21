import { Schema, model, Types } from 'mongoose';

const reportSchema = new Schema<Report>({
    reporter: {
        type: String,
        required: true,
    },
    reported: {
        type: String,
        required: true,
    },
    timeStamp: {
        type: Date,
        required: true,
        default: () => Date.now(),
    },
    discription: {
        type: [String],
        required: true,
    },
});

reportSchema.index({ reporter: 1, timeStamp: 1 }, { unique: true });

const ReportModel = model<Report>('Report', reportSchema);
export default ReportModel;
