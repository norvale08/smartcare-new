import React from 'react';
import { AlertTriangle, Shield, HeartPulse, Activity, Droplets, User, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { Patient, VitalSigns } from '../../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area
} from 'recharts';

interface HealthRiskAssessmentTabProps {
  patient: Patient;
  patientVitals: VitalSigns[];
}

const HealthRiskAssessmentTab: React.FC<HealthRiskAssessmentTabProps> = ({
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
  
  // Get latest vitals for risk assessment
  const getLatestVitals = (vitals: VitalSigns[]): VitalSigns | null => {
    if (!vitals || vitals.length === 0) return null;
    
    const sorted = [...vitals].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0] || null;
  };

  const latestVitals = getLatestVitals(patientVitalsFiltered);

  // Calculate health risks based on latest vitals
  const calculateRiskLevel = () => {
    if (!latestVitals) return { level: 'no_data', score: 0, factors: [] };

    let riskScore = 0;
    const riskFactors: string[] = [];

    // Hypertension risk assessment
    if (patient.condition === 'hypertension' || patient.condition === 'both') {
      if (latestVitals.systolic && latestVitals.diastolic) {
        if (latestVitals.systolic >= 180 || latestVitals.diastolic >= 110) {
          riskScore += 30;
          riskFactors.push('Hypertensive Crisis');
        } else if (latestVitals.systolic >= 160 || latestVitals.diastolic >= 100) {
          riskScore += 20;
          riskFactors.push('Stage 2 Hypertension');
        } else if (latestVitals.systolic >= 140 || latestVitals.diastolic >= 90) {
          riskScore += 15;
          riskFactors.push('Stage 1 Hypertension');
        } else if (latestVitals.systolic >= 130 || latestVitals.diastolic >= 85) {
          riskScore += 10;
          riskFactors.push('Elevated Blood Pressure');
        }

        // Pulse pressure risk
        if (latestVitals.systolic && latestVitals.diastolic) {
          const pulsePressure = latestVitals.systolic - latestVitals.diastolic;
          if (pulsePressure > 60) {
            riskScore += 10;
            riskFactors.push('High Pulse Pressure');
          }
        }
      }

      // Heart rate risk
      if (latestVitals.heartRate) {
        if (latestVitals.heartRate > 100) {
          riskScore += 10;
          riskFactors.push('Tachycardia');
        } else if (latestVitals.heartRate < 60) {
          riskScore += 5;
          riskFactors.push('Bradycardia');
        }
      }
    }

    // Diabetes risk assessment
    if (patient.condition === 'diabetes' || patient.condition === 'both') {
      if (latestVitals.glucose) {
        if (latestVitals.glucose >= 300) {
          riskScore += 25;
          riskFactors.push('Severe Hyperglycemia');
        } else if (latestVitals.glucose >= 200) {
          riskScore += 20;
          riskFactors.push('Hyperglycemia');
        } else if (latestVitals.glucose >= 180) {
          riskScore += 15;
          riskFactors.push('Elevated Glucose');
        } else if (latestVitals.glucose < 70) {
          riskScore += 20;
          riskFactors.push('Hypoglycemia');
        }
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' | 'no_data' = 'no_data';
    
    if (riskScore === 0) {
      riskLevel = 'low';
    } else if (riskScore <= 15) {
      riskLevel = 'low';
    } else if (riskScore <= 30) {
      riskLevel = 'moderate';
    } else if (riskScore <= 45) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }

    return { level: riskLevel, score: riskScore, factors: riskFactors };
  };

  const riskAssessment = calculateRiskLevel();

  // Prepare chart data for risk trends
  const riskChartData = patientVitalsFiltered.map((vital, index) => {
    let riskScore = 0;
    
    if (vital.systolic && vital.diastolic) {
      if (vital.systolic >= 180 || vital.diastolic >= 110) riskScore += 30;
      else if (vital.systolic >= 160 || vital.diastolic >= 100) riskScore += 20;
      else if (vital.systolic >= 140 || vital.diastolic >= 90) riskScore += 15;
      else if (vital.systolic >= 130 || vital.diastolic >= 85) riskScore += 10;
    }
    
    if (vital.heartRate) {
      if (vital.heartRate > 100 || vital.heartRate < 60) riskScore += 10;
    }
    
    if (vital.glucose) {
      if (vital.glucose >= 300 || vital.glucose < 70) riskScore += 25;
      else if (vital.glucose >= 200) riskScore += 20;
      else if (vital.glucose >= 180) riskScore += 15;
    }
    
    return {
      date: new Date(vital.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: vital.timestamp,
      riskScore,
      systolic: vital.systolic || null,
      diastolic: vital.diastolic || null,
      heartRate: vital.heartRate || null,
      glucose: vital.glucose || null,
    };
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate trend direction for risk scores
  const getRiskTrend = () => {
    if (riskChartData.length < 2) return 'stable';
    
    const recent = riskChartData.slice(-3);
    const older = riskChartData.slice(0, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, v) => sum + v.riskScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v.riskScore, 0) / older.length;
    
    const diff = ((recentAvg - olderAvg) / (olderAvg || 1)) * 100;
    
    if (diff > 10) return 'increasing';
    if (diff < -10) return 'decreasing';
    return 'stable';
  };

  const riskTrend = getRiskTrend();

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
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'moderate':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRecommendations = () => {
    const recommendations: string[] = [];

    if (riskAssessment.level === 'no_data') {
      recommendations.push('No recent vitals data available. Schedule regular monitoring.');
    } else if (riskAssessment.level === 'critical') {
      recommendations.push('Immediate medical attention required. Contact emergency services.');
      recommendations.push('Continue monitoring vital signs every 15-30 minutes.');
      if (patient.condition === 'hypertension') {
        recommendations.push('Review current antihypertensive medication regimen.');
      }
      if (patient.condition === 'diabetes') {
        recommendations.push('Check for ketones if glucose is severely elevated.');
      }
    } else if (riskAssessment.level === 'high') {
      recommendations.push('Schedule urgent consultation with healthcare provider.');
      recommendations.push('Increase monitoring frequency to daily.');
      if (patient.condition === 'hypertension') {
        recommendations.push('Review medication adherence and dosage.');
      }
      if (patient.condition === 'diabetes') {
        recommendations.push('Review diet, exercise, and medication regimen.');
      }
    } else if (riskAssessment.level === 'moderate') {
      recommendations.push('Schedule routine follow-up appointment.');
      recommendations.push('Continue regular monitoring as prescribed.');
      recommendations.push('Consider lifestyle modifications if applicable.');
    } else if (riskAssessment.level === 'low') {
      recommendations.push('Maintain current treatment plan.');
      recommendations.push('Continue regular monitoring schedule.');
      recommendations.push('Stay vigilant for any new or worsening symptoms.');
    }

    if (patient.condition === 'both') {
      recommendations.push('Monitor both blood pressure and glucose levels regularly.');
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  if (patientVitalsFiltered.length === 0) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Health Risk Assessment</h3>
            <p className="text-sm text-gray-500">Risk evaluation and recommendations</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h4>
          <p className="text-gray-500">Vital signs data required for risk assessment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Health Risk Assessment</h3>
          <p className="text-sm text-gray-500">Risk evaluation and recommendations</p>
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
              <Clock className="w-4 h-4" />
              <span>Latest: {latestVitals ? new Date(latestVitals.timestamp).toLocaleDateString() : 'N/A'}</span>
            </p>
            <p className="flex items-center space-x-2 mt-1">
              <Shield className="w-4 h-4" />
              <span>Risk score: {riskAssessment.score}</span>
            </p>
          </div>
        </div>

        {/* Risk Level Card */}
        <div className={`p-6 rounded-lg border-2 ${getRiskColor(riskAssessment.level)}`}>
          <div className="flex items-center space-x-3 mb-4">
            {getRiskIcon(riskAssessment.level)}
            <div>
              <h4 className="text-lg font-semibold">Risk Level</h4>
              <p className="text-sm capitalize">{riskAssessment.level}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Risk Score</span>
              <span className="font-medium">{riskAssessment.score}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  riskAssessment.level === 'critical' ? 'bg-red-600 w-full' :
                  riskAssessment.level === 'high' ? 'bg-orange-600 w-4/5' :
                  riskAssessment.level === 'moderate' ? 'bg-yellow-600 w-2/3' :
                  'bg-green-600 w-1/3'
                }`}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
              <span>Risk Trend</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(riskTrend)}
                <span className="capitalize">{riskTrend}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h4>
          <div className="space-y-2">
            {riskAssessment.factors.length > 0 ? (
              riskAssessment.factors.map((factor, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">{factor}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No significant risk factors</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vitals Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {(patient.condition === 'hypertension' || patient.condition === 'both') && latestVitals?.systolic && latestVitals?.diastolic && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border border-red-100">
            <div className="flex items-center space-x-3 mb-4">
              <HeartPulse className="w-6 h-6 text-red-500" />
              <h4 className="font-semibold text-gray-900">Blood Pressure Risk</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {latestVitals.systolic}/{latestVitals.diastolic} mmHg
            </div>
            <div className="text-sm text-gray-600">
              {latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 
                'High Risk - Stage 1 Hypertension or higher' :
                latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ?
                'Elevated - Monitor closely' :
                'Normal Range'
              }
            </div>
          </div>
        )}

        {(patient.condition === 'hypertension' || patient.condition === 'both') && latestVitals?.heartRate && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="w-6 h-6 text-green-500" />
              <h4 className="font-semibold text-gray-900">Heart Rate Risk</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {latestVitals.heartRate} bpm
            </div>
            <div className="text-sm text-gray-600">
              {latestVitals.heartRate > 100 ? 'High - Tachycardia' :
               latestVitals.heartRate < 60 ? 'Low - Bradycardia' :
               'Normal Range'
              }
            </div>
          </div>
        )}

        {(patient.condition === 'diabetes' || patient.condition === 'both') && latestVitals?.glucose && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-100">
            <div className="flex items-center space-x-3 mb-4">
              <Droplets className="w-6 h-6 text-orange-500" />
              <h4 className="font-semibold text-gray-900">Glucose Risk</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {latestVitals.glucose} mg/dL
            </div>
            <div className="text-sm text-gray-600">
              {latestVitals.glucose >= 180 ? 'High - Hyperglycemia' :
               latestVitals.glucose >= 140 ? 'Elevated' :
               latestVitals.glucose < 70 ? 'Low - Hypoglycemia' :
               'Normal Range'
              }
            </div>
          </div>
        )}
      </div>

      {/* Risk Trend Visualization */}
      {riskChartData.length > 1 && (
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <h4 className="text-lg font-medium text-gray-900">Risk Score Trend</h4>
              <span className="text-xs text-gray-500">Last {riskChartData.length} readings</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Risk Score</span>
            </div>
          </div>
          
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'riskScore') return [`${value}/100`, 'Risk Score'];
                    if (name === 'systolic' || name === 'diastolic') return [`${value} mmHg`, name];
                    if (name === 'heartRate') return [`${value} bpm`, name];
                    if (name === 'glucose') return [`${value} mg/dL`, name];
                    return [value, name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="riskScore" 
                  fill="rgba(147, 51, 234, 0.1)" 
                  fillOpacity={0.6}
                  stroke="none"
                />
                <Line 
                  type="monotone" 
                  dataKey="riskScore" 
                  stroke="#9333ea" 
                  strokeWidth={3}
                  dot={{ fill: '#9333ea', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#9333ea', strokeWidth: 2 }}
                  name="Risk Score"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Trend Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Current Risk</h5>
              <div className="text-2xl font-bold text-gray-900">{riskAssessment.score}</div>
              <p className="text-xs text-gray-600">out of 100</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Trend Direction</h5>
              <div className="flex items-center space-x-2">
                {getTrendIcon(riskTrend)}
                <span className="text-sm font-medium text-gray-900 capitalize">{riskTrend}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {riskTrend === 'increasing' ? 'Risk is increasing - monitor closely' :
                 riskTrend === 'decreasing' ? 'Risk is decreasing - positive trend' :
                 'Risk is stable'}
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Peak Risk</h5>
              <div className="text-2xl font-bold text-red-600">
                {Math.max(...riskChartData.map(d => d.riskScore))}
              </div>
              <p className="text-xs text-gray-600">highest recorded</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-5 h-5 text-blue-500" />
          <h4 className="text-lg font-semibold text-gray-900">Recommendations</h4>
        </div>
        
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">{recommendation}</p>
            </div>
          ))}
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
          
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            <Activity className="w-4 h-4 inline mr-2" />
            Add to Monitor
          </button>

          {riskTrend === 'increasing' && (
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Review Treatment
            </button>
          )}
        </div>

        {/* Hypertension-Specific Insights */}
        {(patient.condition === 'hypertension' || patient.condition === 'both') && latestVitals?.systolic && latestVitals?.diastolic && (
          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Hypertension Risk Analysis</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Blood Pressure Classification</p>
                <p className="text-sm font-medium text-gray-900">
                  {latestVitals.systolic >= 180 || latestVitals.diastolic >= 110 ? 'Hypertensive Crisis' :
                   latestVitals.systolic >= 140 || latestVitals.diastolic >= 90 ? 'Stage 2 Hypertension' :
                   latestVitals.systolic >= 130 || latestVitals.diastolic >= 85 ? 'Stage 1 Hypertension' :
                   'Normal/Elevated'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Recommended Actions</p>
                <div className="space-y-1">
                  {riskAssessment.level === 'critical' && (
                    <>
                      <p className="text-xs text-red-700">• Immediate medical attention</p>
                      <p className="text-xs text-red-700">• Emergency consultation</p>
                    </>
                  )}
                  {riskAssessment.level === 'high' && (
                    <>
                      <p className="text-xs text-orange-700">• Urgent follow-up needed</p>
                      <p className="text-xs text-orange-700">• Review medication</p>
                    </>
                  )}
                  {riskAssessment.level === 'moderate' && (
                    <>
                      <p className="text-xs text-yellow-700">• Lifestyle modifications</p>
                      <p className="text-xs text-yellow-700">• Increase monitoring</p>
                    </>
                  )}
                  {riskAssessment.level === 'low' && (
                    <>
                      <p className="text-xs text-green-700">• Continue current plan</p>
                      <p className="text-xs text-green-700">• Maintain healthy lifestyle</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthRiskAssessmentTab;
