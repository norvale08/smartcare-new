//models/user.ts
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
    selectedDiseases: [
      {
        type: String,
        enum: ["diabetes", "hypertension", "cardiovascular"],
      },
    ],
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
