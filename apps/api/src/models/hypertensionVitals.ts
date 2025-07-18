import mongoose, { Schema, Document } from 'mongoose';

export interface IHypertensionVital extends Document {
  systolic: number;
  diastolic: number;
  heartRate: number;
  timestamp: Date;
}

const HypertensionVitalSchema: Schema = new Schema({
  systolic: { type: Number, required: true },
  diastolic: { type: Number, required: true },
  heartRate: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

const HypertensionVital = mongoose.model<IHypertensionVital>(
  'HypertensionVital',
  HypertensionVitalSchema,
  'hypertension' // Name of the MongoDB collection
);

export default HypertensionVital;
