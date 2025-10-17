// models/foodRecommendationModel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IFoodRecommendation extends Document {
  userId: string;
  foodAdvice: string;
  isGenerating: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FoodRecommendationSchema = new Schema<IFoodRecommendation>({
  userId: { type: String, required: true },
  foodAdvice: { type: String },
  isGenerating: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IFoodRecommendation>("FoodRecommendation", FoodRecommendationSchema);
