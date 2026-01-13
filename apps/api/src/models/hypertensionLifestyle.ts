import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILifestyle extends Document {
  userId: mongoose.Types.ObjectId;
  smoking: string;
  alcohol: string;
  exercise: string;
  sleep: string;
  aiAdvice?: string;
  warnings: string[];
  dietData?: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
    generalAdvice: string;
    calorieTarget?: number;
  };
  dietUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const LifestyleSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  smoking: { 
    type: String, 
    enum: ['None', 'Light', 'Heavy'], 
    default: 'None' 
  },
  alcohol: { 
    type: String, 
    enum: ['None', 'Occasionally', 'Frequently'], 
    default: 'None' 
  },
  exercise: { 
    type: String, 
    enum: ['Daily', 'Few times/week', 'Rarely', 'None'], 
    default: 'None' 
  },
  sleep: { 
    type: String, 
    enum: ['<5 hrs', '6-7 hrs', '7-8 hrs', '>8 hrs', 'Irregular'], 
    default: 'Irregular' 
  },
  aiAdvice: { 
    type: String 
  },
  warnings: [{ 
    type: String 
  }],
  dietData: {
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' },
    snacks: { type: String, default: '' },
    generalAdvice: { type: String, default: '' },
    calorieTarget: { type: Number, default: null }
  },
  dietUpdatedAt: { type: Date }
}, { timestamps: true });

const HypertensionLifestyle: Model<ILifestyle> = mongoose.model<ILifestyle>(
  'HypertensionLifestyle',
  LifestyleSchema
);

export default HypertensionLifestyle;
