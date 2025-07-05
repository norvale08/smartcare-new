import { Patient, Alert, Prescription, CareNote, VitalTrend } from '../../../types/doctors';

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Auma',
    age: 67,
    gender: 'Female',
    condition: 'Hypertension, Diabetes',
    riskLevel: 'High',
    vitals: {
      heartRate: 88,
      bloodPressure: '145/95',
      temperature: 98.6,
      oxygenSaturation: 97
    },
    location: {
      lat: 40.7128,
      lng: -74.0060,
      address: 'Kisumu, Kenya'
    },
    lastUpdate: '2 minutes ago',
    alerts: [
      {
        id: 'a1',
        type: 'vitals',
        severity: 'High',
        message: 'Blood pressure elevated above normal range',
        timestamp: '5 minutes ago',
        patientId: '1'
      }
    ]
  },
  {
    id: '2',
    name: 'Sam Mogambi',
    age: 45,
    gender: 'Male',
    condition: 'Post-operative care',
    riskLevel: 'Medium',
    vitals: {
      heartRate: 72,
      bloodPressure: '120/80',
      temperature: 99.1,
      oxygenSaturation: 98
    },
    location: {
      lat: 40.7589,
      lng: -73.9851,
      address: 'Kisii, Kenya'
    },
    lastUpdate: '15 minutes ago',
    alerts: []
  },
  {
    id: '3',
    name: 'Emily Zawadi',
    age: 32,
    gender: 'Female',
    condition: 'Diabetes',
    riskLevel: 'Low',
    vitals: {
      heartRate: 78,
      bloodPressure: '115/75',
      temperature: 98.4,
      oxygenSaturation: 99
    },
    location: {
      lat: 40.7831,
      lng: -73.9712,
      address: 'Nairobi, Kenya'
    },
    lastUpdate: '8 minutes ago',
    alerts: []
  },
  {
    id: '4',
    name: 'George Maina',
    age: 78,
    gender: 'Male',
    condition: 'Heart failure',
    riskLevel: 'Critical',
    vitals: {
      heartRate: 105,
      bloodPressure: '160/100',
      temperature: 97.8,
      oxygenSaturation: 94
    },
    location: {
      lat: 40.7505,
      lng: -73.9934,
      address: 'Nyeri, Kenya'
    },
    lastUpdate: '1 minute ago',
    alerts: [
      {
        id: 'a2',
        type: 'emergency',
        severity: 'Critical',
        message: 'Oxygen saturation below 95% - immediate attention required',
        timestamp: '1 minute ago',
        patientId: '4'
      },
      {
        id: 'a3',
        type: 'vitals',
        severity: 'High',
        message: 'Heart rate consistently elevated',
        timestamp: '3 minutes ago',
        patientId: '4'
      }
    ]
  }
];

export const mockPrescriptions: Prescription[] = [
  {
    id: 'p1',
    patientId: '1',
    medication: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    notes: 'Take with food to reduce stomach upset'
  },
  {
    id: 'p2',
    patientId: '1',
    medication: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    notes: 'Monitor blood glucose levels regularly'
  }
];

export const mockCareNotes: CareNote[] = [
  {
    id: 'n1',
    patientId: '1',
    note: 'Patient reports feeling dizzy in the mornings. Adjusted medication timing.',
    timestamp: '2024-01-20T10:30:00Z',
    type: 'observation'
  },
  {
    id: 'n2',
    patientId: '2',
    note: 'Post-operative wound healing well. No signs of infection.',
    timestamp: '2024-01-20T14:15:00Z',
    type: 'treatment'
  }
];

export const mockVitalTrends: VitalTrend[] = [
  { date: '2024-01-15', heartRate: 75, bloodPressure: 130, temperature: 98.6, oxygenSaturation: 98 },
  { date: '2024-01-16', heartRate: 78, bloodPressure: 135, temperature: 98.4, oxygenSaturation: 97 },
  { date: '2024-01-17', heartRate: 82, bloodPressure: 140, temperature: 98.7, oxygenSaturation: 96 },
  { date: '2024-01-18', heartRate: 85, bloodPressure: 142, temperature: 98.5, oxygenSaturation: 97 },
  { date: '2024-01-19', heartRate: 88, bloodPressure: 145, temperature: 98.6, oxygenSaturation: 97 },
  { date: '2024-01-20', heartRate: 88, bloodPressure: 145, temperature: 98.6, oxygenSaturation: 97 }
];