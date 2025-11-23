// utils/predictionModels.ts
import * as tf from '@tensorflow/tfjs';

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
    // Create a simple neural network
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [5], units: 10, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
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
      epochs: 100,
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
    for (let i = 0; i < 1000; i++) {
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
      const systolicSlope = this.calculateLinearSlope(systolicValues);
      if (systolicSlope > 2) trends.systolicTrend = 'increasing';
      else if (systolicSlope < -2) trends.systolicTrend = 'decreasing';
    }

    if (validDiastolicVitals.length >= 2) {
      const diastolicValues = validDiastolicVitals.map(v => v.diastolic!);
      const diastolicSlope = this.calculateLinearSlope(diastolicValues);
      if (diastolicSlope > 2) trends.diastolicTrend = 'increasing';
      else if (diastolicSlope < -2) trends.diastolicTrend = 'decreasing';
    }

    if (validHRVitals.length >= 2) {
      const hrValues = validHRVitals.map(v => v.heartRate!);
      const hrSlope = this.calculateLinearSlope(hrValues);
      if (hrSlope > 3) trends.heartRateTrend = 'increasing';
      else if (hrSlope < -3) trends.heartRateTrend = 'decreasing';
    }

    return trends;
  }

  private calculateLinearSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

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
        tf.layers.dense({ inputShape: [4], units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 6, activation: 'relu' }),
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
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });

    return model;
  }

  private generateTrainingData() {
    const features = [];
    const labels = [];
    
    for (let i = 0; i < 800; i++) {
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
    const slope = this.calculateLinearSlope(glucoseValues);
    
    if (slope > 2) return 'increasing';
    if (slope < -2) return 'decreasing';
    return 'stable';
  }

  private calculateLinearSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

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