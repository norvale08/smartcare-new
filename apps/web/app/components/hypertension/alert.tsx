"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, CheckCircle } from "lucide-react";
import { useTranslation } from"../../../lib/hypertension/useTranslation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type StatusData = {
  systolic: number;
  diastolic: number;
  heartRate: number;
  age?: number;
  status: "alert" | "stable";
};

export default function HypertensionAlert({ refreshToken }: { refreshToken?: number }) {
  const { t, language } = useTranslation();
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollToDoctorManagement = () => {
    // Find the doctor management section by its heading or structure
    const doctorSection = document.querySelector('section');
    if (doctorSection) {
      doctorSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    const fetchTodayVitals = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          setError(language === "sw-TZ" 
            ? "Lazima uwe umeingia ili kuona arifa." 
            : "You must be logged in to view alerts.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/hypertensionVitals/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!res.ok) {
          const msg = (await res.json().catch(() => null))?.message || `Failed to load vitals (${res.status})`;
          throw new Error(msg);
        }

        const json = await res.json();
        const vitals = Array.isArray(json?.data) ? json.data : [];

        // Pick latest entry from today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayVitals = vitals
          .filter((v: any) => {
            const t = new Date(v.timestamp || v.createdAt);
            return !isNaN(t.getTime()) && t >= startOfDay;
          })
          .sort((a: any, b: any) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime());

        if (todayVitals.length === 0) {
          setStatusData(null);
          setLoading(false);
          return;
        }

        const latest = todayVitals[0];
        const systolic = Number(latest.systolic);
        const diastolic = Number(latest.diastolic);
        const heartRate = Number(latest.heartRate);
        const age = latest.age ? Number(latest.age) : undefined;

        // Use consistent thresholds with your AI
        const { isHigh, isLow } = getBloodPressureStatus(systolic, diastolic, age);
        const heartRateAlert = heartRate < 60 || heartRate > 100;
        const status: "alert" | "stable" = (isHigh || isLow || heartRateAlert) ? "alert" : "stable";

        setStatusData({ systolic, diastolic, heartRate, age, status });
      } catch (e: any) {
        setError(e?.message || 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchTodayVitals();
  }, [refreshToken]);

  // Consistent blood pressure classification matching your AI
  function getBloodPressureStatus(systolic: number, diastolic: number, age?: number) {
    // Standard AHA guidelines
    let systolicHigh = 140;
    let diastolicHigh = 90;
    let systolicLow = 90;
    let diastolicLow = 60;

    // Age adjustments (optional - match your AI's logic)
    if (age) {
      if (age >= 65) {
        systolicHigh = 150; // More lenient for elderly
      } else if (age <= 18) {
        systolicHigh = 130;
        diastolicHigh = 80;
      }
    }

    const isHigh = systolic >= systolicHigh || diastolic >= diastolicHigh;
    const isLow = systolic <= systolicLow || diastolic <= diastolicLow;

    return { isHigh, isLow, systolicHigh, diastolicHigh, systolicLow, diastolicLow };
  }

  // Updated to match your AI's categorization
  function getBloodPressureCategory(systolic: number, diastolic: number, age?: number) {
    const { systolicHigh, diastolicHigh, systolicLow, diastolicLow } = getBloodPressureStatus(systolic, diastolic, age);

    const isSwahili = language === "sw-TZ";
    
    if (systolic < systolicLow || diastolic < diastolicLow) {
      return { 
        level: isSwahili ? 'Shinikizo la Chini la Damu' : 'Low Blood Pressure', 
        color: 'bg-blue-50 border-blue-600', 
        text: 'text-blue-700', 
        title: isSwahili ? 'Shinikizo la Chini la Damu' : 'Low Blood Pressure', 
        icon: <TriangleAlert color="#2563eb" size={20} />, 
        button: false,
        severity: 'low'
      };
    } else if (systolic < 120 && diastolic < 80) {
      return { 
        level: isSwahili ? 'Kawaida' : 'Normal', 
        color: 'bg-green-50 border-green-600', 
        text: 'text-green-700', 
        title: isSwahili ? 'Shinikizo la Damu la Kawaida' : 'Normal Blood Pressure', 
        icon: <CheckCircle color="#16a34a" size={20} />, 
        button: false,
        severity: 'normal'
      };
    } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
      return { 
        level: isSwahili ? 'Kiwango Cha Juu' : 'Elevated', 
        color: 'bg-yellow-50 border-yellow-600', 
        text: 'text-yellow-700', 
        title: isSwahili ? 'Shinikizo la Damu la Juu' : 'Elevated Blood Pressure', 
        icon: <TriangleAlert color="#eab308" size={20} />, 
        button: false,
        severity: 'elevated'
      };
    } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
      return { 
        level: isSwahili ? 'Hatua ya 1 ya Shinikizo la Juu la Damu' : 'Stage 1 Hypertension', 
        color: 'bg-orange-50 border-orange-600', 
        text: 'text-orange-700', 
        title: isSwahili ? 'Hatua ya 1 ya Shinikizo la Juu la Damu' : 'Stage 1 Hypertension', 
        icon: <TriangleAlert color="#ea580c" size={20} />, 
        button: true,
        severity: 'stage1'
      };
    } else if ((systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) {
      return { 
        level: isSwahili ? 'Hatua ya 2 ya Shinikizo la Juu la Damu' : 'Stage 2 Hypertension', 
        color: 'bg-red-50 border-red-600', 
        text: 'text-red-700', 
        title: isSwahili ? 'Hatua ya 2 ya Shinikizo la Juu la Damu' : 'Stage 2 Hypertension', 
        icon: <TriangleAlert color="#dc2626" size={20} />, 
        button: true,
        severity: 'stage2'
      };
    } else if (systolic >= 180 || diastolic >= 120) {
      return { 
        level: isSwahili ? 'Mgongano wa Shinikizo la Juu la Damu' : 'Hypertensive Crisis', 
        color: 'bg-red-100 border-red-800', 
        text: 'text-red-800', 
        title: isSwahili ? 'Mgongano wa Shinikizo la Juu la Damu' : 'Hypertensive Crisis', 
        icon: <TriangleAlert color="#b91c1c" size={20} />, 
        button: true,
        severity: 'crisis'
      };
    } else {
      // This handles cases like 110/85 - should be normal or elevated, not Stage 1
      if (systolic < 120 && diastolic >= 80 && diastolic < 90) {
        return { 
          level: isSwahili ? 'Kawaida' : 'Normal', 
          color: 'bg-green-50 border-green-600', 
          text: 'text-green-700', 
          title: isSwahili ? 'Shinikizo la Damu la Kawaida' : 'Normal Blood Pressure', 
          icon: <CheckCircle color="#16a34a" size={20} />, 
          button: false,
          severity: 'normal'
        };
      }
      return { 
        level: isSwahili ? 'Haijulikani' : 'Unknown', 
        color: 'bg-gray-50 border-gray-400', 
        text: 'text-gray-700', 
        title: isSwahili ? 'Haijulikani' : 'Unknown', 
        icon: <TriangleAlert color="#6b7280" size={20} />, 
        button: false,
        severity: 'unknown'
      };
    }
  }

  function getHeartRateAlert(heartRate: number, age?: number) {
    let lowThreshold = 60;
    let highThreshold = 100;

    if (age) {
      if (age <= 2) {
        lowThreshold = 80;
        highThreshold = 130;
      } else if (age <= 6) {
        lowThreshold = 70;
        highThreshold = 120;
      } else if (age <= 12) {
        lowThreshold = 60;
        highThreshold = 110;
      } else if (age <= 18) {
        lowThreshold = 55;
        highThreshold = 105;
      }
    }

    if (heartRate < lowThreshold) {
      return { 
        message: language === "sw-TZ" 
          ? `Bradycardia (Kasi ya Chini ya Moyo)` 
          : `Bradycardia (Low Heart Rate)`, 
        color: 'text-blue-700' 
      };
    } else if (heartRate > highThreshold) {
      return { 
        message: language === "sw-TZ" 
          ? `Tachycardia (Kasi ya Juu ya Moyo)` 
          : `Tachycardia (High Heart Rate)`, 
        color: 'text-red-700' 
      };
    } else {
      return null;
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 flex items-center justify-center min-h-[120px]">
        <span className="text-gray-500 text-sm">
          {language === "sw-TZ" ? "Inapakia arifa ya afya..." : "Loading health alert..."}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 flex items-center justify-center min-h-[120px]">
        <span className="text-gray-500 text-sm">{error}</span>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 flex items-center justify-center min-h-[120px]">
        <span className="text-gray-500 text-sm">
          {language === "sw-TZ" 
            ? "Hakuna data ya shinikizo la damu kwa leo. Tafadhali ingiza vitali zako." 
            : "No blood pressure data for today. Please enter your vitals."}
        </span>
      </div>
    );
  }

  const bpCategory = getBloodPressureCategory(statusData.systolic, statusData.diastolic, statusData.age);
  const heartRateAlert = getHeartRateAlert(statusData.heartRate, statusData.age);

  return (
    <div className={`bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 border-l-4 ${bpCategory.color}`}>
      <div data-content="health-alert" className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        {bpCategory.icon}
        <h3 className={`text-lg font-bold ${bpCategory.text}`}>{bpCategory.title}</h3>
      </div>
      
      {statusData.age && (
        <p className="text-sm text-gray-600 mb-1">
          {language === "sw-TZ" 
            ? `Tathmini kulingana na umri kwa umri wa miaka ${statusData.age}`
            : `Age-based assessment for ${statusData.age} years old`
          }
        </p>
      )}
      
      <p className={`text-sm ${bpCategory.text} mb-4`}>
        {(() => {
          const isSwahili = language === "sw-TZ";
          switch (bpCategory.level) {
            case 'Normal':
            case 'Kawaida':
              return isSwahili 
                ? 'Usomaji wako wa shinikizo la damu uko ndani ya kiwango cha kawaida, ukionyesha hakuna sababu ya wasiwasi ya haraka.'
                : 'Your blood pressure reading is within the normal range, indicating no immediate cause for concern.';
            case 'Elevated':
            case 'Kiwango Cha Juu':
              return isSwahili
                ? 'Shinikizo lako la damu limeinuka kidogo. Fikiria mabadiliko ya maisha na ufuatiliaji wa mara kwa mara.'
                : 'Your blood pressure is slightly elevated. Consider lifestyle changes and regular monitoring.';
            case 'Stage 1 Hypertension':
            case 'Hatua ya 1 ya Shinikizo la Juu la Damu':
              return isSwahili
                ? 'Uko katika Hatua ya 1 ya Shinikizo la Juu la Damu. Tafadhali fuatilia shinikizo lako la damu mara kwa mara na shauriana na daktari wako ikiwa hii inaendelea.'
                : 'You are in Stage 1 Hypertension. Please monitor your blood pressure regularly and consult your doctor if this persists.';
            case 'Stage 2 Hypertension':
            case 'Hatua ya 2 ya Shinikizo la Juu la Damu':
              return isSwahili
                ? 'Uko katika Hatua ya 2 ya Shinikizo la Juu la Damu. Inapendekezwa ushauriane na daktari wako hivi karibuni kwa usimamizi sahihi.'
                : 'You are in Stage 2 Hypertension. It is recommended to consult your doctor soon for proper management.';
            case 'Hypertensive Crisis':
            case 'Mgongano wa Shinikizo la Juu la Damu':
              return isSwahili
                ? 'Mgongano wa Shinikizo la Juu la Damu! Tafuta huduma ya matibabu mara moja.'
                : 'Hypertensive Crisis! Seek immediate medical attention.';
            case 'Low Blood Pressure':
            case 'Shinikizo la Chini la Damu':
              return isSwahili
                ? 'Shinikizo lako la damu ni la chini. Ikiwa unapata kizunguzungu au unajisikia vibaya, wasiliana na mtoa huduma wako wa afya.'
                : 'Your blood pressure is low. If you experience dizziness or feel unwell, contact your healthcare provider.';
            default:
              return isSwahili
                ? 'Endelea kufuatilia shinikizo la damu mara kwa mara na kudumisha maisha ya afya.'
                : 'Continue to monitor blood pressure regularly and maintain a healthy lifestyle.';
          }
        })()}
      </p>
      
      {heartRateAlert && (
        <p className={`text-sm font-semibold mb-2 ${heartRateAlert.color}`}>
          {heartRateAlert.message}
        </p>
      )}
      
      <div className="text-sm mb-2">
        <p><strong>{language === "sw-TZ" ? "Sistolic:" : "Systolic:"}</strong> {statusData.systolic} mmHg</p>
        <p><strong>{language === "sw-TZ" ? "Diastolic:" : "Diastolic:"}</strong> {statusData.diastolic} mmHg</p>
        <p><strong>{language === "sw-TZ" ? "Kasi ya Moyo:" : "Heart Rate:"}</strong> {statusData.heartRate} bpm</p>
        {statusData.age && <p><strong>{language === "sw-TZ" ? "Umri:" : "Age:"}</strong> {statusData.age} {language === "sw-TZ" ? "miaka" : "years"}</p>}
      </div>
      
      {bpCategory.button && (
        <button 
          onClick={scrollToDoctorManagement}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition"
        >
          {language === "sw-TZ" ? "Tafuta Daktari Karibu" : "Find Doctor Nearby"}
        </button>
      )}
      </div>
    </div>
  );
}