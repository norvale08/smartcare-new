import mongoose, { Schema, Document } from 'mongoose';

export interface IHypertensionVital extends Document {
   userId: mongoose.Schema.Types.ObjectId;
  systolic: number;
  diastolic: number;
  heartRate: number;
  timestamp: Date;
}

const HypertensionVitalSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Optional: reference to User model
    required: true,
  },
  
  systolic: { type: Number, required: true },
  diastolic: { type: Number, required: true },
  heartRate: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

HypertensionVitalSchema.index({ userId: 1, timestamp: -1 });

const HypertensionVital = mongoose.model<IHypertensionVital>(
  'HypertensionVital',
  HypertensionVitalSchema,
  'hypertension' // Name of the MongoDB collection
);

export default HypertensionVital;
