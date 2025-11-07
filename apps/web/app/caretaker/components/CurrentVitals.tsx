// app/caretaker/components/CurrentVitals.tsx
import React, { useState, useEffect } from 'react';
import { Activity, Clock, RefreshCw } from 'lucide-react';
import { Patient, VitalSigns } from '../types';

interface CurrentVitalsProps {
  patient: Patient;
  patientVitals: VitalSigns[];
  isLoading: boolean;
  onRefresh?: () => void;
  lastUpdated?: string;
}

const CurrentVitals: React.FC<CurrentVitalsProps> = ({
  patient,
  patientVitals,
  isLoading,
  onRefresh,
  lastUpdated
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localTimestamp, setLocalTimestamp] = useState<string>('');

  // Filter vitals to only include data for the current patient
  const getPatientSpecificVitals = (vitals: VitalSigns[], currentPatient: Patient) => {
  if (!vitals || !currentPatient) return [];
  const patientKey = currentPatient.userId || currentPatient.id; // support both
  return vitals.filter(vital => vital.patientId === patientKey);
};


  // Ensure we always get the latest vitals by sorting by timestamp
  const getLatestVitals = (vitals: VitalSigns[], currentPatient: Patient): VitalSigns | null => {
    if (!vitals || vitals.length === 0 || !currentPatient) return null;
    
    // Filter to only this patient's vitals
    const patientVitals = getPatientSpecificVitals(vitals, currentPatient);
    if (patientVitals.length === 0) return null;
    
    // Sort by timestamp descending and take the first one
    const sorted = [...patientVitals].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0] || null;
  };

  const latestVitals = getLatestVitals(patientVitals, patient);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Update local timestamp when vitals change
  useEffect(() => {
    if (latestVitals?.timestamp) {
      setLocalTimestamp(new Date(latestVitals.timestamp).toLocaleString());
    } else if (lastUpdated) {
      setLocalTimestamp(new Date(lastUpdated).toLocaleString());
    } else {
      setLocalTimestamp('');
    }
  }, [latestVitals, lastUpdated]);

  const getBloodPressureStatus = (systolic: number, diastolic: number) => {
    if (systolic >= 140 || diastolic >= 90) return 'text-red-600';
    if (systolic >= 130 || diastolic >= 85) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getGlucoseStatus = (glucose: number) => {
    if (glucose >= 180) return 'text-red-600';
    if (glucose >= 140) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getHeartRateStatus = (heartRate: number) => {
    if (heartRate >= 100 || heartRate <= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Add debug logging to see what's happening
  useEffect(() => {
    console.log('🩺 CurrentVitals Debug:', {
      patientId: patient?.id,
      patientName: patient?.fullName,
      totalVitalsCount: patientVitals?.length,
      patientSpecificVitals: getPatientSpecificVitals(patientVitals, patient)?.length,
      latestVitals: latestVitals,
    });
  }, [patient, patientVitals, latestVitals]);// In CurrentVitals.tsx - add this useEffect


  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Current Vitals</h3>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Current Vitals</h3>
          </div>
        </div>
        <div className="text-center text-gray-500 py-4">
          No patient selected
        </div>
      </div>
    );
  }

  if (!latestVitals) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Current Vitals</h3>
          </div>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <RefreshCw 
                className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
            </button>
          )}
        </div>
        <div className="text-center text-gray-500 py-4">
          No vitals data available for {patient.fullName}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Current Vitals</h3>
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh vitals"
          >
            <RefreshCw 
              className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Blood Pressure for Hypertension Patients */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && 
         latestVitals.systolic && latestVitals.diastolic && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Blood Pressure</span>
            <span className={`font-medium ${getBloodPressureStatus(latestVitals.systolic, latestVitals.diastolic)}`}>
              {latestVitals.systolic}/{latestVitals.diastolic} mmHg
            </span>
          </div>
        )}

        {/* Heart Rate for Hypertension Patients */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && 
         latestVitals.heartRate && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Heart Rate</span>
            <span className={`font-medium ${getHeartRateStatus(latestVitals.heartRate)}`}>
              {latestVitals.heartRate} bpm
            </span>
          </div>
        )}

        {/* Glucose for Diabetes Patients */}
        {(patient.condition === 'diabetes' || patient.condition === 'both') && 
         latestVitals.glucose && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Glucose</span>
            <span className={`font-medium ${getGlucoseStatus(latestVitals.glucose)}`}>
              {latestVitals.glucose} mg/dL
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center space-x-1 text-xs text-gray-400 pt-2 border-t">
          <Clock className="w-3 h-3" />
          <span>Last updated: {localTimestamp}</span>
        </div>

        {/* Quick Status Summary */}
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          {patient.condition === 'hypertension' && latestVitals.systolic && latestVitals.diastolic && (
            <div>
              BP Classification: {latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                'Stage 2 Hypertension' : 
                latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                'Stage 1 Hypertension' : 'Normal'}
            </div>
          )}
          {patient.condition === 'diabetes' && latestVitals.glucose && (
            <div>
              Glucose Level: {latestVitals.glucose >= 180 ? 
                'High' : 
                latestVitals.glucose >= 140 ?
                'Borderline' : 'Normal'}
            </div>
          )}
          {patient.condition === 'both' && (
            <div className="space-y-1">
              {latestVitals.systolic && latestVitals.diastolic && (
                <div>
                  BP: {latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                    'Stage 2' : 
                    latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                    'Stage 1' : 'Normal'}
                </div>
              )}
              {latestVitals.glucose && (
                <div>
                  Glucose: {latestVitals.glucose >= 180 ? 
                    'High' : 
                    latestVitals.glucose >= 140 ?
                    'Borderline' : 'Normal'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentVitals;