import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Role field
    role: {
      type: String,
      enum: ["patient", "doctor", "admin", "relative"],
      default: "patient",
    },

    // Patient fields
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    
    // CRITICAL: Disease boolean fields (for login redirect logic)
    // For Patients: indicates their conditions
    // For Doctors: indicates conditions they treat
    diabetes: {
      type: Boolean,
      default: false,
    },
    hypertension: {
      type: Boolean,
      default: false,
    },
    cardiovascular: {
      type: Boolean,
      default: false,
    },
    
    // Disease array (for display/reference) - mainly for patients
    selectedDiseases: [
      {
        type: String,
        enum: ["diabetes", "hypertension", "cardiovascular"],
      },
    ],
    
    // Additional profile fields (used by profile routes)
    fullName: {
      type: String,
      default: "",
    },
    firstname: {
      type: String,
      default: "",
    },
    lastname: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      default: "",
    },
    weight: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    relationship: {
      type: String,
      default: "",
    },
    allergies: {
      type: String,
      default: "",
    },
    surgeries: {
      type: String,
      default: "",
    },
    conditions: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
      default: null,
    },
    
    patientProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },

    // Doctor fields
    specialization: {
      type: String,
      default: null,
    },
    licenseNumber: {
      type: String,
      default: null,
    },
    hospital: {
      type: String,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

const User = models.User || model("User", userSchema);

export default User;