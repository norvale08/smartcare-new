import React from 'react';
import { TrendingUp, Clock, Calendar, Activity, HeartPulse, Droplets, User, LineChart } from 'lucide-react';
import { Patient, VitalSigns } from '../../types';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';

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

  // Prepare chart data with proper formatting
  const chartData = last7DaysVitals.map(vital => ({
    date: new Date(vital.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    timestamp: vital.timestamp,
    systolic: vital.systolic || null,
    diastolic: vital.diastolic || null,
    heartRate: vital.heartRate || null,
    glucose: vital.glucose || null,
  })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate averages for hypertension analysis
  const calculateAverages = () => {
    const bpReadings = patientVitalsFiltered.filter(v => v.systolic && v.diastolic);
    const hrReadings = patientVitalsFiltered.filter(v => v.heartRate);
    const glucoseReadings = patientVitalsFiltered.filter(v => v.glucose);

    return {
      avgSystolic: bpReadings.length > 0 
        ? bpReadings.reduce((sum, v) => sum + v.systolic!, 0) / bpReadings.length 
        : null,
      avgDiastolic: bpReadings.length > 0 
        ? bpReadings.reduce((sum, v) => sum + v.diastolic!, 0) / bpReadings.length 
        : null,
      avgHeartRate: hrReadings.length > 0 
        ? hrReadings.reduce((sum, v) => sum + v.heartRate!, 0) / hrReadings.length 
        : null,
      avgGlucose: glucoseReadings.length > 0 
        ? glucoseReadings.reduce((sum, v) => sum + v.glucose!, 0) / glucoseReadings.length 
        : null,
    };
  };

  const averages = calculateAverages();

  // Hypertension-specific analysis
  const getHypertensionAnalysis = () => {
    if (patient.condition !== 'hypertension' && patient.condition !== 'both') return null;
    
    const analysis = {
      severity: 'Normal',
      riskLevel: 'low',
      recommendations: [] as string[],
      controlStatus: 'Well Controlled'
    };

    if (averages.avgSystolic && averages.avgDiastolic) {
      if (averages.avgSystolic >= 180 || averages.avgDiastolic >= 110) {
        analysis.severity = 'Hypertensive Crisis';
        analysis.riskLevel = 'critical';
        analysis.controlStatus = 'Uncontrolled';
        analysis.recommendations.push('Immediate medical attention required');
        analysis.recommendations.push('Emergency consultation needed');
      } else if (averages.avgSystolic >= 140 || averages.avgDiastolic >= 90) {
        analysis.severity = 'Stage 2 Hypertension';
        analysis.riskLevel = 'high';
        analysis.controlStatus = 'Poorly Controlled';
        analysis.recommendations.push('Urgent follow-up with healthcare provider');
        analysis.recommendations.push('Review medication regimen');
      } else if (averages.avgSystolic >= 130 || averages.avgDiastolic >= 85) {
        analysis.severity = 'Stage 1 Hypertension';
        analysis.riskLevel = 'moderate';
        analysis.controlStatus = 'Moderately Controlled';
        analysis.recommendations.push('Lifestyle modifications recommended');
        analysis.recommendations.push('Increase monitoring frequency');
      } else {
        analysis.severity = 'Normal/Elevated';
        analysis.riskLevel = 'low';
        analysis.controlStatus = 'Well Controlled';
        analysis.recommendations.push('Continue current management');
        analysis.recommendations.push('Maintain healthy lifestyle');
      }
    }

    return analysis;
  };

  const hypertensionAnalysis = getHypertensionAnalysis();

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

      {/* Interactive Charts Section */}
      <div className="space-y-8">
        {/* Blood Pressure Chart */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && chartData.filter(d => d.systolic && d.diastolic).length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <HeartPulse className="w-5 h-5 text-red-500" />
                <h4 className="text-lg font-medium text-gray-900">Blood Pressure Trends</h4>
                <span className="text-xs text-gray-500">Last {chartData.filter(d => d.systolic && d.diastolic).length} readings</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Systolic</span>
                <div className="w-3 h-3 bg-blue-500 rounded-full ml-2"></div>
                <span className="text-xs text-gray-600">Diastolic</span>
              </div>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData.filter(d => d.systolic && d.diastolic)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[60, 200]}
                    label={{ value: 'mmHg', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name) => [`${value} mmHg`, name]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="systolic" 
                    stackId="1" 
                    stroke="none" 
                    fill="rgba(239, 68, 68, 0.1)" 
                    fillOpacity={0.6} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                    name="Systolic"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="diastolic" 
                    stackId="2" 
                    stroke="none" 
                    fill="rgba(59, 130, 246, 0.1)" 
                    fillOpacity={0.6} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    name="Diastolic"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Hypertension Analysis */}
            {hypertensionAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Hypertension Control Status</h5>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      hypertensionAnalysis.riskLevel === 'critical' ? 'bg-red-500' :
                      hypertensionAnalysis.riskLevel === 'high' ? 'bg-orange-500' :
                      hypertensionAnalysis.riskLevel === 'moderate' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{hypertensionAnalysis.controlStatus}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{hypertensionAnalysis.severity}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Average Readings</h5>
                  <div className="text-sm text-gray-700">
                    {averages.avgSystolic && averages.avgDiastolic ? (
                      <span className="font-medium">{averages.avgSystolic.toFixed(0)}/{averages.avgDiastolic.toFixed(0)} mmHg</span>
                    ) : (
                      <span className="text-gray-500">No data</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Heart Rate Chart */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && chartData.filter(d => d.heartRate).length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-green-500" />
                <h4 className="text-lg font-medium text-gray-900">Heart Rate Trends</h4>
                <span className="text-xs text-gray-500">Last {chartData.filter(d => d.heartRate).length} readings</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Heart Rate</span>
              </div>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData.filter(d => d.heartRate)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[40, 140]}
                    label={{ value: 'bpm', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} bpm`, 'Heart Rate']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>

            {/* Heart Rate Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Average Heart Rate</h5>
                <div className="text-sm text-gray-700">
                  {averages.avgHeartRate ? (
                    <span className="font-medium">{averages.avgHeartRate.toFixed(0)} bpm</span>
                  ) : (
                    <span className="text-gray-500">No data</span>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Status</h5>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    heartRateTrend === 'increasing' ? 'bg-red-500' :
                    heartRateTrend === 'decreasing' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">{heartRateTrend}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Glucose Chart */}
        {(patient.condition === 'diabetes' || patient.condition === 'both') && chartData.filter(d => d.glucose).length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Droplets className="w-5 h-5 text-orange-500" />
                <h4 className="text-lg font-medium text-gray-900">Glucose Trends</h4>
                <span className="text-xs text-gray-500">Last {chartData.filter(d => d.glucose).length} readings</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Glucose</span>
              </div>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData.filter(d => d.glucose)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[50, 300]}
                    label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} mg/dL`, 'Glucose']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="glucose" 
                    stroke="#f97316" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>

            {/* Glucose Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Average Glucose</h5>
                <div className="text-sm text-gray-700">
                  {averages.avgGlucose ? (
                    <span className="font-medium">{averages.avgGlucose.toFixed(0)} mg/dL</span>
                  ) : (
                    <span className="text-gray-500">No data</span>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">Status</h5>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    glucoseTrend === 'increasing' ? 'bg-red-500' :
                    glucoseTrend === 'decreasing' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">{glucoseTrend}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Insights Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-3 mb-6">
          <LineChart className="w-6 h-6 text-blue-600" />
          <h4 className="text-xl font-semibold text-gray-900">Comprehensive Health Analysis</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Monitoring Frequency</h5>
            <p className="text-2xl font-bold text-blue-600">{(patientVitalsFiltered.length / 4).toFixed(1)}</p>
            <p className="text-xs text-gray-600">readings per week</p>
          </div>
          
          {(patient.condition === 'hypertension' || patient.condition === 'both') && (
            <>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-2">BP Trend Analysis</h5>
                <div className="flex items-center space-x-2 mb-2">
                  {getTrendIcon(bpTrend)}
                  <span className="text-lg font-semibold text-gray-900 capitalize">{bpTrend}</span>
                </div>
                <p className="text-xs text-gray-600">
                  {bpTrend === 'stable' ? 'Consistent readings indicate good control' : 
                   bpTrend === 'increasing' ? 'Upward trend requires attention' :
                   'Positive improvement trend'}
                </p>
              </div>
              
              {hypertensionAnalysis && (
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Control Status</h5>
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    hypertensionAnalysis.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                    hypertensionAnalysis.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                    hypertensionAnalysis.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {hypertensionAnalysis.controlStatus}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{hypertensionAnalysis.severity}</p>
                </div>
              )}
            </>
          )}
          
          {(patient.condition === 'diabetes' || patient.condition === 'both') && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Glucose Control</h5>
              <div className="flex items-center space-x-2 mb-2">
                {getTrendIcon(glucoseTrend)}
                <span className="text-lg font-semibold text-gray-900 capitalize">{glucoseTrend}</span>
              </div>
              <p className="text-xs text-gray-600">
                {glucoseTrend === 'stable' ? 'Consistent glucose management' : 
                 glucoseTrend === 'increasing' ? 'Review diet and medication' :
                 'Improving glucose control'}
              </p>
            </div>
          )}
        </div>

        {/* Hypertension-Specific Recommendations */}
        {hypertensionAnalysis && hypertensionAnalysis.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Recommendations for Hypertension Management</h5>
            <div className="space-y-2">
              {hypertensionAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTrendsTab;
