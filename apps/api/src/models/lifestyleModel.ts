import mongoose, { Schema, Document } from "mongoose";

export interface ILifestyle extends Document {
  userId: mongoose.Types.ObjectId;
  alcohol: string;
  smoking: string;
  exercise: string;
  sleep: string;
  glucoseContext?: {
    glucose: number;
    context: "Fasting" | "Post-meal" | "Random";
    readingDate: Date;
  };
  aiAdvice?: string;
  language?: "en" | "sw"; // ✅ ADD THIS FIELD
  createdAt: Date;
  updatedAt: Date;
}

const lifestyleSchema = new Schema<ILifestyle>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true // ✅ Add index for faster queries
    },
    alcohol: { 
      type: String, 
      required: true 
    },
    smoking: { 
      type: String, 
      required: true 
    },
    exercise: { 
      type: String, 
      required: true 
    },
    sleep: { 
      type: String, 
      required: true 
    },
    glucoseContext: {
      glucose: { type: Number },
      context: { 
        type: String, 
        enum: ["Fasting", "Post-meal", "Random"] 
      },
      readingDate: { type: Date }
    },
    aiAdvice: { 
      type: String, 
      default: "" 
    },
    language: { 
      type: String, 
      enum: ["en", "sw"], 
      default: "en" 
    } // ✅ LANGUAGE FIELD
  },
  { 
    timestamps: true 
  }
);

// ✅ Add compound index for efficient queries
lifestyleSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ILifestyle>("Lifestyle", lifestyleSchema);