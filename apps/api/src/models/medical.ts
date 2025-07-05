import mongoose, { Schema, Document } from 'mongoose';

export interface IMedical extends Document {
  hypertension: boolean;
  diabetes: boolean;
  asthma: boolean;
  stroke: boolean;
  surgeries?: string;
  allergies?: string;
}

const MedicalSchema: Schema = new Schema({
  hypertension: { type: Boolean, required: true },
  diabetes: { type: Boolean, required: true },
  asthma: { type: Boolean, required: true },
  stroke: { type: Boolean, required: true },
  surgeries: { type: String, default: '' },
  allergies: { type: String, default: '' },
});

export default mongoose.model<IMedical>('Medical', MedicalSchema);
