// app/caretaker/components/CurrentVitals.tsx
import React, { useState, useEffect } from 'react';
import { Activity, Clock, RefreshCw, Heart, Activity as ActivityIcon, Droplets } from 'lucide-react';
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
    if (systolic >= 140 || diastolic >= 90) return 'text-red-600 bg-red-50';
    if (systolic >= 130 || diastolic >= 85) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getGlucoseStatus = (glucose: number) => {
    if (glucose >= 180) return 'text-red-600 bg-red-50';
    if (glucose >= 140) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getHeartRateStatus = (heartRate: number) => {
    if (heartRate >= 100 || heartRate <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
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
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
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
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
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
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
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
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Current Vitals</h3>
            <p className="text-xs text-gray-500">Latest measurements</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh vitals"
          >
            <RefreshCw 
              className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Blood Pressure for Hypertension Patients */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && 
         latestVitals.systolic && latestVitals.diastolic && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Blood Pressure</p>
                  <p className="text-xs text-gray-500">Systolic/Diastolic</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getBloodPressureStatus(latestVitals.systolic, latestVitals.diastolic)}`}>
                {latestVitals.systolic}/{latestVitals.diastolic} mmHg
              </div>
            </div>
          </div>
        )}

        {/* Heart Rate for Hypertension Patients */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && 
         latestVitals.heartRate && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <ActivityIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Heart Rate</p>
                  <p className="text-xs text-gray-500">Beats per minute</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHeartRateStatus(latestVitals.heartRate)}`}>
                {latestVitals.heartRate} bpm
              </div>
            </div>
          </div>
        )}

        {/* Glucose for Diabetes Patients */}
        {(patient.condition === 'diabetes' || patient.condition === 'both') && 
         latestVitals.glucose && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Glucose Level</p>
                  <p className="text-xs text-gray-500">Blood sugar</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGlucoseStatus(latestVitals.glucose)}`}>
                {latestVitals.glucose} mg/dL
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center space-x-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <Clock className="w-3 h-3" />
          <span>Last updated: {localTimestamp}</span>
        </div>

        {/* Quick Status Summary */}
        <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Health Status</p>
          {patient.condition === 'hypertension' && latestVitals.systolic && latestVitals.diastolic && (
            <div className="text-xs">
              <span className="font-medium">BP Classification:</span> 
              <span className={`ml-1 px-2 py-1 rounded ${latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                'bg-red-100 text-red-800' : 
                latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                  'Stage 2 Hypertension' : 
                  latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                  'Stage 1 Hypertension' : 'Normal'}
              </span>
            </div>
          )}
          {patient.condition === 'diabetes' && latestVitals.glucose && (
            <div className="text-xs">
              <span className="font-medium">Glucose Level:</span> 
              <span className={`ml-1 px-2 py-1 rounded ${latestVitals.glucose >= 180 ? 
                'bg-red-100 text-red-800' : 
                latestVitals.glucose >= 140 ?
                'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {latestVitals.glucose >= 180 ? 
                  'High' : 
                  latestVitals.glucose >= 140 ?
                  'Borderline' : 'Normal'}
              </span>
            </div>
          )}
          {patient.condition === 'both' && (
            <div className="space-y-1 text-xs">
              {latestVitals.systolic && latestVitals.diastolic && (
                <div>
                  <span className="font-medium">BP:</span> 
                  <span className={`ml-1 px-2 py-1 rounded ${latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                    'bg-red-100 text-red-800' : 
                    latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                    'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                      'Stage 2' : 
                      latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                      'Stage 1' : 'Normal'}
                  </span>
                </div>
              )}
              {latestVitals.glucose && (
                <div>
                  <span className="font-medium">Glucose:</span> 
                  <span className={`ml-1 px-2 py-1 rounded ${latestVitals.glucose >= 180 ? 
                    'bg-red-100 text-red-800' : 
                    latestVitals.glucose >= 140 ?
                    'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {latestVitals.glucose >= 180 ? 
                      'High' : 
                      latestVitals.glucose >= 140 ?
                      'Borderline' : 'Normal'}
                  </span>
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
