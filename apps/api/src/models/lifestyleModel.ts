// models/lifestyleModel.ts
import { Schema, model, models } from "mongoose";

const LifestyleSchema = new Schema(
  {
    userId: {
      type: String,
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
    },
    warnings: {
      type: [String],
    },
    glucoseContext: {
      glucose: Number,
      context: String,
      readingDate: Date,
    },
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
LifestyleSchema.index({ userId: 1, createdAt: -1 });

const Lifestyle = models.Lifestyle || model("Lifestyle", LifestyleSchema);
export default Lifestyle;