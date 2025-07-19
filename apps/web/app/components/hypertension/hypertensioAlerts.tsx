'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert, CheckCircle } from 'lucide-react';

interface Patient {
  id: string;
  firstname: string;
  lastname: string;
}

interface HypertensionData {
  patientId: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
}

interface MergedPatientData {
  id: string;
  name: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  riskLevel: 'normal' | 'high' | 'critical';
  message: string;
}

export default function HypertensionAlerts() {
  const [patients, setPatients] = useState<MergedPatientData[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [patientRes, vitalsRes] = await Promise.all([
          fetch(`${API_URL}/api/patients`),
          fetch(`${API_URL}/api/hypertension`)
        ]);

        const patientsData: Patient[] = await patientRes.json();
        const vitalsData: HypertensionData[] = await vitalsRes.json();

        const merged: MergedPatientData[] = patientsData.map((patient) => {
          const vitals = vitalsData.find(v => v.patientId === patient.id);
          if (!vitals) return null;

          const { systolic, diastolic, heartRate } = vitals;

          let riskLevel: 'normal' | 'high' | 'critical' = 'normal';
          let message = 'Your blood pressure is within the normal range. Keep it up!';

          if (systolic >= 180 || diastolic >= 120) {
            riskLevel = 'critical';
            message = '⚠️ Critical hypertension detected. Seek emergency medical care!';
          } else if (systolic >= 140 || diastolic >= 90) {
            riskLevel = 'high';
            message = 'High blood pressure detected. Please consult your doctor.';
          }

          if (heartRate < 60 || heartRate > 100) {
            message += ' Abnormal heart rate observed.';
          }

          return {
            id: patient.id,
            name: `${patient.firstname} ${patient.lastname}`,
            systolic,
            diastolic,
            heartRate,
            riskLevel,
            message,
          };
        }).filter(Boolean) as MergedPatientData[];

        setPatients(merged);
      } catch (error) {
        console.error('Failed to fetch patient data:', error);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">🩺 Hypertension Alerts</h1>

      {patients.length === 0 ? (
        <p className="text-gray-600">No patient hypertension data available.</p>
      ) : (
        patients.map((patient) => {
          const isNormal = patient.riskLevel === 'normal';

          return (
            <div
              key={patient.id}
              className={`w-full p-6 rounded-lg shadow-md border-l-4 ${
                isNormal
                  ? 'bg-green-50 border-green-600'
                  : 'bg-red-50 border-red-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isNormal ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <TriangleAlert className="text-red-600" size={20} />
                )}
                <h2 className={`text-lg font-semibold ${isNormal ? 'text-green-700' : 'text-red-700'}`}>
                  {isNormal ? 'Healthy Status' : 'Health Alert'}
                </h2>
              </div>

              <p className="text-sm text-gray-800 mb-2">
                <strong>Patient:</strong> {patient.name}
              </p>
              <p className="text-sm text-gray-800 mb-1">
                <strong>Systolic:</strong> {patient.systolic} mmHg
              </p>
              <p className="text-sm text-gray-800 mb-1">
                <strong>Diastolic:</strong> {patient.diastolic} mmHg
              </p>
              <p className="text-sm text-gray-800 mb-3">
                <strong>Heart Rate:</strong> {patient.heartRate} bpm
              </p>
              <p className={`text-sm ${isNormal ? 'text-green-800' : 'text-red-800'}`}>
                {patient.message}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
