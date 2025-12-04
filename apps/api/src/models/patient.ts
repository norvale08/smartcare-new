import mongoose, { Schema, model, models } from "mongoose";

const PatientSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  fullName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: {
    type: String,
    enum: ["male", "female", "other", "prefer-not-to-say"],
    required: true,
  },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  picture: { type: String }, // Store base64 or URL


  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  relationship: {
    type: String,
    enum: ["parent", "sibling", "spouse", "friend", "other"],
    required: true,
  },


  diabetes: { type: Boolean, default: false },
  hypertension: { type: Boolean, default: false },
  cardiovascular: { type: Boolean, default: false },


  allergies: { type: String, default: "" },
  surgeries: { type: String, default: "" },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // assigned doctor
  location: {
    type: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
      updatedAt: { type: Date, default: Date.now },
    },
    default: null,
  },

},

  { timestamps: true }   
);

const Patient = models.Patient || model("Patient", PatientSchema);

export default Patient;
