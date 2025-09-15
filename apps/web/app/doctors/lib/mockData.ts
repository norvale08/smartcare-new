// Mock data

import { Patient, Alert, AnomalyData } from "@/../../apps/web/types/doctor";

export const dashboardStats = {
  criticalAlerts: 12,
  assignedPatients: 47,
  date: new Date(),
};

export const patients: Patient[] = [
  {
    id: 1,
    name: "Antorny John Kaiser",
    age: 65, gender: "Male",
    condition: "Hypertension",
    riskLevel: "high",
    location: "Nairobi",
    lastUpdate: '2 mins ago',
    vitals: {
      heartRate: 72,
      bloodPressure: '125/75',
      glucose: 105,
      temperature: 98.2,
      oxygenSat: 97
    }
  },
  {
    id: 2,
    name: "Jane Smith",
    age: 72,
    gender: "Female",
    condition: "Diabetes",
    riskLevel: "medium",
    location: "Kisumu",
    lastUpdate: '15 mins ago',
    vitals: {
      heartRate: 92,
      glucose: 95,
      temperature: 98.4,
      oxygenSat: 89
    }
  },
  {
    id: 3,
    name: "Samuel Karanja",
    age: 58,
    gender: "Male",
    condition: "Hypertension",
    riskLevel: "low",
    location: "Mombasa",
    lastUpdate: '1 hour ago',
    vitals: {
      heartRate: 78,
      bloodPressure: '135/85',
      glucose: 180,
      temperature: 99.1,
      oxygenSat: 98
    }
  },
  {
    id: 4,
    name: "Alice Obwaya",
    age: 70,
    gender: "Female",
    condition: "Diabetes",
    riskLevel: "critical",
    location: "Nakuru",
    lastUpdate: '2 hours ago',
    vitals: {
      heartRate: 85,
      bloodPressure: '160/90',
      glucose: 120,
      temperature: 98.6,
      oxygenSat: 96
    }
  },
];

export const alerts: Alert[] = [
  {
            id: 1,
            type: 'emergency',
            severity: 'critical',
            message: 'High heart rate detected',
            time: '2 mins ago',
            patientId: '1',
            patient: "Antorny John Kaiser",
        },
        {
            id: 3,
            type: 'appointment',
            severity: 'low',
            message: 'Schedule consultation appointment',
            time: '30 mins ago',
            patientId: '3',
            patient: "Alice Obwaya",
        },
        {
            id: 2,
            type: 'vitals',
            severity: 'high',
            message: 'Low oxygen saturation',
            time: '1 hour ago',
            patientId: '2',
            patient: "Jane Smith",
        },
];

export const vitalTrends = {
  heartRate: [
    { time: '00:00', value: 72 },
    { time: '04:00', value: 75 },
    { time: '08:00', value: 80 },
    { time: '12:00', value: 85 },
    { time: '16:00', value: 78 },
    { time: '20:00', value: 74 }
  ],
  bloodPressure: [
    { time: '00:00', systolic: 120, diastolic: 80 },
    { time: '04:00', systolic: 125, diastolic: 82 },
    { time: '08:00', systolic: 130, diastolic: 85 },
    { time: '12:00', systolic: 135, diastolic: 88 },
    { time: '16:00', systolic: 132, diastolic: 86 },
    { time: '20:00', systolic: 128, diastolic: 83 }
  ],
  glucose: [
    { time: '00:00', value: 95 },
    { time: '04:00', value: 110 },
    { time: '08:00', value: 140 },
    { time: '12:00', value: 160 },
    { time: '16:00', value: 130 },
    { time: '20:00', value: 105 }
  ],
  temperature: [
    { time: '00:00', value: 36.5 },
    { time: '04:00', value: 36.7 },
    { time: '08:00', value: 36.6 },
    { time: '12:00', value: 36.5 },
    { time: '16:00', value: 36.6 },
    { time: '20:00', value: 36.7 }
  ]
}


export const anomalyDistribution: AnomalyData[] = [
  // Pie chart data (risk distribution)
  { risk: "critical", riskValue: 12 },
  { risk: "high", riskValue: 25 },
  { risk: "medium", riskValue: 35 },
  { risk: "low", riskValue: 28 },

  // Bar chart data (vital sign anomaly counts)
  {
    vital: "HeartRate",
    vitalValue: 35,
    normal: 75,
    abnormal: 25,
  },
  {
    vital: "BloodPressure",
    vitalValue: 30,
    normal: 60,
    abnormal: 40,
  },
  {
    vital: "Glucose",
    vitalValue: 20,
    normal: 90,
    abnormal: 10,
  },
  {
    vital: "Temperature",
    vitalValue: 15,
    normal: 85,
    abnormal: 15,
  },
  {
    vital: "OxygenSat",
    vitalValue: 35,
    normal: 75,
    abnormal: 25,
  },
];
