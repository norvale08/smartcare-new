"use client";

import React from 'react';
import { 
  TrendingUp, Clock, Calendar, Activity, HeartPulse, Droplets, User,
  AlertTriangle, Shield, CheckCircle, LineChart 
} from 'lucide-react';
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

interface Patient {
  id: string;
  userId?: string;
  fullName: string;
  age: number;
  gender: string;
  condition: "hypertension" | "diabetes" | "both";
}

interface VitalSigns {
  id?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  glucose?: number;
  timestamp: string;
  patientId: string;
  age?: number;
}

interface HealthTrendsAndRiskTabProps {
  patient: Patient;
  patientVitals: VitalSigns[];
}

const HealthTrendsAndRiskTab: React.FC<HealthTrendsAndRiskTabProps> = ({
  patient,
  patientVitals
}) => {
  // Debug logging
  console.log('=== HealthTrendsAndRiskTab Debug ===');
  console.log('Patient:', patient);
  console.log('Patient vitals passed to component:', patientVitals);
  console.log('Patient vitals length:', patientVitals?.length || 0);
  
  // If no vitals at all, show empty state
  if (!patientVitals || patientVitals.length === 0) {
    console.log('No vitals data at all');
    return (
      <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Health Trends & Risk Assessment</h3>
            <p className="text-sm text-gray-500">Comprehensive health analysis and risk evaluation</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          <Clock className="w-5 h-5 mr-2 text-gray-400" />
          No vitals data available. Add vitals to see analysis and risk assessment.
        </div>
      </div>
    );
  }

  // SIMPLIFIED: Use the vitals directly without filtering by patient
  // This matches what HypertensionRiskAssessment does
  const usableVitals = patientVitals;
  
  console.log('Using vitals directly (no filtering):', usableVitals.length, 'readings');
  
  // Sort vitals by timestamp for chronological order (oldest first for charts)
  const sortedVitals = [...usableVitals].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Get latest vitals for risk assessment
  const getLatestVitals = (vitals: VitalSigns[]): VitalSigns | null => {
    if (!vitals || vitals.length === 0) return null;
    
    const sorted = [...vitals].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0] || null;
  };

  const latestVitals = getLatestVitals(usableVitals);
  console.log('Latest vitals:', latestVitals);

  // Risk assessment functions - SIMPLIFIED to match HypertensionRiskAssessment
  const calculateRiskLevel = () => {
    console.log('Calculating risk level with latest vitals:', latestVitals);
    
    if (!latestVitals) {
      console.log('No latest vitals, returning no_data');
      return { level: 'no_data' as const, score: 0, factors: [] };
    }

    // Use the same logic as HypertensionRiskAssessment
    const systolic = latestVitals.systolic ?? 0;
    const diastolic = latestVitals.diastolic ?? 0;
    const heartRate = latestVitals.heartRate ?? 0;

    console.log('Values for risk calculation:', { systolic, diastolic, heartRate });

    let riskScore = 0;
    const riskFactors: string[] = [];

    if (systolic && diastolic) {
      if (systolic >= 180 || diastolic >= 120) {
        riskScore += 30;
        riskFactors.push("Hypertensive crisis range");
      } else if (systolic >= 160 || diastolic >= 100) {
        riskScore += 20;
        riskFactors.push("Stage 2 hypertension range");
      } else if (systolic >= 140 || diastolic >= 90) {
        riskScore += 15;
        riskFactors.push("Stage 1 hypertension range");
      } else if (systolic >= 130 || diastolic >= 85) {
        riskScore += 10;
        riskFactors.push("Elevated blood pressure");
      }

      const pulsePressure = systolic - diastolic;
      if (pulsePressure > 60) {
        riskScore += 10;
        riskFactors.push("Wide pulse pressure");
      }
    }

    if (heartRate) {
      if (heartRate > 100) {
        riskScore += 10;
        riskFactors.push("Fast heart rate (tachycardia)");
      } else if (heartRate < 60) {
        riskScore += 5;
        riskFactors.push("Slow heart rate (bradycardia)");
      }
    }

    // Determine risk level - same logic as HypertensionRiskAssessment
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' | 'no_data' = 'low';
    if (riskScore > 45) {
      riskLevel = 'critical';
    } else if (riskScore > 30) {
      riskLevel = 'high';
    } else if (riskScore > 15) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'low';
    }

    console.log('Risk assessment result:', { level: riskLevel, score: riskScore, factors: riskFactors });
    
    return { level: riskLevel, score: riskScore, factors: riskFactors };
  };

  const riskAssessment = calculateRiskLevel();
  console.log('Final risk assessment:', riskAssessment);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-500 text-green-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
      case 'moderate':
        return <AlertTriangle className="w-5 h-5" />;
      case 'low':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  // Calculate averages
  const calculateAverages = () => {
    const bpReadings = usableVitals.filter(v => v.systolic !== undefined && v.diastolic !== undefined);
    const hrReadings = usableVitals.filter(v => v.heartRate !== undefined);
    const glucoseReadings = usableVitals.filter(v => v.glucose !== undefined);

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

  // Prepare chart data
  const chartData = sortedVitals.map(vital => ({
    date: new Date(vital.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    timestamp: vital.timestamp,
    systolic: vital.systolic ?? null,
    diastolic: vital.diastolic ?? null,
    heartRate: vital.heartRate ?? null,
    glucose: vital.glucose ?? null,
  }));

  console.log('Chart data prepared:', chartData);

  // Get recommendations - same as HypertensionRiskAssessment
  const getRecommendations = () => {
    const recommendations: string[] = [];

    if (riskAssessment.level === 'critical') {
      recommendations.push("Seek urgent medical attention immediately.");
      recommendations.push("Avoid physical exertion and follow your doctor's emergency plan.");
    } else if (riskAssessment.level === 'high') {
      recommendations.push("Book a follow-up appointment with your doctor as soon as possible.");
      recommendations.push("Review medication adherence and limit salt, alcohol, and stress.");
    } else if (riskAssessment.level === 'moderate') {
      recommendations.push("Monitor your blood pressure regularly this week.");
      recommendations.push("Focus on lifestyle changes: low-salt diet, exercise, and stress control.");
    } else if (riskAssessment.level === 'low') {
      recommendations.push("Keep up your current routine and continue regular monitoring.");
    } else if (riskAssessment.level === 'no_data') {
      recommendations.push('No recent vitals data available. Schedule regular monitoring.');
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  console.log('=== Rendering component ===');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Health Trends & Risk Assessment</h3>
            <p className="text-sm text-gray-500">Summary based on patient vitals</p>
          </div>
        </div>

        {/* Patient Profile Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">{patient.fullName}</h4>
                <p className="text-xs text-gray-600">{patient.age} years • {patient.gender}</p>
              </div>
            </div>
            <p className="text-xs font-medium text-blue-600 capitalize">{patient.condition}</p>
            <p className="text-xs text-gray-500 mt-1">
              {usableVitals.length} reading{usableVitals.length !== 1 ? 's' : ''} total
            </p>
          </div>

          {/* Latest BP Card */}
          {latestVitals?.systolic !== undefined && latestVitals?.diastolic !== undefined && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-2 mb-2">
                <HeartPulse className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-800">Latest BP</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {latestVitals.systolic}/{latestVitals.diastolic} <span className="text-sm font-normal text-gray-600">mmHg</span>
              </p>
              {averages.avgSystolic !== null && averages.avgDiastolic !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {averages.avgSystolic.toFixed(0)}/{averages.avgDiastolic.toFixed(0)}
                </p>
              )}
            </div>
          )}

          {/* Latest Heart Rate Card */}
          {latestVitals?.heartRate !== undefined && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-100">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-gray-800">Heart Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {latestVitals.heartRate} <span className="text-sm font-normal text-gray-600">bpm</span>
              </p>
              {averages.avgHeartRate !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {averages.avgHeartRate.toFixed(0)} bpm
                </p>
              )}
            </div>
          )}

          {/* Latest Glucose Card */}
          {latestVitals?.glucose !== undefined && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-4 rounded-lg border border-orange-100">
              <div className="flex items-center space-x-2 mb-2">
                <Droplets className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-800">Glucose</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {latestVitals.glucose} <span className="text-sm font-normal text-gray-600">mg/dL</span>
              </p>
              {averages.avgGlucose !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {averages.avgGlucose.toFixed(0)} mg/dL
                </p>
              )}
            </div>
          )}
        </div>

        {/* Risk Assessment */}
        <div className={`p-4 rounded-lg border-2 ${getRiskColor(riskAssessment.level)}`}>
          <div className="flex items-center space-x-2 mb-2">
            {getRiskIcon(riskAssessment.level)}
            <span className="text-sm font-medium">Risk Level</span>
          </div>
          <p className="text-lg font-semibold capitalize">{riskAssessment.level}</p>
          <p className="text-xs mt-1 text-gray-700">Score: {riskAssessment.score}/100</p>
        </div>
      </div>

      {/* Charts Section - Only show if we have chart data */}
      {chartData.length > 0 && (
        <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Health Data Trends</h4>
          
          <div className="space-y-8">
            {/* Blood Pressure Chart */}
            {chartData.filter(d => d.systolic !== null && d.diastolic !== null).length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="w-5 h-5 text-red-500" />
                    <h5 className="font-medium text-gray-900">Blood Pressure Trends</h5>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Systolic</span>
                    <div className="w-3 h-3 bg-blue-500 rounded-full ml-2"></div>
                    <span className="text-xs text-gray-600">Diastolic</span>
                  </div>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData.filter(d => d.systolic !== null && d.diastolic !== null)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={[60, 200]}
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
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
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
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                        name="Diastolic"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Heart Rate Chart */}
            {chartData.filter(d => d.heartRate !== null).length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="w-5 h-5 text-green-500" />
                  <h5 className="font-medium text-gray-900">Heart Rate Trends</h5>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData.filter(d => d.heartRate !== null)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={[40, 140]}
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
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Glucose Chart */}
            {chartData.filter(d => d.glucose !== null).length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Droplets className="w-5 h-5 text-orange-500" />
                  <h5 className="font-medium text-gray-900">Glucose Trends</h5>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={chartData.filter(d => d.glucose !== null)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={[50, 300]}
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
                        strokeWidth={2}
                        dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment Details */}
      <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h4 className="text-lg font-semibold text-gray-900">Risk Assessment Details</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-800 mb-3">Key Risk Factors</h5>
            {riskAssessment.factors.length === 0 ? (
              <p className="text-sm text-gray-600">No major risk factors detected from latest readings.</p>
            ) : (
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {riskAssessment.factors.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <h5 className="text-sm font-semibold text-gray-800 mb-3">Suggested Next Steps</h5>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {recommendations.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {riskAssessment.level === 'critical' && (
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Emergency Contact
            </button>
          )}
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <User className="w-4 h-4 inline mr-2" />
            Schedule Follow-up
          </button>
          
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
            <Clock className="w-4 h-4 inline mr-2" />
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthTrendsAndRiskTab;