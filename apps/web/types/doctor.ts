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
  coordinates?: {
    lat: number;
    lng: number;
  };
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
// For Pie Chart
export interface AnomalyPieData {
  risk: "critical" | "high" | "low";
  riskValue: number; // count or percentage depending on backend
}
// For Bar Chart
export interface AnomalyBarData {
  vital: string;        // e.g. "HeartRate", "BloodPressure"
  normal: number;       // percentage (%)
  abnormal: number;     // percentage (%)
  total: number;        // total count
  normalCount: number;  // raw count
  abnormalCount: number;// raw count
}