import React from 'react';
import { 
  TrendingUp, Clock, Activity, HeartPulse, User,
  AlertTriangle, Shield, CheckCircle 
} from 'lucide-react';
import { useTranslation } from "../../../../lib/hypertension/useTranslation";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Patient {
  id: string;
  userId?: string;
  fullName: string;
  age: number;
  gender: string;
  condition: "hypertension" | "diabetes" | "both";
}

// Update interface to match your MongoDB model
interface VitalSigns {
  id?: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  createdAt: Date | string;  // Changed from timestamp to createdAt
  userId: string;
  patientId?: string;
  activityType?: string;
  duration?: number;
  intensity?: string;
  timeSinceActivity?: number;
  notes?: string;
}

interface HealthTrendsAndRiskTabProps {
  patient: Patient;
  patientVitals: VitalSigns[];
}

const HealthTrendsAndRiskTab: React.FC<HealthTrendsAndRiskTabProps> = ({
  patient,
  patientVitals
}) => {
  const { t, language } = useTranslation();
  // If no vitals at all, show empty state
  if (!patientVitals || patientVitals.length === 0) {
    return (
      <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {language === "sw-TZ" ? "Mienendo ya Afya & Tathmini ya Hatari" : "Health Trends & Risk Assessment"}
            </h3>
            <p className="text-sm text-gray-500">
              {language === "sw-TZ" ? "Uchambuzi wa kina wa afya na tathmini ya hatari" : "Comprehensive health analysis and risk evaluation"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          <Clock className="w-5 h-5 mr-2 text-gray-400" />
          {language === "sw-TZ" ? "Hakuna data ya vitals inayopatikana. Ongeza vitals ili uone uchambuzi na tathmini ya hatari." : "No vitals data available. Add vitals to see analysis and risk assessment."}
        </div>
      </div>
    );
  }

  // Debug: Check what data we have
  console.log('=== HealthTrendsAndRiskTab Debug ===');
  console.log('Total vitals:', patientVitals.length);
  console.log('First vital:', patientVitals[0]);
  console.log('createdAt type:', typeof patientVitals[0]?.createdAt);
  console.log('createdAt value:', patientVitals[0]?.createdAt);

  // Process vitals - handle both Date objects and string dates
  const processedVitals = patientVitals.map(vital => {
    // Convert createdAt to Date object if it's a string
    let date: Date;
    if (vital.createdAt instanceof Date) {
      date = vital.createdAt;
    } else if (typeof vital.createdAt === 'string') {
      date = new Date(vital.createdAt);
    } else {
      date = new Date(); // Fallback
    }
    
    return {
      ...vital,
      parsedDate: date
    };
  });

  // Sort by date
  const sortedVitals = [...processedVitals].sort((a, b) => 
    a.parsedDate.getTime() - b.parsedDate.getTime()
  );

  // Get latest vitals
  const latest = sortedVitals.length > 0 ? sortedVitals[sortedVitals.length - 1] : null;
  
  const systolic = latest?.systolic ?? 0;
  const diastolic = latest?.diastolic ?? 0;
  const heartRate = latest?.heartRate ?? 0;

  console.log('Latest values:', { systolic, diastolic, heartRate });

  // RISK CALCULATION for current data
  let currentRiskScore = 0;
  const currentRiskFactors: string[] = [];

  if (systolic && diastolic) {
    if (systolic >= 180 || diastolic >= 120) {
      currentRiskScore += 30;
      currentRiskFactors.push(language === "sw-TZ" ? "Kiwango cha krisi ya shinikizo" : "Hypertensive crisis range");
    } else if (systolic >= 160 || diastolic >= 100) {
      currentRiskScore += 20;
      currentRiskFactors.push(language === "sw-TZ" ? "Kiwango cha pili cha shinikizo" : "Stage 2 hypertension range");
    } else if (systolic >= 140 || diastolic >= 90) {
      currentRiskScore += 15;
      currentRiskFactors.push(language === "sw-TZ" ? "Kiwango cha kwanza cha shinikizo" : "Stage 1 hypertension range");
    } else if (systolic >= 130 || diastolic >= 85) {
      currentRiskScore += 10;
      currentRiskFactors.push(language === "sw-TZ" ? "Shinikizo limeongezeka" : "Elevated blood pressure");
    }

    const pulsePressure = systolic - diastolic;
    if (pulsePressure > 60) {
      currentRiskScore += 10;
      currentRiskFactors.push(language === "sw-TZ" ? "Mwendo mkubwa wa shinikizo" : "Wide pulse pressure");
    }
  }

  if (heartRate) {
    if (heartRate > 100) {
      currentRiskScore += 10;
      currentRiskFactors.push(language === "sw-TZ" ? "Mapigo ya moyo yanapanda (tachycardia)" : "Fast heart rate (tachycardia)");
    } else if (heartRate < 60) {
      currentRiskScore += 5;
      currentRiskFactors.push(language === "sw-TZ" ? "Mapigo ya moyo yanapungua (bradycardia)" : "Slow heart rate (bradycardia)");
    }
  }

  // Calculate risk level for current data
  const getRiskLevel = (score: number) => {
    if (score >= 46) return "critical";
    if (score >= 31) return "high";
    if (score >= 16) return "moderate";
    return "low";
  };

  const currentRiskLevel = getRiskLevel(currentRiskScore);

  console.log('Current risk:', { currentRiskScore, currentRiskLevel, currentRiskFactors });

  // Calculate risk for ALL historical data
  const historicalRiskData = sortedVitals.map(vital => {
    let score = 0;
    const factors: string[] = [];
    
    if (vital.systolic && vital.diastolic) {
      if (vital.systolic >= 180 || vital.diastolic >= 120) {
        score += 30;
        factors.push("Hypertensive crisis");
      } else if (vital.systolic >= 160 || vital.diastolic >= 100) {
        score += 20;
        factors.push("Stage 2 hypertension");
      } else if (vital.systolic >= 140 || vital.diastolic >= 90) {
        score += 15;
        factors.push("Stage 1 hypertension");
      } else if (vital.systolic >= 130 || vital.diastolic >= 85) {
        score += 10;
        factors.push("Elevated BP");
      }

      const pulsePressure = vital.systolic - vital.diastolic;
      if (pulsePressure > 60) {
        score += 10;
        factors.push("Wide pulse pressure");
      }
    }

    if (vital.heartRate) {
      if (vital.heartRate > 100) {
        score += 10;
        factors.push("Tachycardia");
      } else if (vital.heartRate < 60) {
        score += 5;
        factors.push("Bradycardia");
      }
    }

    return {
      date: vital.parsedDate,
      score,
      level: getRiskLevel(score),
      factors
    };
  });

  console.log('Historical risk data:', historicalRiskData);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 border-red-500 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-500 text-orange-800";
      case "moderate":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      default:
        return "bg-green-100 border-green-500 text-green-800";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical":
      case "high":
      case "moderate":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  // Analyze hypertension trend
  const analyzeHypertensionTrend = () => {
    const bpVitals = sortedVitals.filter(v => v.systolic && v.diastolic);
    
    if (bpVitals.length < 2) {
      return { trend: 'insufficient_data', direction: 'N/A', change: 0 };
    }

    const earliest = bpVitals[0];
    const latestBP = bpVitals[bpVitals.length - 1];
    
    const systolicChange = latestBP && latestBP.systolic && earliest && earliest.systolic ? 
      latestBP.systolic - earliest.systolic : 0;
    const diastolicChange = latestBP && latestBP.diastolic && earliest && earliest.diastolic ? 
      latestBP.diastolic - earliest.diastolic : 0;
    const avgChange = (systolicChange + diastolicChange) / 2;

    let trend: 'improving' | 'worsening' | 'stable' | 'insufficient_data' = 'stable';
    let direction = '';
    
    if (avgChange < -5) {
      trend = 'improving';
      direction = language === "sw-TZ" ? "Inapungua" : "Decreasing";
    } else if (avgChange > 5) {
      trend = 'worsening';
      direction = language === "sw-TZ" ? "Inaongezeka" : "Increasing";
    } else {
      trend = 'stable';
      direction = language === "sw-TZ" ? "Imeyakaa" : "Stable";
    }

    return { trend, direction, change: avgChange };
  };

  const hypertensionTrend = analyzeHypertensionTrend();

  // Calculate averages
  const calculateAverages = () => {
    const bpReadings = sortedVitals.filter(v => v.systolic && v.diastolic);
    const hrReadings = sortedVitals.filter(v => v.heartRate);

    return {
      avgSystolic: bpReadings.length > 0 
        ? bpReadings.reduce((sum, v) => sum + v.systolic, 0) / bpReadings.length 
        : null,
      avgDiastolic: bpReadings.length > 0 
        ? bpReadings.reduce((sum, v) => sum + v.diastolic, 0) / bpReadings.length 
        : null,
      avgHeartRate: hrReadings.length > 0 
        ? hrReadings.reduce((sum, v) => sum + v.heartRate, 0) / hrReadings.length 
        : null,
    };
  };

  const averages = calculateAverages();

  // Prepare chart data - FIXED DATE FORMAT
  const chartData = sortedVitals.map((vital) => {
    const dateStr = vital.parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
    
    // Calculate risk for this specific reading
    const risk = historicalRiskData.find(r => 
      r.date.getTime() === vital.parsedDate.getTime()
    );
    
    return {
      date: dateStr,
      fullDate: vital.parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      systolic: vital.systolic,
      diastolic: vital.diastolic,
      heartRate: vital.heartRate,
      riskLevel: risk?.level || 'low',
      riskScore: risk?.score || 0,
    };
  });

  console.log('Chart data:', chartData);

  // Filter data for each chart
  const bpChartData = chartData.filter(d => d.systolic && d.diastolic);
  const hrChartData = chartData.filter(d => d.heartRate);
  const riskChartData = chartData;

  // Get recommendations for current risk level
  const getRecommendations = () => {
    const recommendations: string[] = [];
    
    if (currentRiskLevel === "critical") {
      recommendations.push(language === "sw-TZ" ? "Tafuta matibabu ya haraka mara moja." : "Seek urgent medical attention immediately.");
      recommendations.push(language === "sw-TZ" ? "Epuka mazoezi na ufuata mpango wa daktari wako wa kuumwa." : "Avoid physical exertion and follow your doctor's emergency plan.");
    } else if (currentRiskLevel === "high") {
      recommendations.push(language === "sw-TZ" ? "Fanya mkusanyiko wa kufuatilia na daktari wako haraka iwezekanavyo." : "Book a follow-up appointment with your doctor as soon as possible.");
      recommendations.push(language === "sw-TZ" ? "Chunguza kufuata dawa na upeleki chumvi, pombe, na msongo." : "Review medication adherence and limit salt, alcohol, and stress.");
    } else if (currentRiskLevel === "moderate") {
      recommendations.push(language === "sw-TZ" ? "Fuata shinikizo lako la damu kila wiki." : "Monitor your blood pressure regularly this week.");
      recommendations.push(language === "sw-TZ" ? "Linganisha mabadiliko ya maisha: chakula bila chumvi, mazoezi, na udhibiti wa msongo." : "Focus on lifestyle changes: low-salt diet, exercise, and stress control.");
    } else {
      recommendations.push(language === "sw-TZ" ? "Endelea na rutina yako sasa na uendelea kufuatilia kila siku." : "Keep up your current routine and continue regular monitoring.");
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      <div data-content="trends" className="space-y-4">
          {/* Header */}
          <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === "sw-TZ" ? "Mienendo ya Afya & Tathmini ya Hatari" : "Health Trends & Risk Assessment"}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === "sw-TZ" ? "Muhtasari kulingana na vitals vya mgonjwa" : "Summary based on patient vitals"}
                </p>
              </div>
            </div>

            {/* PATIENT PROFILE SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-3 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{patient.fullName}</h4>
                    <p className="text-xs text-gray-600">{patient.age} {language === "sw-TZ" ? "miaka •" : "years •"} {patient.gender}</p>
                  </div>
                </div>
                <p className="text-xs font-medium text-blue-600 capitalize">{patient.condition}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {sortedVitals.length} {language === "sw-TZ" ? "kisomaji" : "reading"}{sortedVitals.length !== 1 ? 's' : ''} {language === "sw-TZ" ? "jumla" : "total"}
                </p>
              </div>

            {/* Latest BP Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-2 mb-2">
                  <HeartPulse className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {language === "sw-TZ" ? "BP ya Hivi Karibuni" : "Latest BP"}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {systolic || '--'}/{diastolic || '--'} <span className="text-sm font-normal text-gray-600">mmHg</span>
                </p>
                {averages.avgSystolic !== null && averages.avgDiastolic !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "sw-TZ" ? "Wastani:" : "Avg:"} {averages.avgSystolic.toFixed(0)}/{averages.avgDiastolic.toFixed(0)} mmHg
                  </p>
                )}
                {latest?.activityType && (
                  <p className="text-xs text-blue-600 mt-1">
                    {language === "sw-TZ" ? "Shughuli:" : "Activity:"} {latest.activityType}
                  </p>
                )}
            </div>

            {/* Latest Heart Rate Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {language === "sw-TZ" ? "Mapigo ya Moyo" : "Heart Rate"}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {heartRate || '--'} <span className="text-sm font-normal text-gray-600">bpm</span>
                </p>
                {averages.avgHeartRate !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "sw-TZ" ? "Wastani:" : "Avg:"} {averages.avgHeartRate.toFixed(0)} bpm
                  </p>
                )}
                {!heartRate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "sw-TZ" ? "Hakuna kisomaji cha mapigo ya moyo" : "No heart rate readings"}
                  </p>
                )}
            </div>
          </div>

          {/* HYPERTENSION TREND ANALYSIS */}
          {hypertensionTrend.trend !== 'insufficient_data' ? (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-semibold text-gray-900">
                    {language === "sw-TZ" ? "Uchambuzi wa Mienendo ya Shinikizo" : "Hypertension Trend Analysis"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {language === "sw-TZ" ? "Mwelekeo:" : "Trend:"} <span className={`font-semibold ${
                      hypertensionTrend.trend === 'improving' ? 'text-green-600' :
                      hypertensionTrend.trend === 'worsening' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {hypertensionTrend.direction}
                    </span>
                    {Math.abs(hypertensionTrend.change) > 0 && (
                      <span className="ml-2">
                        ({language === "sw-TZ" ? "Mabadiliko ya BP:" : "Avg BP change:"} {hypertensionTrend.change > 0 ? '+' : ''}{hypertensionTrend.change.toFixed(1)} mmHg)
                      </span>
                    )}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  hypertensionTrend.trend === 'improving' ? 'bg-green-100 text-green-800' :
                  hypertensionTrend.trend === 'worsening' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {hypertensionTrend.trend === 'improving' ? '✓ ' + (language === "sw-TZ" ? "Inaboresha" : "Improving") :
                   hypertensionTrend.trend === 'worsening' ? '⚠ ' + (language === "sw-TZ" ? "Inaovota" : "Worsening") :
                   '➔ ' + (language === "sw-TZ" ? "Imeyakaa" : "Stable")}
                </div>
              </div>
            </div>
          ) : bpChartData.length > 0 ? (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-md font-semibold text-gray-900">
                    {language === "sw-TZ" ? "Uchambuzi wa Mienendo ya Shinikizo" : "Hypertension Trend Analysis"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {bpChartData.length === 1 
                      ? (language === "sw-TZ" ? "Hitaji kisomaji kimoja cha shinikizo cha damu kwa ajili ya uchambuzi wa mienendo." : "Need at least 2 blood pressure readings for trend analysis.")
                      : (language === "sw-TZ" ? "Data ya BP si kibaya kwa ajili ya uchambuzi wa mienendo." : "Insufficient BP data for trend analysis.")}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  📊 {bpChartData.length === 1 ? "1 " + (language === "sw-TZ" ? "Kisomaji" : "Reading") : (language === "sw-TZ" ? "Si Kibaya" : "Insufficient")}
                </div>
              </div>
            </div>
          ) : null}

          {/* CURRENT RISK ASSESSMENT */}
          <div className={`p-4 rounded-lg border-2 ${getRiskColor(currentRiskLevel)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getRiskIcon(currentRiskLevel)}
                <span className="text-sm font-medium">
                  {language === "sw-TZ" ? "Kiwango cha Sasa cha Hatari" : "Current Risk Level"}
                </span>
              </div>
              <span className="text-xs text-gray-600">
                {latest?.parsedDate ? `${language === "sw-TZ" ? "Tangu" : "As of"} ${latest.parsedDate.toLocaleDateString()}` : (language === "sw-TZ" ? "Kisomaji kizima" : "Latest reading")}
              </span>
            </div>
            <p className="text-lg font-semibold capitalize">{language === "sw-TZ" ? currentRiskLevel === "critical" ? "Hatari Kuu" : currentRiskLevel === "high" ? "Hatari Kikubwa" : currentRiskLevel === "moderate" ? "Hatari Kikubwa" : "Hatari Ndogo" : currentRiskLevel}</p>
            <p className="text-xs mt-1 text-gray-700">{language === "sw-TZ" ? "Alama:" : "Score:"} {currentRiskScore}/100</p>
            {currentRiskScore === 0 && (
              <p className="text-xs text-green-600 mt-1">✓ {language === "sw-TZ" ? "Hakuna sababu za hatari kubwa zilizogunduliwa" : "No significant risk factors detected"}</p>
            )}
          </div>
        </div>

          {/* CHARTS SECTION */}
        <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            {language === "sw-TZ" ? "Mienendo ya Data ya Afya" : "Health Data Trends"}
          </h4>

          {/* Blood Pressure Chart - Full Width, Above Heart Rate */}
          {bpChartData.length > 0 ? (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <HeartPulse className="w-5 h-5 text-red-500" />
                  <h5 className="font-medium text-gray-900">
                    {language === "sw-TZ" ? "Mienendo ya Shinikizo la Damu" : "Blood Pressure Trends"}
                  </h5>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {language === "sw-TZ" ? "Systolic" : "Systolic"}
                  </span>
                  <div className="w-3 h-3 bg-blue-500 rounded-full ml-2"></div>
                  <span className="text-xs text-gray-600">
                    {language === "sw-TZ" ? "Diastolic" : "Diastolic"}
                  </span>
                </div>
              </div>

              {/* Blood Pressure Information Panel */}
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <h6 className="text-sm font-semibold text-gray-800 mb-2">
                  {language === "sw-TZ" ? "Miongozo ya Shinikizo la Damu" : "Blood Pressure Guidelines"}
                </h6>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>{language === "sw-TZ" ? "Kawaida:" : "Normal:"} {"<"}120/{"<"}80</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span>{language === "sw-TZ" ? "Imeongezeka:" : "Elevated:"} 120-129/{"<"}80</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    <span>{language === "sw-TZ" ? "Kiwango 1:" : "Stage 1:"} 130-139/80-89</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span>{language === "sw-TZ" ? "Kiwango 2:" : "Stage 2:"} {"≥"}140/{"≥"}90</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span>{language === "sw-TZ" ? "Krisi:" : "Crisis:"} {"≥"}180/{"≥"}120</span>
                  </div>
                </div>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={bpChartData}>
                    <defs>
                      <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                      stroke="#6b7280"
                    />
                    <YAxis domain={[60, 180]} fontSize={12} stroke="#6b7280" />
                    <Tooltip
                      labelFormatter={(value, payload) => {
                        const data = payload && payload[0]?.payload;
                        return data?.fullDate || `Date: ${value}`;
                      }}
                      formatter={(value, name) => [`${value} mmHg`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      stroke="#dc2626"
                      strokeWidth={3}
                      name="Systolic"
                      dot={{ fill: '#dc2626', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: '#dc2626' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      stroke="#2563eb"
                      strokeWidth={3}
                      name="Diastolic"
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: '#2563eb' }}
                    />
                    {/* Single Middle Threshold Line at 120/80 */}
                    <Line
                      type="monotone"
                      dataKey={() => 120}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Normal Threshold (120/80)"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend and Information */}
              <div className="mt-3">
                <div className="flex justify-center space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    <span>{language === "sw-TZ" ? "Systolic" : "Systolic"}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                    <span>{language === "sw-TZ" ? "Diastolic" : "Diastolic"}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-1 border-t-2 border-yellow-500 mr-1" style={{borderStyle: 'dashed'}}></div>
                    <span>{language === "sw-TZ" ? "Kiwango cha Kawaida (120/80)" : "Normal Threshold (120/80)"}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {language === "sw-TZ" ? "Inaonyesha" : "Showing"} {bpChartData.length} {language === "sw-TZ" ? "kisomaji" : "blood pressure reading"}{bpChartData.length !== 1 ? 's' : ''} {language === "sw-TZ" ? "kizima" : ""}
                </p>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {language === "sw-TZ" ? "BP ya Kawaida:" : "Normal BP:"} {"<"}120/{"<"}80 | {language === "sw-TZ" ? "Imeongezeka:" : "Elevated:"} 120-129/{"<"}80 | {language === "sw-TZ" ? "Kiwango 1:" : "Stage 1:"} 130-139/80-89 | {language === "sw-TZ" ? "Kiwango 2:" : "Stage 2:"} {"≥"}140/{"≥"}90 | {language === "sw-TZ" ? "Krisi:" : "Crisis:"} {"≥"}180/{"≥"}120
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <HeartPulse className="w-5 h-5 text-gray-400" />
                <h5 className="font-medium text-gray-900">Blood Pressure Trends</h5>
              </div>
              <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                <Clock className="w-5 h-5 mr-2" />
                No blood pressure data available for chart
              </div>
            </div>
          )}

          {/* Heart Rate Chart - Now below Blood Pressure */}
          {hrChartData.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-5 h-5 text-orange-500" />
                <h5 className="font-medium text-gray-900">
                  {language === "sw-TZ" ? "Mienendo ya Mapigo ya Moyo" : "Heart Rate Trends"}
                </h5>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={hrChartData}>
                    <defs>
                      <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                      stroke="#6b7280"
                    />
                    <YAxis domain={[50, 120]} fontSize={12} stroke="#6b7280" />
                    <Tooltip
                      labelFormatter={(value, payload) => {
                        const data = payload && payload[0]?.payload;
                        return data?.fullDate || `Date: ${value}`;
                      }}
                      formatter={(value, name) => [`${value} BPM`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#ea580c"
                      strokeWidth={3}
                      name={language === "sw-TZ" ? "Mapigo ya Moyo" : "Heart Rate"}
                      dot={{ fill: '#ea580c', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: '#ea580c' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {language === "sw-TZ" ? "Inaonyesha" : "Showing"} {hrChartData.length} {language === "sw-TZ" ? "kisomaji" : "heart rate reading"}{hrChartData.length !== 1 ? 's' : ''} {language === "sw-TZ" ? "kizima" : ""}
              </p>
            </div>
          )}

          {/* Risk Level Over Time Chart */}
          {riskChartData.length > 0 && (
            <div className="mt-8 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h5 className="font-medium text-gray-900">
                  {language === "sw-TZ" ? "Kiwango cha Hatari Kupita Muda" : "Risk Level Over Time"}
                </h5>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={riskChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      fontSize={12}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      fontSize={12}
                      stroke="#6b7280"
                      label={{ value: language === "sw-TZ" ? 'Alama ya Hatari' : 'Risk Score', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      labelFormatter={(value, payload) => {
                        const data = payload && payload[0]?.payload;
                        return data?.fullDate || `Date: ${value}`;
                      }}
                      formatter={(value, name) => {
                        if (name === 'riskScore') return [`${value}/100`, language === "sw-TZ" ? 'Alama ya Hatari' : 'Risk Score'];
                        if (name === 'riskLevel') return [value, language === "sw-TZ" ? 'Kiwango cha Hatari' : 'Risk Level'];
                        return [value, name];
                      }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="riskScore" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name={language === "sw-TZ" ? "Alama ya Hatari" : "Risk Score"}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#8b5cf6' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center space-x-4 mt-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                  <span>{language === "sw-TZ" ? "Ndogo (0-15)" : "Low (0-15)"}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                  <span>{language === "sw-TZ" ? "Wastani (16-30)" : "Moderate (16-30)"}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                  <span>{language === "sw-TZ" ? "Kubwa (31-45)" : "High (31-45)"}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  <span>{language === "sw-TZ" ? "Kuu (46+)" : "Critical (46+)"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RISK ASSESSMENT DETAILS */}
        <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              {language === "sw-TZ" ? "Maelezo ya Tathmini ya Hatari" : "Risk Assessment Details"}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-gray-800 mb-3">
                {language === "sw-TZ" ? "Sababu za Hatari Sasa" : "Current Risk Factors"}
              </h5>
              {currentRiskFactors.length === 0 ? (
                <p className="text-sm text-gray-600">
                  {language === "sw-TZ" ? "Hakuna sababu kubwa za hatari zilizogunduliwa kutoka kisomaji kizima." : "No major risk factors detected from latest reading."}
                </p>
              ) : (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {currentRiskFactors.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <h6 className="text-xs font-semibold text-gray-700 mb-2">
                  {language === "sw-TZ" ? "Muhtasari wa Hatari wa Kale" : "Historical Risk Summary"}
                </h6>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>{language === "sw-TZ" ? "Alama ya Juu ya Hatari:" : "Highest Risk Score:"}</span>
                    <span className="font-medium">{Math.max(...historicalRiskData.map(r => r.score))}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === "sw-TZ" ? "Alama ya Wastani ya Hatari:" : "Average Risk Score:"}</span>
                    <span className="font-medium">
                      {(historicalRiskData.reduce((sum, r) => sum + r.score, 0) / historicalRiskData.length).toFixed(1)}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === "sw-TZ" ? "Jumla ya Kisomaji:" : "Total Readings:"}</span>
                    <span className="font-medium">{historicalRiskData.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100">
              <h5 className="text-sm font-semibold text-gray-800 mb-3">
                {language === "sw-TZ" ? "Hatua Zinazopendekezwa" : "Suggested Next Steps"}
              </h5>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {recommendations.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <h6 className="text-xs font-semibold text-blue-800 mb-1">
                  {language === "sw-TZ" ? "Mapendekezo ya Kufuatilia" : "Monitoring Recommendations"}
                </h6>
                <p className="text-xs text-blue-700">
                  {currentRiskLevel === 'critical' || currentRiskLevel === 'high' 
                    ? (language === "sw-TZ" ? "Fikiria kufuatilia kila siku mpaka kiwango cha hatari kiboreshwe." : "Consider daily monitoring until risk level improves.")
                    : (language === "sw-TZ" ? "Endelea na kufuatilia kila wiki." : "Continue with regular weekly monitoring.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthTrendsAndRiskTab;