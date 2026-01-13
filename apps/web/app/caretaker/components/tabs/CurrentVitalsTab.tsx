import React from 'react';
import { Activity, Clock, RefreshCw, Heart, Activity as ActivityIcon, Droplets, User } from 'lucide-react';
import { Patient, VitalSigns } from '../../types';

interface CurrentVitalsTabProps {
  patient: Patient;
  patientVitals: VitalSigns[];
  isLoading: boolean;
  onRefresh?: () => void;
  lastUpdated?: string;
}

const CurrentVitalsTab: React.FC<CurrentVitalsTabProps> = ({
  patient,
  patientVitals,
  isLoading,
  onRefresh,
  lastUpdated
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [localTimestamp, setLocalTimestamp] = React.useState<string>('');

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
  React.useEffect(() => {
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Current Vitals</h3>
              <p className="text-sm text-gray-500">Latest measurements</p>
            </div>
          </div>
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Current Vitals</h3>
              <p className="text-sm text-gray-500">Latest measurements</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          No patient selected
        </div>
      </div>
    );
  }

  if (!latestVitals) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Current Vitals</h3>
              <p className="text-sm text-gray-500">Latest measurements</p>
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
        <div className="text-center py-8 text-gray-500">
          No vitals data available for {patient.fullName}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Current Vitals</h3>
            <p className="text-sm text-gray-500">Latest measurements</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Profile Picture */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">{patient.fullName}</h4>
          <p className="text-sm text-gray-600">{patient.age} years • {patient.gender}</p>
          <p className="text-xs font-medium text-blue-600 mt-1">Last updated: {localTimestamp}</p>
        </div>

        {/* Vitals Grid */}
        <div className="space-y-4">
          {/* Blood Pressure for Hypertension Patients */}
          {(patient.condition === 'hypertension' || patient.condition === 'both') && 
           latestVitals.systolic && latestVitals.diastolic && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <ActivityIcon className="w-5 h-5 text-white" />
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
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-white" />
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
        </div>
      </div>

      {/* Health Status Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Health Status Summary</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patient.condition === 'hypertension' && latestVitals.systolic && latestVitals.diastolic && (
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="text-xs font-medium text-gray-700">BP Classification:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                'bg-red-100 text-red-800' : 
                latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                  'Stage 2 Hypertension' : 
                  latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                  'Stage 1 Hypertension' : 'Normal'}
              </span>
            </div>
          )}
          {patient.condition === 'diabetes' && latestVitals.glucose && (
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="text-xs font-medium text-gray-700">Glucose Level:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                latestVitals.glucose >= 180 ? 
                'bg-red-100 text-red-800' : 
                latestVitals.glucose >= 140 ?
                'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {latestVitals.glucose >= 180 ? 
                  'High' : 
                  latestVitals.glucose >= 140 ?
                  'Borderline' : 'Normal'}
              </span>
            </div>
          )}
          {patient.condition === 'both' && (
            <div className="space-y-2">
              {latestVitals.systolic && latestVitals.diastolic && (
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-xs font-medium text-gray-700">BP:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                    'bg-red-100 text-red-800' : 
                    latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                    'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                      'Stage 2' : 
                      latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                      'Stage 1' : 'Normal'}
                  </span>
                </div>
              )}
              {latestVitals.glucose && (
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-xs font-medium text-gray-700">Glucose:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    latestVitals.glucose >= 180 ? 
                    'bg-red-100 text-red-800' : 
                    latestVitals.glucose >= 140 ?
                    'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
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

export default CurrentVitalsTab;
