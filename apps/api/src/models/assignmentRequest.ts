import mongoose, { Schema, model, models } from "mongoose";

const assignmentRequestSchema = new Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false
  },
  type: {
    type: String,
    enum: ['doctor', 'hospital'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    required: false
  },
  assessedAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

const AssignmentRequest = models.AssignmentRequest || model("AssignmentRequest", assignmentRequestSchema);

export default AssignmentRequest;
