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

// DASHBOARD UTILITIES

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
}

// API SERVICE
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