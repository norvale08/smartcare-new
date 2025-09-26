//models/hypertensionVitals.ts
import mongoose, { Schema, Document, model } from 'mongoose';

export interface IHypertensionVital extends Document {
  userId: mongoose.Types.ObjectId;
  systolic: number;
  diastolic: number;
  heartRate: number;
  createdAt: Date;
  updatedAt: Date;
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
},
  { timestamps: true });

HypertensionVitalSchema.index({ userId: 1, createdAt: -1 });

const HypertensionVital =
  mongoose.models.HypertensionVital ||
  model<IHypertensionVital>("HypertensionVital", HypertensionVitalSchema, "hypertension");

export default HypertensionVital;
