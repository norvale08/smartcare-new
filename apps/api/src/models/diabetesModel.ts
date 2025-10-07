import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IDiabetes extends Document {
    userId: mongoose.Types.ObjectId;
    glucose: number;
    context: "Fasting" | "Post-meal" | "Random";
    language: "en" | "sw";
    aiRequested?: boolean;
    aiFeedback?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DiabetesSchema = new Schema(
  {
    glucose: {
      type: Number,
      required: true,
    },
    context: {
      type: String,
      enum: ["Fasting", "Post-meal", "Random"],
      required: true,
    },
    language: {
      type: String,
      enum: ["en", "sw"],
      default: "en",
    },
    userId: {
      type: String,
      required: true,
    },
    aiRequested: {
      type: Boolean,
      default: false,
    },
    aiFeedback: {
      type: String,
    },
  },
  { timestamps: true }
);

const Diabetes = models.Diabetes || model("Diabetes", DiabetesSchema);
export default Diabetes;
