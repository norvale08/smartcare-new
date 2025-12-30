import React from 'react';
import { TrendingUp, Clock, Calendar, Activity, HeartPulse, Droplets, User } from 'lucide-react';
import { Patient, VitalSigns } from '../../types';

interface HealthTrendsTabProps {
  patient: Patient;
  patientVitals: VitalSigns[];
}

const HealthTrendsTab: React.FC<HealthTrendsTabProps> = ({
  patient,
  patientVitals
}) => {
  // Filter vitals to only include data for the current patient
  const getPatientSpecificVitals = (vitals: VitalSigns[], currentPatient: Patient) => {
    if (!vitals || !currentPatient) return [];
    const patientKey = currentPatient.userId || currentPatient.id;
    return vitals.filter(vital => vital.patientId === patientKey);
  };

  const patientVitalsFiltered = getPatientSpecificVitals(patientVitals, patient);
  
  // Sort vitals by timestamp for chronological order
  const sortedVitals = [...patientVitalsFiltered].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Get the last 7 days of data
  const last7DaysVitals = sortedVitals.slice(-7);

  const getTrendDirection = (values: number[]) => {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3);
    const older = values.slice(0, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':
        return <TrendingUp className="w-4 h-4 text-green-500 transform rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600 bg-red-50';
      case 'decreasing':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatLast7DaysData = () => {
    const bpData = last7DaysVitals
      .filter(v => v.systolic && v.diastolic)
      .map(v => ({ 
        date: new Date(v.timestamp).toLocaleDateString(), 
        systolic: v.systolic!, 
        diastolic: v.diastolic! 
      }));
    
    const heartRateData = last7DaysVitals
      .filter(v => v.heartRate)
      .map(v => ({ 
        date: new Date(v.timestamp).toLocaleDateString(), 
        heartRate: v.heartRate! 
      }));
    
    const glucoseData = last7DaysVitals
      .filter(v => v.glucose)
      .map(v => ({ 
        date: new Date(v.timestamp).toLocaleDateString(), 
        glucose: v.glucose! 
      }));
    
    return {
      bpData,
      heartRateData,
      glucoseData
    };
  };

  const healthData = formatLast7DaysData();
  const bpTrend = getTrendDirection(last7DaysVitals.filter(v => v.systolic).map(v => v.systolic!));
  const heartRateTrend = getTrendDirection(last7DaysVitals.filter(v => v.heartRate).map(v => v.heartRate!));
  const glucoseTrend = getTrendDirection(last7DaysVitals.filter(v => v.glucose).map(v => v.glucose!));

  const getLatestReading = () => {
    if (sortedVitals.length === 0) return null;
    return sortedVitals[sortedVitals.length - 1];
  };

  const latestReading = getLatestReading();

  if (patientVitalsFiltered.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Health Trends</h3>
            <p className="text-sm text-gray-500">Historical data analysis</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Historical Data Available</h4>
          <p className="text-gray-500">Vital signs data will appear here once recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Health Trends</h3>
          <p className="text-sm text-gray-500">Historical data analysis</p>
        </div>
      </div>

      {/* Patient Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{patient.fullName}</h4>
              <p className="text-sm text-gray-600">{patient.age} years • {patient.gender}</p>
              <p className="text-xs font-medium text-blue-600">{patient.condition}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Total readings: {patientVitalsFiltered.length}</span>
            </p>
            <p className="flex items-center space-x-2 mt-1">
              <Clock className="w-4 h-4" />
              <span>Latest: {latestReading ? new Date(latestReading.timestamp).toLocaleDateString() : 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Trend Summary Cards */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && (
          <>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <HeartPulse className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">BP Trend</span>
                </div>
                {getTrendIcon(bpTrend)}
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(bpTrend)}`}>
                {bpTrend.charAt(0).toUpperCase() + bpTrend.slice(1)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                </div>
                {getTrendIcon(heartRateTrend)}
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(heartRateTrend)}`}>
                {heartRateTrend.charAt(0).toUpperCase() + heartRateTrend.slice(1)}
              </div>
            </div>
          </>
        )}

        {(patient.condition === 'diabetes' || patient.condition === 'both') && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Glucose Trend</span>
              </div>
              {getTrendIcon(glucoseTrend)}
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(glucoseTrend)}`}>
              {glucoseTrend.charAt(0).toUpperCase() + glucoseTrend.slice(1)}
            </div>
          </div>
        )}
      </div>

      {/* Health Data Trends */}
      <div className="space-y-8">
        {/* Blood Pressure Trends */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && healthData.bpData.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <HeartPulse className="w-5 h-5 text-blue-500" />
              <h4 className="text-lg font-medium text-gray-900">Blood Pressure Trends</h4>
              <span className="text-xs text-gray-500">Last {healthData.bpData.length} readings</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Systolic Trend</h5>
                <div className="space-y-2">
                  {healthData.bpData.slice(-5).map((reading, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs text-gray-600">{reading.date}</span>
                      <span className="text-sm font-medium text-gray-900">{reading.systolic} mmHg</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Diastolic Trend</h5>
                <div className="space-y-2">
                  {healthData.bpData.slice(-5).map((reading, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-xs text-gray-600">{reading.date}</span>
                      <span className="text-sm font-medium text-gray-900">{reading.diastolic} mmHg</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Heart Rate Trends */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && healthData.heartRateData.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="w-5 h-5 text-green-500" />
              <h4 className="text-lg font-medium text-gray-900">Heart Rate Trends</h4>
              <span className="text-xs text-gray-500">Last {healthData.heartRateData.length} readings</span>
            </div>
            
            <div className="space-y-2">
              {healthData.heartRateData.slice(-5).map((reading, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{reading.date}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{reading.heartRate} bpm</span>
                    {index === healthData.heartRateData.length - 1 && (
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(heartRateTrend)}`}>
                        {heartRateTrend}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Glucose Trends */}
        {(patient.condition === 'diabetes' || patient.condition === 'both') && healthData.glucoseData.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Droplets className="w-5 h-5 text-orange-500" />
              <h4 className="text-lg font-medium text-gray-900">Glucose Trends</h4>
              <span className="text-xs text-gray-500">Last {healthData.glucoseData.length} readings</span>
            </div>
            
            <div className="space-y-2">
              {healthData.glucoseData.slice(-5).map((reading, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{reading.date}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{reading.glucose} mg/dL</span>
                    {index === healthData.glucoseData.length - 1 && (
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getTrendColor(glucoseTrend)}`}>
                        {glucoseTrend}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Health Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded border">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Monitoring Frequency</h5>
            <p className="text-xs text-gray-600">
              Average readings per week: {(patientVitalsFiltered.length / 4).toFixed(1)}
            </p>
          </div>
          
          {(patient.condition === 'hypertension' || patient.condition === 'both') && (
            <div className="p-4 bg-white rounded border">
              <h5 className="text-sm font-medium text-gray-700 mb-2">BP Stability</h5>
              <p className="text-xs text-gray-600">
                {bpTrend === 'stable' ? 'Blood pressure is stable' : 
                 bpTrend === 'increasing' ? 'Blood pressure trending upward - monitor closely' :
                 'Blood pressure trending downward - positive trend'}
              </p>
            </div>
          )}
          
          {(patient.condition === 'diabetes' || patient.condition === 'both') && (
            <div className="p-4 bg-white rounded border">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Glucose Control</h5>
              <p className="text-xs text-gray-600">
                {glucoseTrend === 'stable' ? 'Glucose levels are stable' : 
                 glucoseTrend === 'increasing' ? 'Glucose levels trending upward - review diet' :
                 'Glucose levels trending downward - good control'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthTrendsTab;
