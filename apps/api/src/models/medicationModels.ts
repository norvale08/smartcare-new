// FILE: apps/api/src/models/medicationModels.ts
// Update the medicationSchema to include adherence tracking

import mongoose from "mongoose";

const adherenceEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['taken', 'missed', 'stopped'],
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const medicationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
    enum: ['active', 'completed', 'missed', 'cancelled', 'stopped'], // Added 'stopped'
    default: 'active'
  },
  
  // Patient adherence tracking
  adherence: {
    currentStatus: {
      type: String,
      enum: ['taken', 'missed', 'stopped'],
      default: 'taken'
    },
    reasonForStopping: {
      type: String,
      trim: true
    },
    stoppedAt: {
      type: Date
    },
    history: [adherenceEntrySchema]
  },
  
  // Patient allergies (added by doctor during prescription)
  patientAllergies: [{
    allergyName: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true
    },
    reaction: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Potential side effects of THIS medication (added by doctor)
  potentialSideEffects: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['common', 'uncommon', 'rare'],
      default: 'common'
    },
    description: {
      type: String,
      trim: true
    }
  }],
  
  // Experienced side effects (reported by patient)
  experiencedSideEffects: [{
    sideEffectName: {
      type: String,
      required: true,
      trim: true
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
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

medicationSchema.index({ patientId: 1, status: 1 });
medicationSchema.index({ prescribedBy: 1 });

export const MedicationModel = mongoose.models.Medication || mongoose.model('Medication', medicationSchema);