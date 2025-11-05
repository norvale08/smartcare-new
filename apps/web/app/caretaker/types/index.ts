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
  type: "info" | "warning" | "critical";
  message: string;
  timestamp: string;
  patientId?: string;
  read: boolean;
}