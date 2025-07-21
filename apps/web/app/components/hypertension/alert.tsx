"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";

type StatusData = {
  systolic: number;
  diastolic: number;
  heartRate: number;
  age: number;
  status: "alert" | "stable";
};

export default function HypertensionAlert() {
  const { data: session } = useSession();
  const [statusData, setStatusData] = useState<StatusData | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!session?.user?.id) return;

      const res = await fetch(`http://localhost:3001/api/hypertensionStatus/${session.user.id}`);
      const data = await res.json();
      setStatusData(data);
    };

    fetchStatus();
  }, [session]);

  if (!statusData) {
    return (
      <div className="bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 flex items-center justify-center min-h-[120px]">
        <span className="text-gray-500 text-sm">Loading health alert...</span>
      </div>
    );
  }

  // If any vital is missing or not a number, show a friendly message
  if (
    typeof statusData.systolic !== 'number' ||
    typeof statusData.diastolic !== 'number' ||
    typeof statusData.heartRate !== 'number' ||
    isNaN(statusData.systolic) ||
    isNaN(statusData.diastolic) ||
    isNaN(statusData.heartRate)
  ) {
    return (
      <div className="bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 flex items-center justify-center min-h-[120px]">
        <span className="text-gray-500 text-sm">No blood pressure data available. Please enter your vitals.</span>
      </div>
    );
  }

  // Utility to determine BP category
  function getBloodPressureCategory(systolic: number, diastolic: number) {
    if (systolic < 90 || diastolic < 60) {
      return { level: 'Low Blood Pressure', color: 'bg-blue-50 border-blue-600', text: 'text-blue-700', title: 'Low Blood Pressure', icon: <TriangleAlert color="#2563eb" size={20} />, button: false };
    } else if (systolic < 120 && diastolic < 80) {
      return { level: 'Normal', color: 'bg-green-50 border-green-600', text: 'text-green-700', title: 'Vitals Normal', icon: <CheckCircle color="#16a34a" size={20} />, button: false };
    } else if (systolic < 130 && diastolic < 80) {
      return { level: 'Elevated', color: 'bg-yellow-50 border-yellow-600', text: 'text-yellow-700', title: 'Elevated Blood Pressure', icon: <TriangleAlert color="#eab308" size={20} />, button: false };
    } else if ((systolic < 140 && diastolic < 90) || (systolic >= 130 && systolic < 140)) {
      return { level: 'Stage 1 Hypertension', color: 'bg-orange-50 border-orange-600', text: 'text-orange-700', title: 'Stage 1 Hypertension', icon: <TriangleAlert color="#ea580c" size={20} />, button: true };
    } else if ((systolic < 180 && diastolic < 120) || (systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) {
      return { level: 'Stage 2 Hypertension', color: 'bg-red-50 border-red-600', text: 'text-red-700', title: 'Stage 2 Hypertension', icon: <TriangleAlert color="#dc2626" size={20} />, button: true };
    } else if (systolic >= 180 || diastolic >= 120) {
      return { level: 'Hypertensive Crisis', color: 'bg-red-100 border-red-800', text: 'text-red-800', title: 'Hypertensive Crisis', icon: <TriangleAlert color="#b91c1c" size={20} />, button: true };
    } else {
      return { level: 'Unknown', color: 'bg-gray-50 border-gray-400', text: 'text-gray-700', title: 'Unknown', icon: <TriangleAlert color="#6b7280" size={20} />, button: false };
    }
  }

  function getHeartRateAlert(heartRate: number) {
    if (heartRate < 60) {
      return { message: 'Bradycardia (Low Heart Rate)', color: 'text-blue-700' };
    } else if (heartRate > 100) {
      return { message: 'Tachycardia (High Heart Rate)', color: 'text-red-700' };
    } else {
      return null;
    }
  }

  const bpCategory = getBloodPressureCategory(statusData.systolic, statusData.diastolic);
  const heartRateAlert = getHeartRateAlert(statusData.heartRate);

  return (
    <div className={`bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 border-l-4 ${bpCategory.color}`}>
      <div className="flex items-center gap-2 mb-2">
        {bpCategory.icon}
        <h3 className={`text-lg font-bold ${bpCategory.text}`}>{bpCategory.title}</h3>
      </div>
      <p className={`text-sm ${bpCategory.text} mb-4`}>
        {(() => {
          switch (bpCategory.level) {
            case 'Normal':
              return 'Your blood pressure is within the normal range.';
            case 'Elevated':
              return 'Your blood pressure is slightly elevated. Consider lifestyle changes.';
            case 'Stage 1 Hypertension':
              return 'You are in Stage 1 Hypertension. Please monitor your blood pressure and consult your doctor if this persists.';
            case 'Stage 2 Hypertension':
              return 'You are in Stage 2 Hypertension. It is recommended to consult your doctor soon.';
            case 'Hypertensive Crisis':
              return 'Hypertensive Crisis! Seek immediate medical attention.';
            case 'Low Blood Pressure':
              return 'Your blood pressure is low. If you feel unwell, contact your healthcare provider.';
            default:
              return 'Unable to determine blood pressure status.';
          }
        })()}
      </p>
      {heartRateAlert && (
        <p className={`text-sm font-semibold mb-2 ${heartRateAlert.color}`}>{heartRateAlert.message}</p>
      )}
      <div className="text-sm mb-2">
        <p><strong>Systolic:</strong> {statusData.systolic} mmHg</p>
        <p><strong>Diastolic:</strong> {statusData.diastolic} mmHg</p>
        <p><strong>Heart Rate:</strong> {statusData.heartRate} bpm</p>
        <p><strong>Age:</strong> {statusData.age} years</p>
      </div>
      {bpCategory.button && (
        <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
          Find Doctor Nearby
        </button>
      )}
    </div>
  );
}
