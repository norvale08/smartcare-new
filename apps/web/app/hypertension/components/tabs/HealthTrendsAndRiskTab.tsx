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

  // Get latest vitals for risk assessment
  const getLatestVitals = (vitals: VitalSigns[]): VitalSigns | null => {
    if (!vitals || vitals.length === 0) return null;
    
    const sorted = [...vitals].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0] || null;
  };

  const latestVitals = getLatestVitals(patientVitalsFiltered);

  // Trend analysis functions
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

  // Risk assessment functions
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
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Health Trends & Risk Assessment</h3>
            <p className="text-sm text-gray-500">Comprehensive health analysis and risk evaluation</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Health Trends & Risk Assessment</h3>
            <p className="text-sm text-gray-500">Comprehensive health analysis and risk evaluation</p>
          </div>
        </div>

        {/* Patient Profile Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
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
                <span>Latest: {latestVitals ? new Date(latestVitals.timestamp).toLocaleDateString() : 'N/A'}</span>
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
      </div>

      {/* Interactive Charts Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Health Data Trends with Charts</h4>
        
        <div className="space-y-8">
          {/* Blood Pressure Chart */}
          {(patient.condition === 'hypertension' || patient.condition === 'both') && chartData.filter(d => d.systolic && d.diastolic).length > 0 && (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <HeartPulse className="w-5 h-5 text-red-500" />
                  <h5 className="text-lg font-medium text-gray-900">Blood Pressure Trends</h5>
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
                    <h6 className="text-sm font-medium text-gray-900 mb-2">Hypertension Control Status</h6>
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
                    <h6 className="text-sm font-medium text-gray-900 mb-2">Average Readings</h6>
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
                  <h5 className="text-lg font-medium text-gray-900">Heart Rate Trends</h5>
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
                  <h6 className="text-sm font-medium text-gray-900 mb-2">Average Heart Rate</h6>
                  <div className="text-sm text-gray-700">
                    {averages.avgHeartRate ? (
                      <span className="font-medium">{averages.avgHeartRate.toFixed(0)} bpm</span>
                    ) : (
                      <span className="text-gray-500">No data</span>
                    )}
                  </div>
                </div>
                <div>
                  <h6 className="text-sm font-medium text-gray-900 mb-2">Status</h6>
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
                  <h5 className="text-lg font-medium text-gray-900">Glucose Trends</h5>
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
                  <h6 className="text-sm font-medium text-gray-900 mb-2">Average Glucose</h6>
                  <div className="text-sm text-gray-700">
                    {averages.avgGlucose ? (
                      <span className="font-medium">{averages.avgGlucose.toFixed(0)} mg/dL</span>
                    ) : (
                      <span className="text-gray-500">No data</span>
                    )}
                  </div>
                </div>
                <div>
                  <h6 className="text-sm font-medium text-gray-900 mb-2">Status</h6>
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
      </div>

      {/* Risk Trend Visualization */}
      {riskChartData.length > 1 && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <h4 className="text-lg font-semibold text-gray-900">Risk Score Trend</h4>
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

      {/* Risk Assessment Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Risk Assessment</h4>
        
        {/* Risk Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
            <h5 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h5>
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

          {/* Vitals Assessment */}
          {(patient.condition === 'hypertension' || patient.condition === 'both') && latestVitals?.systolic && latestVitals?.diastolic && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border border-red-100">
              <div className="flex items-center space-x-3 mb-4">
                <HeartPulse className="w-6 h-6 text-red-500" />
                <h5 className="font-semibold text-gray-900">Blood Pressure Risk</h5>
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
                <h5 className="font-semibold text-gray-900">Heart Rate Risk</h5>
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
                <h5 className="font-semibold text-gray-900">Glucose Risk</h5>
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

        {/* Recommendations */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-blue-500" />
            <h5 className="text-lg font-semibold text-gray-900">Recommendations</h5>
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

      {/* Enhanced Health Insights Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <LineChart className="w-6 h-6 text-blue-600" />
          <h4 className="text-xl font-semibold text-gray-900">Comprehensive Health Analysis</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Monitoring Frequency</h5>
            <p className="text-2xl font-bold text-blue-600">{(patientVitalsFiltered.length / 4).toFixed(1)}</p>
            <p className="text-xs text-gray-600">readings per week</p>
          </div>
          
          {(patient.condition === 'hypertension' || patient.condition === 'both') && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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

export default HealthTrendsAndRiskTab;
