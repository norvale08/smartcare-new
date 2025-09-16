// patient types
export interface Vitals {
  heartRate?: number;
  bloodPressure?: string;
  glucose?: number;
  temperature?: number;
  oxygenSat?: number;
}

export type Condition = 'Hypertension' | 'Diabetes';

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: Condition;
  vitals?: Vitals;
  riskLevel: "low" | "medium" | "high" | "critical";
  location: string;
  lastUpdate: string;
}


// dashboard stats types
export interface DashboardStats {
  date: Date;
}


// alerts types
export interface Alert {
  id: number;
  type: 'vitals' | 'medication' | 'appointment' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  time: string;
  patientId: string;
  patient: string;
}


// care management types
export interface Prescription {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  notes: string;
}

export interface CareNote {
  id: string;
  patientId: string;
  note: string;
  timestamp: string;
  type: 'observation' | 'treatment' | 'consultation';
}


// vital trend types
export interface TimeValue {
  time: string;
  value: number;
}

export interface TimeBloodPressure {
  time: string;
  systolic: number;
  diastolic: number;
}

export interface VitalTrend {
  heartRate: TimeValue[];
  bloodPressure: TimeBloodPressure[];
  temperature: TimeValue[];
  glucose: TimeValue[];
}


// anomaly distribution types
export interface AnomalyData {
  // For Pie Chart
  risk?: "critical" | "high" | "medium" | "low";
  riskValue?: number;

  // For Bar Chart
  vital?: string; // e.g. "HeartRate", "BloodPressure"
  vitalValue?: number;
  normal?: number;
  abnormal?: number;
}
