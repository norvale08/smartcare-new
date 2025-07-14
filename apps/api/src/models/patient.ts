import mongoose,{Schema,model,models} from "mongoose";

const PatientSchema = new Schema({
  // Basic Info
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

  // Emergency Contact
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  relationship: {
    type: String,
    enum: ["parent", "sibling", "spouse", "friend", "other"],
    required: true,
  },

  // Conditions
  diabetes: { type: Boolean, default: false },
  hypertension: { type: Boolean, default: false },
  cardiovascular: { type: Boolean, default: false },

  // Medical History
  allergies: { type: String, default: "" },
  surgeries: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now },
});

const Patient = models.Patient ||model("Patient",PatientSchema);

export default Patient;
