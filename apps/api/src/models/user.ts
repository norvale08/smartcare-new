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
    
    // ✅ RELATIVE-SPECIFIC FIELDS
    invitationStatus: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    invitationToken: {
      type: String,
      default: null,
    },
    invitationExpires: {
      type: Date,
      default: null,
    },
    invitationSentAt: {
      type: Date,
      default: null,
    },
    isEmergencyContact: {
      type: Boolean,
      default: false,
    },
    relationshipToPatient: {
      type: String,
      default: "",
    },
    monitoredPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    monitoredPatientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },
    accessLevel: {
      type: String,
      enum: ["view_only", "caretaker", "emergency_only"],
      default: "view_only",
    },
    adminNotes: {
      type: String,
      default: "",
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

    // NEW: Doctor Profile Fields (filled by doctor themselves)
    bio: {
      type: String,
      default: "",
    },
    yearsOfExperience: {
      type: Number,
      default: null,
      min: 0,
      max: 60
    },
    contactInfo: {
      alternateEmail: {
        type: String,
        default: ""
      },
      emergencyContact: {
        type: String,
        default: ""
      }
    },
    profileUpdatedAt: {
      type: Date,
      default: null
    },

    // For patients: array of doctor IDs they've requested
    requestedDoctors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    
    // For doctors: array of patient requests
    pendingRequests: [{
      patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      patientName: String,
      requestedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
      }
    }],
    
    assignedPatients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    
    assignedDoctor: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    condition: {
      type: String,
      enum: ['hypertension', 'diabetes', 'both', ''],
      default: 'hypertension'
    },
    
    lastVisit: {
      type: Date
    }
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ assignedDoctor: 1 });
userSchema.index({ 'assignedPatients': 1 });
userSchema.index({ specialization: 1 }); // For doctor searches
userSchema.index({ yearsOfExperience: -1 }); // For sorting by experience
userSchema.index({ invitationStatus: 1 }); // ✅ Add for relative queries
userSchema.index({ invitationExpires: 1 }); // ✅ Add for expiration checks

// Virtual for full name if not set
userSchema.virtual('displayName').get(function() {
  if (this.fullName) return this.fullName;
  if (this.firstName || this.lastName) {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  return this.email;
});

// Virtual for doctor's experience level
userSchema.virtual('experienceLevel').get(function() {
  if (!this.yearsOfExperience) return "Not specified";
  if (this.yearsOfExperience < 3) return "Junior";
  if (this.yearsOfExperience < 8) return "Mid-Level";
  if (this.yearsOfExperience < 15) return "Senior";
  return "Expert";
});

// Virtual for relative's invitation status
userSchema.virtual('isInvitationValid').get(function() {
  if (this.role !== 'relative') return false;
  if (this.invitationStatus !== 'pending') return false;
  if (!this.invitationExpires) return false;
  return new Date() < this.invitationExpires;
});

// Pre-save hook to ensure fullName is set
userSchema.pre('save', function(next) {
  if (!this.fullName && (this.firstName || this.lastName)) {
    this.fullName = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  
  // Update profileUpdatedAt when profile fields change
  if (this.isModified('bio') || this.isModified('yearsOfExperience') || this.isModified('contactInfo')) {
    this.profileUpdatedAt = new Date();
  }
  
  // Set profileCompleted for doctors based on required fields
  if (this.role === 'doctor') {
    const hasRequiredProfileFields = Boolean(this.bio && this.bio.length > 0 && this.yearsOfExperience !== null);
    this.profileCompleted = hasRequiredProfileFields;
  }
  
  // Auto-update invitation status if expired
  if (this.role === 'relative' && this.invitationStatus === 'pending' && this.invitationExpires) {
    if (new Date() > this.invitationExpires) {
      this.invitationStatus = 'expired';
    }
  }
  
  next();
});

const User = models.User || model("User", userSchema);

export default User;