// app/caretaker/types/index.ts
export interface Patient {
  id: string;
  userId?: string;
  fullName: string;
  age: number;
  gender: string;
  condition: "hypertension" | "diabetes" | "both";
  lastVisit: string;
  status: "stable" | "warning" | "critical";
  phoneNumber?: string;
  email?: string;
}

export interface VitalSigns {
  id?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
  timestamp: string;
  patientId: string;
}


export interface Notification {
  id: string;
  type: 'vital_alert' | 'message' | 'call' | 'system' | 'appointment' | 'hypertension_alert';
  title: string;
  message: string;
  patientId?: string;
  patientName?: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  bpCategory?: 'Stage 1' | 'Stage 2' | 'Hypertensive Crisis';
  systolic?: number;
  diastolic?: number;
}