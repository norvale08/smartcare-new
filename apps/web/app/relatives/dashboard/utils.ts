// relative/dashboard/utils.ts - FIXED VERSION
import { 
  PatientInfo, 
  VitalRecord, 
  HealthAlert, 
  ChartDataPoint, 
  Medication,
  HealthStatus,
  ChartPeriod 
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// CRITICAL CONDITION TYPES AND DETECTION
// ============================================================================

export interface CriticalCondition {
  isCritical: boolean;
  severity: 'critical' | 'severe' | 'moderate' | 'normal';
  timestamp: string;
  reasons: string[];
  affectedSystems: string[];
  hasHypertension?: boolean;
  hasDiabetes?: boolean;
}

export class CriticalConditionDetector {
  /**
   * Analyzes patient's recent vitals to determine if they're in critical condition
   * This looks at overall health status, not individual vitals
   */
  static analyzeCriticalCondition(
    vitals: VitalRecord[],
    patientInfo: PatientInfo
  ): CriticalCondition {
    if (!vitals || vitals.length === 0) {
      return {
        isCritical: false,
        severity: 'normal',
        timestamp: new Date().toISOString(),
        reasons: [],
        affectedSystems: []
      };
    }

    // Get most recent vitals (last 24 hours)
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentVitals = vitals.filter(v => new Date(v.timestamp) >= last24Hours);
    
    if (recentVitals.length === 0) {
      return {
        isCritical: false,
        severity: 'normal',
        timestamp: new Date().toISOString(),
        reasons: [],
        affectedSystems: []
      };
    }

    const latestVital = recentVitals[0];
    
    if (!latestVital) {
      return {
        isCritical: false,
        severity: 'normal',
        timestamp: new Date().toISOString(),
        reasons: [],
        affectedSystems: []
      };
    }

    const reasons: string[] = [];
    const affectedSystems: string[] = [];
    let criticalCount = 0;
    let severeCount = 0;

    // Check Blood Pressure - Using hypertension alert logic
    if (latestVital.systolic !== undefined && latestVital.diastolic !== undefined && patientInfo.hypertension) {
      const systolic = latestVital.systolic;
      const diastolic = latestVital.diastolic;
      
      // Hypertensive Crisis - Critical
      if (systolic >= 180 || diastolic >= 120) {
        criticalCount++;
        reasons.push(
          `Hypertensive Crisis: BP ${systolic}/${diastolic} mmHg - Seek immediate medical attention`
        );
        affectedSystems.push('Cardiovascular');
      }
      // Stage 2 Hypertension - Severe
      else if ((systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) {
        severeCount++;
        reasons.push(
          `Stage 2 Hypertension: BP ${systolic}/${diastolic} mmHg - Consult your doctor soon for proper management`
        );
        affectedSystems.push('Cardiovascular');
      }
      // Stage 1 Hypertension - Moderate Severe
      else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
        severeCount++;
        reasons.push(
          `Stage 1 Hypertension: BP ${systolic}/${diastolic} mmHg - Monitor regularly and consult your doctor if this persists`
        );
        affectedSystems.push('Cardiovascular');
      }
      // Low Blood Pressure
      else if (systolic <= 90 || diastolic <= 60) {
        severeCount++;
        reasons.push(
          `Low Blood Pressure: BP ${systolic}/${diastolic} mmHg - Contact healthcare provider if experiencing dizziness or feeling unwell`
        );
        affectedSystems.push('Cardiovascular');
      }
    }

    // Check Glucose - Using diabetes alert logic
    if (latestVital.glucose !== undefined && patientInfo.diabetes) {
      const glucose = latestVital.glucose;
      const context = latestVital.context || "Random";
      
      // Severe Hypoglycemia - Critical (all contexts)
      if (glucose < 70) {
        criticalCount++;
        reasons.push(
          `Low Blood Sugar: Glucose ${glucose} mg/dL (${context}) - Risk of hypoglycemia, immediate intervention needed`
        );
        affectedSystems.push('Endocrine');
      }
      // Context-based high glucose alerts
      else if (context === "Fasting") {
        if (glucose > 125) {
          severeCount++;
          reasons.push(
            `High Fasting Glucose: ${glucose} mg/dL - Indicates poor glycemic control`
          );
          affectedSystems.push('Endocrine');
        }
      }
      else if (context === "Post-meal") {
        if (glucose > 180) {
          severeCount++;
          reasons.push(
            `High Post-meal Glucose: ${glucose} mg/dL - Exceeds target range`
          );
          affectedSystems.push('Endocrine');
        }
      }
      else { // Random
        if (glucose > 200) {
          criticalCount++;
          reasons.push(
            `High Random Glucose: ${glucose} mg/dL - Significantly elevated, seek medical attention`
          );
          affectedSystems.push('Endocrine');
        }
      }
    }

    // Check Heart Rate - Using alert logic (60-100 BPM normal range)
    if (latestVital.heartRate !== undefined) {
      const heartRate = latestVital.heartRate;
      
      // Severe Tachycardia - Critical
      if (heartRate > 100) {
        criticalCount++;
        reasons.push(
          `Tachycardia (High Heart Rate): ${heartRate} BPM - Above normal range`
        );
        affectedSystems.push('Cardiovascular');
      }
      // Bradycardia - Critical
      else if (heartRate < 60) {
        criticalCount++;
        reasons.push(
          `Bradycardia (Low Heart Rate): ${heartRate} BPM - Below normal range`
        );
        affectedSystems.push('Cardiovascular');
      }
    }

    // Check for multiple simultaneous issues (compound risk)
    if (criticalCount === 0 && severeCount >= 2) {
      reasons.push(
        `Multiple health parameters are outside safe ranges simultaneously, increasing overall risk`
      );
    }

    // Check trend - deteriorating condition
    if (recentVitals.length >= 3) {
      const trendAnalysis = this.analyzeTrends(recentVitals, patientInfo);
      if (trendAnalysis.isDeteriorating) {
        severeCount++;
        reasons.push(...trendAnalysis.trendReasons);
      }
    }

    // Determine severity level
    let severity: 'critical' | 'severe' | 'moderate' | 'normal';
    let isCritical = false;

    if (criticalCount >= 2) {
      severity = 'critical';
      isCritical = true;
      reasons.unshift('MULTIPLE CRITICAL CONDITIONS DETECTED - Immediate medical attention required');
    } else if (criticalCount >= 1) {
      severity = 'critical';
      isCritical = true;
    } else if (severeCount >= 2) {
      severity = 'severe';
      isCritical = true;
      reasons.unshift('Multiple severe health indicators detected - Medical consultation recommended');
    } else if (severeCount >= 1) {
      severity = 'severe';
      isCritical = true;
    } else if (reasons.length > 0) {
      severity = 'moderate';
    } else {
      severity = 'normal';
    }

    return {
      isCritical,
      severity,
      timestamp: latestVital.timestamp,
      reasons: [...new Set(reasons)], // Remove duplicates
      affectedSystems: [...new Set(affectedSystems)],
      hasHypertension: patientInfo.hypertension,
      hasDiabetes: patientInfo.diabetes
    };
  }

  /**
   * Analyzes trends in vital signs to detect deteriorating conditions
   */
  private static analyzeTrends(
    vitals: VitalRecord[],
    patientInfo: PatientInfo
  ): { isDeteriorating: boolean; trendReasons: string[] } {
    const trendReasons: string[] = [];
    let isDeteriorating = false;

    // Sort by timestamp (most recent first)
    const sorted = [...vitals].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Check BP trend (if hypertensive)
    if (patientInfo.hypertension) {
      const bpReadings = sorted
        .filter(v => v.systolic !== undefined)
        .slice(0, 3)
        .map(v => v.systolic as number);
      
      if (bpReadings.length === 3) {
        const firstReading = bpReadings[0];
        const secondReading = bpReadings[1];
        const thirdReading = bpReadings[2];
        
        // Check if consistently increasing
        if (firstReading !== undefined && secondReading !== undefined && thirdReading !== undefined &&
            firstReading > secondReading && secondReading > thirdReading) {
          const increase = firstReading - thirdReading;
          if (increase >= 20) {
            isDeteriorating = true;
            trendReasons.push(
              `Blood pressure trending upward: Increased by ${increase} mmHg over recent readings`
            );
          }
        }
        // Check if approaching critical levels
        if (firstReading !== undefined && secondReading !== undefined && 
            firstReading >= 160 && secondReading >= 150) {
          isDeteriorating = true;
          trendReasons.push(
            `Blood pressure approaching critical levels: Consistent readings in Stage 2 range`
          );
        }
      }
    }

    // Check glucose trend (if diabetic)
    if (patientInfo.diabetes) {
      const glucoseReadings = sorted
        .filter(v => v.glucose !== undefined)
        .slice(0, 3)
        .map(v => v.glucose as number);
      
      if (glucoseReadings.length === 3) {
        const firstGlucose = glucoseReadings[0];
        const secondGlucose = glucoseReadings[1];
        const thirdGlucose = glucoseReadings[2];
        
        // Check if consistently increasing to dangerous levels
        if (firstGlucose !== undefined && secondGlucose !== undefined && thirdGlucose !== undefined &&
            firstGlucose > secondGlucose && secondGlucose > thirdGlucose) {
          const increase = firstGlucose - thirdGlucose;
          if (increase >= 50 && firstGlucose >= 180) {
            isDeteriorating = true;
            trendReasons.push(
              `Glucose levels rapidly rising: Increased by ${increase} mg/dL to concerning levels`
            );
          }
        }
        // Check if consistently low
        if (firstGlucose !== undefined && secondGlucose !== undefined && 
            thirdGlucose !== undefined &&
            firstGlucose < 80 && secondGlucose < 80 && thirdGlucose < 80) {
          isDeteriorating = true;
          trendReasons.push(
            `Glucose levels consistently low: Pattern of readings below 80 mg/dL, risk of hypoglycemia`
          );
        }
      }
    }

    return { isDeteriorating, trendReasons };
  }

  /**
   * Determines if a critical alert should be shown to relatives
   * (filters out already-dismissed or non-critical conditions)
   */
  static shouldShowCriticalAlert(
    condition: CriticalCondition,
    lastDismissedTimestamp?: string
  ): boolean {
    if (!condition.isCritical) {
      return false;
    }

    // Only show critical or severe conditions
    if (condition.severity !== 'critical' && condition.severity !== 'severe') {
      return false;
    }

    // If user dismissed an alert, don't show again for same timestamp
    if (lastDismissedTimestamp && condition.timestamp === lastDismissedTimestamp) {
      return false;
    }

    return true;
  }
}

// ============================================================================
// DASHBOARD UTILITIES
// ============================================================================

export class DashboardUtils {
  // Formatting utilities
  static formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  }

  static formatTimeUntil(dateString: string): string {
    const now = new Date();
    const future = new Date(dateString);
    const diff = future.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    }
    return `in ${minutes}m`;
  }

  static calculateAge(dob: string): number | string {
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 'Unknown';
    }
  }

  // Health status utilities
  static getHealthStatus(
    systolic?: number, 
    diastolic?: number, 
    glucose?: number
  ): HealthStatus {
    if (systolic === undefined && diastolic === undefined && glucose === undefined) {
      return 'No Data';
    }

    if (systolic !== undefined && diastolic !== undefined) {
      if (systolic > 140 || diastolic > 90) return 'High';
      if (systolic < 90 || diastolic < 60) return 'Low';
      return 'Normal';
    }

    if (glucose !== undefined) {
      if (glucose > 180) return 'High';
      if (glucose < 70) return 'Low';
      return 'Normal';
    }

    return 'Unknown';
  }

  static getHealthStatusColor(status: HealthStatus): string {
    const colors = {
      'High': 'text-red-600',
      'Low': 'text-yellow-600',
      'Normal': 'text-green-600',
      'No Data': 'text-gray-600',
      'Unknown': 'text-gray-600'
    };
    return colors[status];
  }

  static getHealthStatusBgColor(status: HealthStatus): string {
    const bgColors = {
      'High': 'bg-red-100',
      'Low': 'bg-yellow-100',
      'Normal': 'bg-green-100',
      'No Data': 'bg-gray-100',
      'Unknown': 'bg-gray-100'
    };
    return bgColors[status];
  }

  // BMI utilities
  static calculateBMI(weight?: number, height?: number): number | null {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  static getBMICategory(bmi: number): { category: string; color: string } {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  }

  // Chart data preparation
  static prepareChartData(
    vitals: VitalRecord[], 
    chartPeriod: ChartPeriod
  ): ChartDataPoint[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - chartPeriod);

    const filteredVitals = vitals.filter(vital =>
      new Date(vital.timestamp) >= cutoffDate
    );

    const dataMap = new Map<string, ChartDataPoint>();

    filteredVitals.forEach(vital => {
      const date = new Date(vital.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      if (!dataMap.has(date)) {
        dataMap.set(date, { date });
      }

      const point = dataMap.get(date)!;
      if (vital.systolic !== undefined) point.systolic = vital.systolic;
      if (vital.diastolic !== undefined) point.diastolic = vital.diastolic;
      if (vital.heartRate !== undefined) point.heartRate = vital.heartRate;
      if (vital.glucose !== undefined) point.glucose = vital.glucose;
    });

    return Array.from(dataMap.values()).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }

  // Alert generation - Critical condition alerts for hypertension and diabetes
  static generateHealthAlerts(vitalsData: VitalRecord[], patientInfo: PatientInfo | null): HealthAlert[] {
    if (!vitalsData || vitalsData.length === 0 || !patientInfo) {
      return [];
    }

    const alerts: HealthAlert[] = [];
    
    // Get today's vitals only
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayVitals = vitalsData
      .filter(v => {
        const vitalDate = new Date(v.timestamp);
        return vitalDate >= startOfDay && vitalDate < endOfDay;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (todayVitals.length === 0) {
      return [];
    }

    const latest = todayVitals[0];
    
    // Safety check - ensure latest is defined
    if (!latest) {
      return [];
    }

    // HYPERTENSION CRITICAL ALERTS (following hypertension/alert.tsx logic)
    if (patientInfo.hypertension && latest.systolic !== undefined && latest.diastolic !== undefined) {
      const systolic = latest.systolic;
      const diastolic = latest.diastolic;

      // Hypertensive Crisis - Most Critical
      if (systolic >= 180 || diastolic >= 120) {
        alerts.push({
          id: `hypertension-crisis-${latest.id}`,
          severity: 'critical',
          message: `Hypertensive Crisis! BP: ${systolic}/${diastolic} mmHg - Seek immediate medical attention.`,
          timestamp: latest.timestamp,
          vital: 'Hypertension',
          value: systolic,
          category: 'Hypertensive Crisis',
          recommendation: 'Seek immediate medical attention.'
        });
      }
      // Stage 2 Hypertension - Critical
      else if ((systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) {
        alerts.push({
          id: `hypertension-stage2-${latest.id}`,
          severity: 'critical',
          message: `Stage 2 Hypertension: BP ${systolic}/${diastolic} mmHg - Consult your doctor soon for proper management.`,
          timestamp: latest.timestamp,
          vital: 'Hypertension',
          value: systolic,
          category: 'Stage 2 Hypertension',
          recommendation: 'Consult your doctor soon for proper management.'
        });
      }
      // Low Blood Pressure - Warning
      else if (systolic < 90 || diastolic < 60) {
        alerts.push({
          id: `hypertension-low-${latest.id}`,
          severity: 'warning',
          message: `Low Blood Pressure: BP ${systolic}/${diastolic} mmHg - Contact healthcare provider if experiencing dizziness or feeling unwell.`,
          timestamp: latest.timestamp,
          vital: 'Hypertension',
          value: systolic,
          category: 'Low Blood Pressure',
          recommendation: 'Contact healthcare provider if experiencing dizziness or feeling unwell.'
        });
      }
    }

    // DIABETES CRITICAL ALERTS (following diabetes/DiabetesAlerts.tsx logic)
    if (patientInfo.diabetes && latest.glucose !== undefined) {
      const glucose = latest.glucose;
      const context = latest.context || "Random";

      // Severe Hypoglycemia - Most Critical (all contexts)
      if (glucose < 70) {
        alerts.push({
          id: `diabetes-hypoglycemia-${latest.id}`,
          severity: 'critical',
          message: `Low Blood Sugar: Glucose ${glucose} mg/dL (${context}) - Risk of hypoglycemia, immediate intervention needed.`,
          timestamp: latest.timestamp,
          vital: 'Diabetes',
          value: glucose,
          category: 'Low Blood Sugar',
          recommendation: 'Risk of hypoglycemia, immediate intervention needed.'
        });
      }
      // Context-based high glucose alerts
      else if (context === "Fasting" && glucose > 125) {
        alerts.push({
          id: `diabetes-fasting-high-${latest.id}`,
          severity: 'critical',
          message: `High Fasting Glucose: ${glucose} mg/dL - Indicates poor glycemic control.`,
          timestamp: latest.timestamp,
          vital: 'Diabetes',
          value: glucose,
          category: 'High Fasting Glucose',
          recommendation: 'Indicates poor glycemic control.'
        });
      }
      else if (context === "Post-meal" && glucose > 180) {
        alerts.push({
          id: `diabetes-postmeal-high-${latest.id}`,
          severity: 'critical',
          message: `High Post-meal Glucose: ${glucose} mg/dL - Exceeds target range.`,
          timestamp: latest.timestamp,
          vital: 'Diabetes',
          value: glucose,
          category: 'High Post-meal Glucose',
          recommendation: 'Exceeds target range.'
        });
      }
      else if (context === "Random" && glucose > 200) {
        alerts.push({
          id: `diabetes-random-high-${latest.id}`,
          severity: 'critical',
          message: `High Random Glucose: ${glucose} mg/dL - Significantly elevated, seek medical attention.`,
          timestamp: latest.timestamp,
          vital: 'Diabetes',
          value: glucose,
          category: 'High Random Glucose',
          recommendation: 'Significantly elevated, seek medical attention.'
        });
      }
    }

    return alerts;
  }

  // Medication utilities
  static determineType(name: string, purpose?: string): string {
    const nameLower = name.toLowerCase();
    const purposeLower = purpose?.toLowerCase() || '';

    if (nameLower.includes('metformin') || nameLower.includes('insulin') ||
      nameLower.includes('glipizide') || nameLower.includes('glyburide') ||
      purposeLower.includes('diabetes') || purposeLower.includes('glucose')) {
      return 'diabetes';
    }

    if (nameLower.includes('lisinopril') || nameLower.includes('amlodipine') ||
      nameLower.includes('losartan') || nameLower.includes('atenolol') ||
      nameLower.includes('hydrochlorothiazide') || purposeLower.includes('hypertension') ||
      purposeLower.includes('blood pressure')) {
      return 'hypertension';
    }

    if (nameLower.includes('aspirin') || nameLower.includes('clopidogrel') ||
      nameLower.includes('warfarin') || nameLower.includes('statin') ||
      purposeLower.includes('cardiovascular') || purposeLower.includes('heart')) {
      return 'cardiovascular';
    }

    return 'general';
  }

  static calculateNextDose(frequency: string): string {
    const now = new Date();
    const freqLower = frequency.toLowerCase();

    const hourMap: Record<string, number> = {
      'once': 24,
      'daily': 24,
      'twice': 12,
      'three': 8,
      'thrice': 8,
      'four': 6
    };

    for (const [key, hours] of Object.entries(hourMap)) {
      if (freqLower.includes(key)) {
        return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
      }
    }

    return new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
  }
}

// ============================================================================
// API SERVICE
// ============================================================================

export class ApiService {
  static async fetchRelativeData(
    token: string,
    endpoints: string[]
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            results[endpoint] = data.data;
          }
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        results[endpoint] = null;
      }
    }
    
    return results;
  }
}