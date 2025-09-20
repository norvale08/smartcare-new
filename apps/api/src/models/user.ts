import mongoose, { Schema, model, models } from "mongoose";

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  
  // Profile tracking fields - NEW ADDITIONS
  isFirstLogin: { 
    type: Boolean, 
    default: true 
  },
  profileCompleted: { 
    type: Boolean, 
    default: false 
  },
  selectedDiseases: [{ 
    type: String, 
    enum: ["diabetes", "hypertension", "cardiovascular"]
  }],
  
  // Link to patient profile - NEW ADDITION
  patientProfileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient',
    default: null 
  },
  
  lastLoginAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true  // This gives you createdAt and updatedAt automatically
});

const User = models.User || model("User", userSchema);

export default User;
