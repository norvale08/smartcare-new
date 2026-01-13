// FILE: apps/api/src/models/medicationModels.ts
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

const weeklyAdherenceSchema = new mongoose.Schema({
  taken: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed', 'stopped'],
    default: 'pending'
  },
  takenTime: String,
  reason: String,
  markedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Updated side effect schema with doctor information
const experiencedSideEffectSchema = new mongoose.Schema({
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
  },
  intensity: {
    type: String,
    trim: true,
    enum: ['mild', 'moderate', 'severe', 'very severe']
  },
  // Doctor information fields
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  doctorNotes: {
    type: String,
    trim: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
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
    enum: ['active', 'completed', 'missed', 'cancelled', 'stopped'],
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
  
  // Weekly adherence tracking
  weeklyAdherence: {
    type: Map,
    of: weeklyAdherenceSchema,
    default: {}
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
  
  // Experienced side effects (reported by patient) - UPDATED
  experiencedSideEffects: [experiencedSideEffectSchema],
  
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
medicationSchema.index({ 'adherence.stoppedAt': -1 });
medicationSchema.index({ 'experiencedSideEffects.reportedAt': -1 });

export const MedicationModel = mongoose.models.Medication || mongoose.model('Medication', medicationSchema);