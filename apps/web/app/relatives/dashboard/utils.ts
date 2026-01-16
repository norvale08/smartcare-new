// relative/dashboard/utils.ts
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

  // Alert generation
  static generateHealthAlerts(vitalsData: VitalRecord[]): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const recentVitals = vitalsData.slice(0, 5);

    recentVitals.forEach(vital => {
      // Blood pressure alerts
      if (vital.systolic && vital.diastolic) {
        if (vital.systolic >= 180 || vital.diastolic >= 120) {
          alerts.push({
            id: `bp-critical-${vital.id}`,
            severity: 'critical',
            message: `Critical blood pressure: ${vital.systolic}/${vital.diastolic} mmHg`,
            timestamp: vital.timestamp,
            vital: 'Blood Pressure',
            value: vital.systolic
          });
        } else if (vital.systolic > 140 || vital.diastolic > 90) {
          alerts.push({
            id: `bp-warning-${vital.id}`,
            severity: 'warning',
            message: `High blood pressure: ${vital.systolic}/${vital.diastolic} mmHg`,
            timestamp: vital.timestamp,
            vital: 'Blood Pressure',
            value: vital.systolic
          });
        } else if (vital.systolic < 90 || vital.diastolic < 60) {
          alerts.push({
            id: `bp-low-${vital.id}`,
            severity: 'warning',
            message: `Low blood pressure: ${vital.systolic}/${vital.diastolic} mmHg`,
            timestamp: vital.timestamp,
            vital: 'Blood Pressure',
            value: vital.systolic
          });
        }
      }

      // Glucose alerts
      if (vital.glucose) {
        if (vital.glucose >= 250) {
          alerts.push({
            id: `glucose-critical-${vital.id}`,
            severity: 'critical',
            message: `Critical glucose level: ${vital.glucose} mg/dL`,
            timestamp: vital.timestamp,
            vital: 'Glucose',
            value: vital.glucose
          });
        } else if (vital.glucose > 180) {
          alerts.push({
            id: `glucose-warning-${vital.id}`,
            severity: 'warning',
            message: `High glucose level: ${vital.glucose} mg/dL`,
            timestamp: vital.timestamp,
            vital: 'Glucose',
            value: vital.glucose
          });
        } else if (vital.glucose < 70) {
          alerts.push({
            id: `glucose-low-${vital.id}`,
            severity: 'warning',
            message: `Low glucose level: ${vital.glucose} mg/dL`,
            timestamp: vital.timestamp,
            vital: 'Glucose',
            value: vital.glucose
          });
        }
      }

      // Heart rate alerts
      if (vital.heartRate && (vital.heartRate > 120 || vital.heartRate < 50)) {
        alerts.push({
          id: `hr-warning-${vital.id}`,
          severity: 'warning',
          message: `Abnormal heart rate: ${vital.heartRate} BPM`,
          timestamp: vital.timestamp,
          vital: 'Heart Rate',
          value: vital.heartRate
        });
      }
    });

    return alerts.slice(0, 5);
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