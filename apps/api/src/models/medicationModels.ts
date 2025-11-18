// models/MedicationModel.ts
import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicationName: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  reminders: [{
    type: String,
    trim: true
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'missed', 'cancelled'],
    default: 'active'
  },
  lastTaken: {
    type: Date
  },
  takenHistory: [{
    takenAt: {
      type: Date,
      default: Date.now
    },
    doseTime: String
  }]
}, {
  timestamps: true
});

// Check if model already exists to prevent OverwriteModelError
export const MedicationModel = mongoose.models.Medication || mongoose.model('Medication', medicationSchema);