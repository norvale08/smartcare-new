import mongoose, { Schema, model, models } from "mongoose";

const HospitalSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Hospital = models.Hospital || model("Hospital", HospitalSchema);

export default Hospital;
