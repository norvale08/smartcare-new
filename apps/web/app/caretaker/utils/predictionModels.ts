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

  async loadModel() {
    try {
      // Load pre-trained model or create simple rule-based model
      this.model = await tf.loadLayersModel('/models/hypertension/model.json');
    } catch (error) {
      console.log('Using rule-based hypertension predictor');
      this.model = null;
    }
  }

  predict(vitals: PatientVitals, historicalVitals?: PatientVitals[]): PredictionResult {
    if (this.model) {
      return this.predictWithML(vitals);
    } else {
      return this.predictWithRules(vitals, historicalVitals);
    }
  }

  private analyzeTrends(historicalVitals?: PatientVitals[]): {
    systolicTrend: 'increasing' | 'decreasing' | 'stable';
    diastolicTrend: 'increasing' | 'decreasing' | 'stable';
    heartRateTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (!historicalVitals || historicalVitals.length < 2) {
      return {
        systolicTrend: 'stable',
        diastolicTrend: 'stable',
        heartRateTrend: 'stable'
      };
    }

    // Sort by timestamp (assuming we have timestamps in historicalVitals)
    const sortedVitals = [...historicalVitals].sort((a, b) => 
      a.age - b.age // Using age as a proxy for time
    );

    const trends = {
      systolicTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      diastolicTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      heartRateTrend: 'stable' as 'increasing' | 'decreasing' | 'stable'
    };

    // Analyze systolic trend
    const systolicValues = sortedVitals.map(v => v.systolic);
    const systolicSlope = this.calculateLinearSlope(systolicValues);
    if (systolicSlope > 2) trends.systolicTrend = 'increasing';
    else if (systolicSlope < -2) trends.systolicTrend = 'decreasing';

    // Analyze diastolic trend
    const diastolicValues = sortedVitals.map(v => v.diastolic);
    const diastolicSlope = this.calculateLinearSlope(diastolicValues);
    if (diastolicSlope > 2) trends.diastolicTrend = 'increasing';
    else if (diastolicSlope < -2) trends.diastolicTrend = 'decreasing';

    // Analyze heart rate trend
    const hrValues = sortedVitals.map(v => v.heartRate);
    const hrSlope = this.calculateLinearSlope(hrValues);
    if (hrSlope > 3) trends.heartRateTrend = 'increasing';
    else if (hrSlope < -3) trends.heartRateTrend = 'decreasing';

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
    
    // Simple risk calculation based on medical guidelines
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
    
    // Analyze trends
    const trends = this.analyzeTrends(historicalVitals);
    
    // Adjust risk based on trends
    if (trends.systolicTrend === 'increasing' || trends.diastolicTrend === 'increasing') {
      riskScore += 1;
    }

    // Determine risk level
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

  private predictWithML(vitals: PatientVitals): PredictionResult {
    // ML-based prediction would go here
    // This is a placeholder for actual TensorFlow.js model
    return this.predictWithRules(vitals);
  }
}

class DiabetesPredictor {
  predict(vitals: PatientVitals & { glucose: number }, historicalVitals?: (PatientVitals & { glucose: number })[]): PredictionResult {
    const { glucose, age, bmi = 25 } = vitals;
    
    let riskScore = 0;
    
    // Glucose levels
    if (glucose >= 200) riskScore += 3;
    else if (glucose >= 126) riskScore += 2;
    else if (glucose >= 100) riskScore += 1;
    
    // Age factors
    if (age >= 45) riskScore += 1;
    
    // BMI factors
    if (bmi >= 30) riskScore += 2;
    else if (bmi >= 25) riskScore += 1;

    // Analyze glucose trend if historical data is available
    let glucoseTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (historicalVitals && historicalVitals.length >= 2) {
      const glucoseValues = historicalVitals.map(v => v.glucose).sort((a, b) => a - b);
      const glucoseSlope = this.calculateLinearSlope(glucoseValues);
      if (glucoseSlope > 2) glucoseTrend = 'increasing';
      else if (glucoseSlope < -2) glucoseTrend = 'decreasing';
    }

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
        probability: 0.1 + riskScore * 0.2,
        recommendation: 'Low diabetes risk. Maintain healthy diet and exercise.',
        trends: {
          systolicTrend: 'stable',
          diastolicTrend: 'stable',
          glucoseTrend,
          heartRateTrend: 'stable'
        }
      };
    }
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
}

export const hypertensionPredictor = new HypertensionPredictor();
export const diabetesPredictor = new DiabetesPredictor();
