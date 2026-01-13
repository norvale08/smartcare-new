// utils/predictionModels.ts
import * as tf from '@tensorflow/tfjs';

const HYPERTENSION_SAMPLES = 500;
const DIABETES_SAMPLES = 300;
const TRAINING_EPOCHS = 20;

let backendReadyPromise: Promise<void> | null = null;
const ensureBackendReady = async () => {
  if (!backendReadyPromise) {
    backendReadyPromise = (async () => {
      try {
        await tf.ready();
      } catch (error) {
        console.warn('TensorFlow initialization warning:', error);
      }
    })();
  }
  return backendReadyPromise;
};

const calculateSlope = (values: number[]): number => {
  if (!values || values.length < 2) return 0;
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, idx) => sum + idx * y, 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
};

interface PatientVitals {
  systolic: number;
  diastolic: number;
  heartRate: number;
  age: number;
  bmi?: number;
  glucose?: number;
  cholesterol?: number;
}

interface PredictionResult {
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  recommendation: string;
  trends?: {
    systolicTrend: 'increasing' | 'decreasing' | 'stable';
    diastolicTrend: 'increasing' | 'decreasing' | 'stable';
    glucoseTrend?: 'increasing' | 'decreasing' | 'stable';
    heartRateTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

class HypertensionPredictor {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;

  async loadModel() {
    try {
      await ensureBackendReady();
      // Try to load pre-trained model from local storage first
      const localStorageKey = 'hypertension-model';
      const modelArtifacts = localStorage.getItem(localStorageKey);
      
      if (modelArtifacts) {
        console.log('📁 Loading hypertension model from localStorage...');
        this.model = await tf.loadLayersModel(`localstorage://${localStorageKey}`);
      } else {
        console.log('🤖 Creating and training new hypertension model...');
        this.model = await this.createAndTrainModel();
        
        // Save to localStorage for future use
        const saveResult = await this.model.save(`localstorage://${localStorageKey}`);
        console.log('💾 Model saved to localStorage');
      }
      
      this.isModelLoaded = true;
      console.log('✅ Hypertension model loaded successfully');
    } catch (error) {
      console.log('❌ Could not load/create hypertension model, using rule-based predictor');
      this.model = null;
      this.isModelLoaded = false;
    }
  }

  private async createAndTrainModel(): Promise<tf.LayersModel> {
    await ensureBackendReady();
    // Create a simple neural network
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [5], units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 6, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // 3 classes: low, medium, high
      ]
    });

    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    // Generate synthetic training data based on medical guidelines
    const { features, labels } = this.generateTrainingData();
    
    // Train the model
    await model.fit(features, labels, {
      epochs: TRAINING_EPOCHS,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });

    return model;
  }

  private generateTrainingData() {
    const features = [];
    const labels = [];
    
    // Generate synthetic data covering various scenarios
    for (let i = 0; i < HYPERTENSION_SAMPLES; i++) {
      const systolic = Math.random() * 80 + 80; // 80-160
      const diastolic = Math.random() * 50 + 60; // 60-110
      const heartRate = Math.random() * 70 + 50; // 50-120
      const age = Math.random() * 60 + 20; // 20-80
      const bmi = Math.random() * 20 + 18; // 18-38
      
      // Calculate risk based on medical rules (this becomes our "ground truth")
      let riskCategory: number;
      let riskScore = 0;
      
      // Blood pressure factors
      if (systolic >= 140 || diastolic >= 90) riskScore += 3;
      else if (systolic >= 130 || diastolic >= 85) riskScore += 2;
      else if (systolic >= 120 || diastolic >= 80) riskScore += 1;
      
      // Age factors
      if (age >= 65) riskScore += 2;
      else if (age >= 45) riskScore += 1;
      
      // BMI factors
      if (bmi >= 30) riskScore += 2;
      else if (bmi >= 25) riskScore += 1;
      
      // Determine category
      if (riskScore >= 4) riskCategory = 2; // high
      else if (riskScore >= 2) riskCategory = 1; // medium
      else riskCategory = 0; // low
      
      features.push([systolic, diastolic, heartRate, age, bmi]);
      
      // One-hot encoding for labels
      const label = [0, 0, 0];
      label[riskCategory] = 1;
      labels.push(label);
    }
    
    return {
      features: tf.tensor2d(features),
      labels: tf.tensor2d(labels)
    };
  }

  async predict(vitals: PatientVitals, historicalVitals?: PatientVitals[]): Promise<PredictionResult> {
    try {
      // Ensure model is loaded
      if (!this.isModelLoaded) {
        await this.loadModel();
      }
      
      if (this.model && this.isModelLoaded) {
        return await this.predictWithML(vitals, historicalVitals);
      } else {
        return this.predictWithRules(vitals, historicalVitals);
      }
    } catch (error) {
      console.error('Prediction error, using fallback rules:', error);
      // Fallback to rule-based prediction if ML fails
      return this.predictWithRules(vitals, historicalVitals);
    }
  }

  private async predictWithML(vitals: PatientVitals, historicalVitals?: PatientVitals[]): Promise<PredictionResult> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    // Prepare input data
    const input = tf.tensor2d([[
      vitals.systolic,
      vitals.diastolic, 
      vitals.heartRate,
      vitals.age,
      vitals.bmi || 25
    ]]);

    // Make prediction
    const prediction = this.model.predict(input) as tf.Tensor;
    const probabilities = await prediction.data();
    
    // Clean up tensors to prevent memory leaks
    input.dispose();
    prediction.dispose();

    // Interpret results with proper type safety
    const riskProbabilities = {
      low: probabilities[0] || 0,
      medium: probabilities[1] || 0, 
      high: probabilities[2] || 0
    };

    // Determine the highest probability risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let maxProbability = riskProbabilities.low;
    
    if (riskProbabilities.medium > maxProbability) {
      riskLevel = 'medium';
      maxProbability = riskProbabilities.medium;
    }
    if (riskProbabilities.high > maxProbability) {
      riskLevel = 'high';
      maxProbability = riskProbabilities.high;
    }

    // Generate recommendation
    const recommendation = this.generateMLRecommendation(riskLevel, vitals);
    
    return {
      riskLevel,
      probability: maxProbability,
      recommendation,
      trends: this.analyzeTrends(historicalVitals)
    };
  }

  private generateMLRecommendation(riskLevel: string, vitals: PatientVitals): string {
    const { systolic, diastolic, age } = vitals;
    
    switch (riskLevel) {
      case 'high':
        return `AI DETECTED HIGH RISK: Blood pressure ${systolic}/${diastolic} mmHg indicates hypertension. Immediate medical consultation recommended. Consider medication adjustment.`;
      
      case 'medium':
        return `AI DETECTED MODERATE RISK: Pre-hypertensive levels detected. Lifestyle modifications, reduced salt intake, and regular monitoring advised.`;
      
      case 'low':
        return `AI DETECTED LOW RISK: Blood pressure within normal range. Maintain healthy lifestyle with balanced diet and exercise.`;
      
      default:
        return 'Continue regular monitoring.';
    }
  }

  private analyzeTrends(historicalVitals?: PatientVitals[]): {
    systolicTrend: 'increasing' | 'decreasing' | 'stable';
    diastolicTrend: 'increasing' | 'decreasing' | 'stable';
    heartRateTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    // Default to stable if not enough data
    const defaultTrends = {
      systolicTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      diastolicTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      heartRateTrend: 'stable' as 'increasing' | 'decreasing' | 'stable'
    };

    if (!historicalVitals || historicalVitals.length < 2) {
      return defaultTrends;
    }

    // Filter out readings that don't have the required data
    const validSystolicVitals = historicalVitals.filter(v => v.systolic !== undefined && v.systolic !== null);
    const validDiastolicVitals = historicalVitals.filter(v => v.diastolic !== undefined && v.diastolic !== null);
    const validHRVitals = historicalVitals.filter(v => v.heartRate !== undefined && v.heartRate !== null);

    const trends = { ...defaultTrends };

    // Only calculate trends if we have enough valid data points
    if (validSystolicVitals.length >= 2) {
      const systolicValues = validSystolicVitals.map(v => v.systolic!);
      const systolicSlope = calculateSlope(systolicValues);
      if (systolicSlope > 2) trends.systolicTrend = 'increasing';
      else if (systolicSlope < -2) trends.systolicTrend = 'decreasing';
    }

    if (validDiastolicVitals.length >= 2) {
      const diastolicValues = validDiastolicVitals.map(v => v.diastolic!);
      const diastolicSlope = calculateSlope(diastolicValues);
      if (diastolicSlope > 2) trends.diastolicTrend = 'increasing';
      else if (diastolicSlope < -2) trends.diastolicTrend = 'decreasing';
    }

    if (validHRVitals.length >= 2) {
      const hrValues = validHRVitals.map(v => v.heartRate!);
      const hrSlope = calculateSlope(hrValues);
      if (hrSlope > 3) trends.heartRateTrend = 'increasing';
      else if (hrSlope < -3) trends.heartRateTrend = 'decreasing';
    }

    return trends;
  }

  // slope helper removed in favor of shared utility

  private predictWithRules(vitals: PatientVitals, historicalVitals?: PatientVitals[]): PredictionResult {
    const { systolic, diastolic, age, bmi = 25 } = vitals;
    
    let riskScore = 0;
    
    if (systolic >= 140 || diastolic >= 90) riskScore += 3;
    else if (systolic >= 130 || diastolic >= 85) riskScore += 2;
    else if (systolic >= 120 || diastolic >= 80) riskScore += 1;
    
    if (age >= 65) riskScore += 2;
    else if (age >= 45) riskScore += 1;
    
    if (bmi >= 30) riskScore += 2;
    else if (bmi >= 25) riskScore += 1;
    
    const trends = this.analyzeTrends(historicalVitals);
    
    if (trends.systolicTrend === 'increasing' || trends.diastolicTrend === 'increasing') {
      riskScore += 1;
    }

    if (riskScore >= 4) {
      return {
        riskLevel: 'high',
        probability: 0.7 + (riskScore - 4) * 0.1,
        recommendation: 'High hypertension risk. Recommend immediate lifestyle changes and frequent monitoring.',
        trends
      };
    } else if (riskScore >= 2) {
      return {
        riskLevel: 'medium',
        probability: 0.3 + (riskScore - 2) * 0.2,
        recommendation: 'Moderate hypertension risk. Suggest dietary changes and regular exercise.',
        trends
      };
    } else {
      return {
        riskLevel: 'low',
        probability: 0.1 + riskScore * 0.1,
        recommendation: 'Low hypertension risk. Maintain healthy lifestyle.',
        trends
      };
    }
  }
}

class DiabetesPredictor {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;

  async loadModel() {
    try {
      const localStorageKey = 'diabetes-model';
      const modelArtifacts = localStorage.getItem(localStorageKey);
      
      if (modelArtifacts) {
        console.log('📁 Loading diabetes model from localStorage...');
        this.model = await tf.loadLayersModel(`localstorage://${localStorageKey}`);
      } else {
        console.log('🤖 Creating and training new diabetes model...');
        this.model = await this.createAndTrainModel();
        await this.model.save(`localstorage://${localStorageKey}`);
        console.log('💾 Diabetes model saved to localStorage');
      }
      
      this.isModelLoaded = true;
      console.log('✅ Diabetes model loaded successfully');
    } catch (error) {
      console.log('❌ Could not load/create diabetes model, using rule-based predictor');
      this.model = null;
      this.isModelLoaded = false;
    }
  }

  private async createAndTrainModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 6, activation: 'relu' }),
        tf.layers.dense({ units: 4, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    const { features, labels } = this.generateTrainingData();
    
    await model.fit(features, labels, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });

    return model;
  }

  private generateTrainingData() {
    const features = [];
    const labels = [];
    
    for (let i = 0; i < DIABETES_SAMPLES; i++) {
      const glucose = Math.random() * 150 + 50; // 50-200
      const age = Math.random() * 60 + 20; // 20-80
      const bmi = Math.random() * 20 + 18; // 18-38
      const systolic = Math.random() * 80 + 80; // 80-160
      
      let riskCategory: number;
      let riskScore = 0;
      
      if (glucose >= 200) riskScore += 3;
      else if (glucose >= 126) riskScore += 2;
      else if (glucose >= 100) riskScore += 1;
      
      if (age >= 45) riskScore += 1;
      
      if (bmi >= 30) riskScore += 2;
      else if (bmi >= 25) riskScore += 1;
      
      if (systolic >= 140) riskScore += 1;
      
      if (riskScore >= 3) riskCategory = 2; // high
      else if (riskScore >= 2) riskCategory = 1; // medium
      else riskCategory = 0; // low
      
      features.push([glucose, age, bmi, systolic]);
      
      const label = [0, 0, 0];
      label[riskCategory] = 1;
      labels.push(label);
    }
    
    return {
      features: tf.tensor2d(features),
      labels: tf.tensor2d(labels)
    };
  }

  async predict(vitals: PatientVitals & { glucose: number }, historicalVitals?: (PatientVitals & { glucose: number })[]): Promise<PredictionResult> {
    try {
      if (!this.isModelLoaded) {
        await this.loadModel();
      }
      
      if (this.model && this.isModelLoaded) {
        return await this.predictWithML(vitals, historicalVitals);
      } else {
        return this.predictWithRules(vitals, historicalVitals);
      }
    } catch (error) {
      console.error('Diabetes prediction error, using fallback rules:', error);
      return this.predictWithRules(vitals, historicalVitals);
    }
  }

  private async predictWithML(vitals: PatientVitals & { glucose: number }, historicalVitals?: (PatientVitals & { glucose: number })[]): Promise<PredictionResult> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const input = tf.tensor2d([[
      vitals.glucose,
      vitals.age,
      vitals.bmi || 25,
      vitals.systolic
    ]]);

    const prediction = this.model.predict(input) as tf.Tensor;
    const probabilities = await prediction.data();
    
    input.dispose();
    prediction.dispose();

    // Fix: Ensure all probabilities have default values
    const riskProbabilities = {
      low: probabilities[0] || 0,
      medium: probabilities[1] || 0,
      high: probabilities[2] || 0
    };

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let maxProbability = riskProbabilities.low;
    
    if (riskProbabilities.medium > maxProbability) {
      riskLevel = 'medium';
      maxProbability = riskProbabilities.medium;
    }
    if (riskProbabilities.high > maxProbability) {
      riskLevel = 'high';
      maxProbability = riskProbabilities.high;
    }

    const recommendation = this.generateMLRecommendation(riskLevel, vitals);
    const glucoseTrend = this.analyzeGlucoseTrend(historicalVitals);
    
    return {
      riskLevel,
      probability: maxProbability,
      recommendation,
      trends: {
        systolicTrend: 'stable',
        diastolicTrend: 'stable',
        glucoseTrend,
        heartRateTrend: 'stable'
      }
    };
  }

  private generateMLRecommendation(riskLevel: string, vitals: PatientVitals & { glucose: number }): string {
    const { glucose, age } = vitals;
    
    switch (riskLevel) {
      case 'high':
        return `AI DETECTED HIGH DIABETES RISK: Glucose level ${glucose} mg/dL indicates diabetes. Urgent medical consultation and HbA1c test recommended.`;
      
      case 'medium':
        return `AI DETECTED MODERATE DIABETES RISK: Pre-diabetic glucose levels. Dietary changes, increased activity, and regular monitoring advised.`;
      
      case 'low':
        return `AI DETECTED LOW DIABETES RISK: Glucose levels within normal range. Maintain healthy diet with controlled sugar intake.`;
      
      default:
        return 'Continue regular glucose monitoring.';
    }
  }

  private analyzeGlucoseTrend(historicalVitals?: (PatientVitals & { glucose: number })[]): 'increasing' | 'decreasing' | 'stable' {
    if (!historicalVitals || historicalVitals.length < 2) return 'stable';
    
    // Filter out readings without glucose data
    const validGlucoseVitals = historicalVitals.filter(v => v.glucose !== undefined && v.glucose !== null);
    
    if (validGlucoseVitals.length < 2) return 'stable';
    
    const glucoseValues = validGlucoseVitals.map(v => v.glucose!);
    const slope = calculateSlope(glucoseValues);
    
    if (slope > 2) return 'increasing';
    if (slope < -2) return 'decreasing';
    return 'stable';
  }

  // slope helper removed in favor of shared utility

  private predictWithRules(vitals: PatientVitals & { glucose: number }, historicalVitals?: (PatientVitals & { glucose: number })[]): PredictionResult {
    const { glucose, age, bmi = 25 } = vitals;
    
    let riskScore = 0;
    
    if (glucose >= 200) riskScore += 3;
    else if (glucose >= 126) riskScore += 2;
    else if (glucose >= 100) riskScore += 1;
    
    if (age >= 45) riskScore += 1;
    
    if (bmi >= 30) riskScore += 2;
    else if (bmi >= 25) riskScore += 1;

    const glucoseTrend = this.analyzeGlucoseTrend(historicalVitals);

    if (riskScore >= 3) {
      return {
        riskLevel: 'high',
        probability: 0.6 + (riskScore - 3) * 0.15,
        recommendation: 'High diabetes risk. Recommend HbA1c test and consultation.',
        trends: {
          systolicTrend: 'stable',
          diastolicTrend: 'stable',
          glucoseTrend,
          heartRateTrend: 'stable'
        }
      };
    } else if (riskScore >= 2) {
      return {
        riskLevel: 'medium',
        probability: 0.3 + (riskScore - 2) * 0.3,
        recommendation: 'Moderate diabetes risk. Suggest lifestyle modifications.',
        trends: {
          systolicTrend: 'stable',
          diastolicTrend: 'stable',
          glucoseTrend,
          heartRateTrend: 'stable'
        }
      };
    } else {
      return {
        riskLevel: 'low',
        probability: 0.1 + riskScore * 0.1,
        recommendation: 'Low diabetes risk. Maintain healthy diet.',
        trends: {
          systolicTrend: 'stable',
          diastolicTrend: 'stable',
          glucoseTrend,
          heartRateTrend: 'stable'
        }
      };
    }
  }
}

// Export singleton instances
export const hypertensionPredictor = new HypertensionPredictor();
export const diabetesPredictor = new DiabetesPredictor();

// Export types for use in other modules
export type { PatientVitals, PredictionResult };

export interface HistoricalRiskInsight {
  label: 'stable' | 'elevating' | 'critical';
  score: number;
  summary: string;
  averages: {
    systolic: number;
    diastolic: number;
    heartRate?: number;
  };
  slopes: {
    systolic: number;
    diastolic: number;
  };
}

export const deriveHistoricalRiskFromVitals = (
  vitals: PatientVitals[],
  options?: { window?: number; language?: 'en' | 'sw' }
): HistoricalRiskInsight | null => {
  if (!vitals || vitals.length === 0) return null;
  const windowSize = options?.window ?? 6;
  const meaningfulVitals = vitals
    .filter(v => typeof v.systolic === 'number' && typeof v.diastolic === 'number')
    .slice(0, windowSize);

  if (meaningfulVitals.length < 3) return null;

  const average = (key: keyof PatientVitals) =>
    meaningfulVitals.reduce((sum, vital) => sum + (vital[key] || 0), 0) / meaningfulVitals.length;

  const avgSystolic = average('systolic');
  const avgDiastolic = average('diastolic');
  const avgHeartRate = average('heartRate');

  const systolicValues = meaningfulVitals.map(v => v.systolic || 0);
  const diastolicValues = meaningfulVitals.map(v => v.diastolic || 0);

  const slopes = {
    systolic: calculateSlope(systolicValues),
    diastolic: calculateSlope(diastolicValues)
  };

  const variability = {
    systolic: Math.max(...systolicValues) - Math.min(...systolicValues),
    diastolic: Math.max(...diastolicValues) - Math.min(...diastolicValues)
  };

  let score = 0;
  if (avgSystolic >= 150 || avgDiastolic >= 95) score += 4;
  else if (avgSystolic >= 140 || avgDiastolic >= 90) score += 3;
  else if (avgSystolic >= 130 || avgDiastolic >= 85) score += 2;
  else if (avgSystolic >= 120 || avgDiastolic >= 80) score += 1;

  if (slopes.systolic > 2 || slopes.diastolic > 2) score += 1;
  if (variability.systolic > 15 || variability.diastolic > 10) score += 1;

  let label: HistoricalRiskInsight['label'] = 'stable';
  if (score >= 5) label = 'critical';
  else if (score >= 3) label = 'elevating';

  const language = options?.language === 'sw' ? 'sw' : 'en';
  const summaries = {
    stable: {
      en: `Recent averages ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg look steady. Keep routines consistent.`,
      sw: `Wastani wa hivi karibuni ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg unaonekana tulivu. Endelea na utaratibu huo.`
    },
    elevating: {
      en: `Blood pressure is trending upward with averages around ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg. Consider reviewing medication and salt intake.`,
      sw: `Shinikizo la damu linaongezeka hadi takribani ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg. Fikiria kurekebisha dawa na ulaji wa chumvi.`
    },
    critical: {
      en: `Averages near ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg plus rising trends indicate high risk. Escalate to the care team immediately.`,
      sw: `Wastani wa takribani ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg na mwelekeo wa kuongezeka unaonyesha hatari kubwa. Wasiliana na daktari mara moja.`
    }
  };

  return {
    label,
    score,
    summary: summaries[label][language],
    averages: {
      systolic: avgSystolic,
      diastolic: avgDiastolic,
      heartRate: avgHeartRate
    },
    slopes
  };
};

export const deriveHistoricalDiabetesRiskFromVitals = (
  vitals: PatientVitals[],
  options?: { window?: number; language?: 'en' | 'sw' }
): HistoricalRiskInsight | null => {
  if (!vitals || vitals.length === 0) return null;
  const windowSize = options?.window ?? 6;
  const meaningfulVitals = vitals
    .filter(v => typeof v.glucose === 'number')
    .slice(0, windowSize);

  if (meaningfulVitals.length < 3) return null;

  const average = (key: 'glucose' | 'heartRate') =>
    meaningfulVitals.reduce((sum, vital) => sum + ((vital as any)[key] || 0), 0) / meaningfulVitals.length;

  const avgGlucose = average('glucose');
  const avgHeartRate = average('heartRate');

  const glucoseValues = meaningfulVitals.map(v => (v as any).glucose || 0);
  const hrValues = meaningfulVitals.map(v => (v as any).heartRate || 0);

  const slopes = {
    systolic: calculateSlope(glucoseValues),
    diastolic: calculateSlope(hrValues)
  };

  const variability = {
    systolic: Math.max(...glucoseValues) - Math.min(...glucoseValues),
    diastolic: Math.max(...hrValues) - Math.min(...hrValues)
  };

  let score = 0;
  if (avgGlucose >= 180) score += 4;
  else if (avgGlucose >= 140) score += 3;
  else if (avgGlucose >= 126) score += 2;
  else if (avgGlucose >= 100) score += 1;

  if (slopes.systolic > 5 || slopes.diastolic > 3) score += 1;
  if (variability.systolic > 40 || variability.diastolic > 15) score += 1;

  let label: HistoricalRiskInsight['label'] = 'stable';
  if (score >= 5) label = 'critical';
  else if (score >= 3) label = 'elevating';

  const language = options?.language === 'sw' ? 'sw' : 'en';
  const summaries = {
    stable: {
      en: `Recent glucose averages ${Math.round(avgGlucose)} mg/dL look steady. Keep monitoring.`,
      sw: `Wastani wa glukosi wa hivi karibuni ${Math.round(avgGlucose)} mg/dL unaonekana thabiti. Endeleza kufuatilia.`
    },
    elevating: {
      en: `Glucose is trending upward with averages around ${Math.round(avgGlucose)} mg/dL. Consider diet review.`,
      sw: `Glukosi linaongezeka wastani ${Math.round(avgGlucose)} mg/dL. Fikiria kupima lishe.`
    },
    critical: {
      en: `Averages near ${Math.round(avgGlucose)} mg/dL plus rising trends indicate high diabetes risk. Escalate immediately.`,
      sw: `Wastani karibu ${Math.round(avgGlucose)} mg/dL pamoja na mwelekeo unaoongezeka unaonyesha hatari ya kisukari. Piga simu daktari mara moja.`
    }
  };

  return {
    label,
    score,
    summary: summaries[label][language],
    averages: {
      systolic: avgGlucose,
      diastolic: avgHeartRate,
      heartRate: avgHeartRate
    },
    slopes
  };
};
