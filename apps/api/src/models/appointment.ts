// models/Appointment.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  type: 'follow-up' | 'consultation' | 'check-up' | 'emergency';
  scheduledDate: Date;
  duration: number;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema: Schema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['follow-up', 'consultation', 'check-up', 'emergency'],
    default: 'follow-up'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Appointment: Model<IAppointment> = mongoose.model<IAppointment>('Appointment', appointmentSchema);

export default Appointment;