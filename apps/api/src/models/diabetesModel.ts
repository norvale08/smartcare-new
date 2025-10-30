import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IDiabetes extends Document {
    userId: mongoose.Types.ObjectId;
    glucose: number;
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    context: "Fasting" | "Post-meal" | "Random";
    lastMealTime?: "2_hours" | "4_hours" | "6_hours" | "more_than_6_hours";
    mealType?: "carbohydrates" | "sugary_drinks" | "proteins" | "vegetables" | "mixed_meal";
    exerciseRecent?: "none" | "within_2_hours" | "2_to_6_hours" | "6_to_24_hours";
    exerciseIntensity?: "light" | "moderate" | "vigorous";
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
      min: 20,
      max: 600,
    },
    systolic: {
      type: Number,
      required: true,
      min: 70,
      max: 250,
    },
    diastolic: {
      type: Number,
      required: true,
      min: 40,
      max: 150,
    },
    heartRate: {
      type: Number,
      required: true,
      min: 40,
      max: 200,
    },
    context: {
      type: String,
      enum: ["Fasting", "Post-meal", "Random"],
      required: true,
    },
    lastMealTime: {
      type: String,
      enum: ["2_hours", "4_hours", "6_hours", "more_than_6_hours"],
      required: false, // Only required when context is "Post-meal"
    },
    mealType: {
      type: String,
      enum: ["carbohydrates", "sugary_drinks", "proteins", "vegetables", "mixed_meal"],
      required: false, // Only required when context is "Post-meal"
    },
    exerciseRecent: {
      type: String,
      enum: ["none", "within_2_hours", "2_to_6_hours", "6_to_24_hours"],
      required: true,
    },
    exerciseIntensity: {
      type: String,
      enum: ["light", "moderate", "vigorous"],
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

// Custom validation: If context is "Post-meal", require meal fields
DiabetesSchema.pre("save", function (next) {
  if (this.context === "Post-meal") {
    if (!this.lastMealTime || !this.mealType) {
      return next(new Error("lastMealTime and mealType are required when context is Post-meal"));
    }
  }
  next();
});

const Diabetes = models.Diabetes || model("Diabetes", DiabetesSchema);
export default Diabetes;