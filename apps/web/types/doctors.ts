export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  condition: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  };
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  lastUpdate: string;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'vitals' | 'medication' | 'appointment' | 'emergency';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  message: string;
  timestamp: string;
  patientId: string;
}

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

export interface VitalTrend {
  date: string;
  heartRate: number;
  bloodPressure: number;
  temperature: number;
  oxygenSaturation: number;
}