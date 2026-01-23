// relative/dashboard/types.ts
export interface PatientInfo {
  id: string;      // Medical Record ID
  userId?: string; // Account ID (REQUIRED for messaging)
  name: string;
  email: string;
  phoneNumber: string;
  condition: string;
  dob: string;
  gender: string;
  diabetes: boolean;
  hypertension: boolean;
  cardiovascular?: boolean;
  allergies: string;
  surgeries: string;
  picture: string;
  weight?: number;
  height?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  accessLevel: string;
  relationship?: string;
  monitoredPatient?: string;
  monitoredPatientProfile?: string;
}

export interface VitalRecord {
  id: string;
  type: 'hypertension' | 'diabetes';
  source: string;
  timestamp: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
  context?: string;
  exerciseRecent?: boolean;
  exerciseIntensity?: string;
}

export interface HealthSummary {
  condition: string;
  hasData: boolean;
  timestamp?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
}

export interface HealthStats {
  condition: string;
  count: number;
  avgSystolic?: number;
  avgDiastolic?: number;
  avgHeartRate?: number;
  avgGlucose?: number;
  period: string;
}

export interface ChartDataPoint {
  date: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  nextDose?: string;
  type: string;
  lastTaken?: string;
  notes?: string;
}

export interface HealthAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  vital: string;
  value: number;
  category?: string;
  recommendation?: string;
}

export type ChartMetric = 'bloodPressure' | 'heartRate' | 'glucose';
export type TabType = 'overview' | 'vitals' | 'medications' | 'messages' | 'profile';
export type HealthStatus = 'No Data' | 'High' | 'Low' | 'Normal' | 'Unknown';
export type ChartPeriod = 7 | 14 | 30;