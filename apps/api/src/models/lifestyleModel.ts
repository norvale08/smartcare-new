import mongoose, { Schema, Document } from "mongoose";

export interface ILifestyle extends Document {
  userId: mongoose.Types.ObjectId;
  alcohol: "None" | "Occasionally" | "Frequently";
  smoking: "None" | "Light" | "Heavy";
  exercise: "Daily" | "Few times/week" | "Rarely" | "None";
  sleep: "<5 hrs" | "6-7 hrs" | "7-8 hrs" | ">8 hrs" | "Irregular";
  aiAdvice?: string;
  isGenerating?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LifestyleSchema = new Schema<ILifestyle>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    alcohol: {
      type: String,
      enum: ["None", "Occasionally", "Frequently"],
      required: true,
    },
    smoking: {
      type: String,
      enum: ["None", "Light", "Heavy"],
      required: true,
    },
    exercise: {
      type: String,
      enum: ["Daily", "Few times/week", "Rarely", "None"],
      required: true,
    },
    sleep: {
      type: String,
      enum: ["<5 hrs", "6-7 hrs", "7-8 hrs", ">8 hrs", "Irregular"],
      required: true,
    },
    aiAdvice: {
      type: String,
      default: undefined,
    },
    isGenerating: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
LifestyleSchema.index({ userId: 1, updatedAt: -1 });

const Lifestyle = mongoose.models.Lifestyle || mongoose.model<ILifestyle>("Lifestyle", LifestyleSchema);

export default Lifestyle;