//doctor.ts

// patient types
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition?: string;
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    glucose?: number;
    temperature?: number;
    oxygenSat?: number;
    context?: string;
    bmi?: number;
  };
  riskLevel: "low" | "high" | "critical";
  location?: string;
  lastUpdate?: string;
}

export type Condition = 'Hypertension' | 'Diabetes';

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
  glucose: TimeValue[];
  bmi: TimeValue[];   // Added BMI trend
}


// anomaly distribution types
export interface AnomalyData {
  // For Pie Chart
  risk?: "critical" | "high" | "low";
  riskValue?: number;

  // For Bar Chart
  vital?: string; // e.g. "HeartRate", "BloodPressure"
  vitalValue?: number;
  normal?: number;
  abnormal?: number;

  [key: string]: string | number | undefined;
}
