 "use client";

import React from "react";
import { AlertTriangle, Shield, HeartPulse, Activity, Clock, CheckCircle } from "lucide-react";

interface VitalsData {
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  createdAt?: string | Date;
}

interface HypertensionRiskAssessmentProps {
  vitals: VitalsData[];
}

const HypertensionRiskAssessment: React.FC<HypertensionRiskAssessmentProps> = ({ vitals }) => {
  if (!vitals || vitals.length === 0) {
    return (
      <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Health Risk Assessment</h3>
            <p className="text-sm text-gray-500">Risk evaluation requires recent vitals</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          <Clock className="w-5 h-5 mr-2 text-gray-400" />
          No blood pressure readings yet. Add a vital to see risk level.
        </div>
      </div>
    );
  }

  const latest = [...vitals].sort((a, b) => {
    const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bd - ad;
  })[0];

  const systolic = latest.systolic ?? 0;
  const diastolic = latest.diastolic ?? 0;
  const heartRate = latest.heartRate ?? 0;

  let riskScore = 0;
  const factors: string[] = [];

  if (systolic && diastolic) {
    if (systolic >= 180 || diastolic >= 120) {
      riskScore += 30;
      factors.push("Hypertensive crisis range");
    } else if (systolic >= 160 || diastolic >= 100) {
      riskScore += 20;
      factors.push("Stage 2 hypertension range");
    } else if (systolic >= 140 || diastolic >= 90) {
      riskScore += 15;
      factors.push("Stage 1 hypertension range");
    } else if (systolic >= 130 || diastolic >= 85) {
      riskScore += 10;
      factors.push("Elevated blood pressure");
    }

    const pulsePressure = systolic - diastolic;
    if (pulsePressure > 60) {
      riskScore += 10;
      factors.push("Wide pulse pressure");
    }
  }

  if (heartRate) {
    if (heartRate > 100) {
      riskScore += 10;
      factors.push("Fast heart rate (tachycardia)");
    } else if (heartRate < 60) {
      riskScore += 5;
      factors.push("Slow heart rate (bradycardia)");
    }
  }

  let level: "low" | "moderate" | "high" | "critical" = "low";
  if (riskScore > 45) level = "critical";
  else if (riskScore > 30) level = "high";
  else if (riskScore > 15) level = "moderate";

  const getRiskColor = () => {
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

  const getRiskIcon = () => {
    switch (level) {
      case "critical":
      case "high":
      case "moderate":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const recommendations: string[] = [];
  if (level === "critical") {
    recommendations.push("Seek urgent medical attention immediately.");
    recommendations.push("Avoid physical exertion and follow your doctor's emergency plan.");
  } else if (level === "high") {
    recommendations.push("Book a follow-up appointment with your doctor as soon as possible.");
    recommendations.push("Review medication adherence and limit salt, alcohol, and stress.");
  } else if (level === "moderate") {
    recommendations.push("Monitor your blood pressure regularly this week.");
    recommendations.push("Focus on lifestyle changes: low-salt diet, exercise, and stress control.");
  } else {
    recommendations.push("Keep up your current routine and continue regular monitoring.");
  }

  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Health Risk Assessment</h3>
          <p className="text-sm text-gray-500">Summary based on your latest vitals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-2 mb-2">
            <HeartPulse className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-800">Latest BP</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {systolic}/{diastolic} <span className="text-sm font-normal text-gray-600">mmHg</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-100">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-gray-800">Heart Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {heartRate || "--"} <span className="text-sm font-normal text-gray-600">bpm</span>
          </p>
        </div>

        <div className={`p-4 rounded-lg border-2 ${getRiskColor()}`}>
          <div className="flex items-center space-x-2 mb-2">
            {getRiskIcon()}
            <span className="text-sm font-medium">Risk Level</span>
          </div>
          <p className="text-lg font-semibold capitalize">{level}</p>
          <p className="text-xs mt-1 text-gray-700">Score: {riskScore}/100</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Key Factors</h4>
          {factors.length === 0 ? (
            <p className="text-sm text-gray-600">No major risk factors detected from your latest reading.</p>
          ) : (
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {factors.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Suggested Next Steps</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {recommendations.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HypertensionRiskAssessment;


