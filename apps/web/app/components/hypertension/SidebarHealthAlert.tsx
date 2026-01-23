"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, CheckCircle } from "lucide-react";
import { useTranslation } from "../../../lib/hypertension/useTranslation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type StatusData = {
  systolic: number;
  diastolic: number;
  heartRate: number;
  age?: number;
  status: "alert" | "stable";
};

export default function SidebarHealthAlert({ refreshToken }: { refreshToken?: number }) {
  const { t, language } = useTranslation();
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        icon: <TriangleAlert color="#2563eb" size={16} />,
        button: false,
        severity: 'low'
      };
    } else if (systolic < 120 && diastolic < 80) {
      return {
        level: isSwahili ? 'Kawaida' : 'Normal',
        color: 'bg-green-50 border-green-600',
        text: 'text-green-700',
        title: isSwahili ? 'Shinikizo la Damu la Kawaida' : 'Normal Blood Pressure',
        icon: <CheckCircle color="#16a34a" size={16} />,
        button: false,
        severity: 'normal'
      };
    } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
      return {
        level: isSwahili ? 'Kiwango Cha Juu' : 'Elevated',
        color: 'bg-yellow-50 border-yellow-600',
        text: 'text-yellow-700',
        title: isSwahili ? 'Shinikizo la Damu la Juu' : 'Elevated Blood Pressure',
        icon: <TriangleAlert color="#eab308" size={16} />,
        button: false,
        severity: 'elevated'
      };
    } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
      return {
        level: isSwahili ? 'Hatua ya 1 ya Shinikizo la Juu la Damu' : 'Stage 1 Hypertension',
        color: 'bg-orange-50 border-orange-600',
        text: 'text-orange-700',
        title: isSwahili ? 'Hatua ya 1' : 'Stage 1',
        icon: <TriangleAlert color="#ea580c" size={16} />,
        button: true,
        severity: 'stage1'
      };
    } else if ((systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) {
      return {
        level: isSwahili ? 'Hatua ya 2 ya Shinikizo la Juu la Damu' : 'Stage 2 Hypertension',
        color: 'bg-red-50 border-red-600',
        text: 'text-red-700',
        title: isSwahili ? 'Hatua ya 2' : 'Stage 2',
        icon: <TriangleAlert color="#dc2626" size={16} />,
        button: true,
        severity: 'stage2'
      };
    } else if (systolic >= 180 || diastolic >= 120) {
      return {
        level: isSwahili ? 'Mgongano wa Shinikizo la Juu la Damu' : 'Hypertensive Crisis',
        color: 'bg-red-100 border-red-800',
        text: 'text-red-800',
        title: isSwahili ? 'Mgongano' : 'Crisis',
        icon: <TriangleAlert color="#b91c1c" size={16} />,
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
          icon: <CheckCircle color="#16a34a" size={16} />,
          button: false,
          severity: 'normal'
        };
      }
      return {
        level: isSwahili ? 'Haijulikani' : 'Unknown',
        color: 'bg-gray-50 border-gray-400',
        text: 'text-gray-700',
        title: isSwahili ? 'Haijulikani' : 'Unknown',
        icon: <TriangleAlert color="#6b7280" size={16} />,
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
          ? `Bradycardia`
          : `Bradycardia`,
        color: 'text-blue-700'
      };
    } else if (heartRate > highThreshold) {
      return {
        message: language === "sw-TZ"
          ? `Tachycardia`
          : `Tachycardia`,
        color: 'text-red-700'
      };
    } else {
      return null;
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow-sm w-full rounded-lg p-3 flex items-center justify-center min-h-[80px] border">
        <span className="text-gray-500 text-xs">
          {language === "sw-TZ" ? "Inapakia arifa ya afya..." : "Loading health alert..."}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm w-full rounded-lg p-3 flex items-center justify-center min-h-[80px] border">
        <span className="text-gray-500 text-xs">{error}</span>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="bg-white shadow-sm w-full rounded-lg p-3 flex items-center justify-center min-h-[80px] border">
        <span className="text-gray-500 text-xs">
          {language === "sw-TZ"
            ? "Hakuna data ya shinikizo la damu kwa leo."
            : "No blood pressure data for today."}
        </span>
      </div>
    );
  }

  const bpCategory = getBloodPressureCategory(statusData.systolic, statusData.diastolic, statusData.age);
  const heartRateAlert = getHeartRateAlert(statusData.heartRate, statusData.age);

  const getAlertText = () => {
    const isSwahili = language === "sw-TZ";
    let alertText = `${bpCategory.title}. `;

    if (statusData.age) {
      alertText += isSwahili
        ? `Umri: ${statusData.age} miaka. `
        : `Age: ${statusData.age} years. `;
    }

    switch (bpCategory.level) {
      case 'Normal':
      case 'Kawaida':
        alertText += isSwahili
          ? 'Kawaida'
          : 'Normal';
        break;
      case 'Elevated':
      case 'Kiwango Cha Juu':
        alertText += isSwahili
          ? 'Imeinuka kidogo'
          : 'Slightly elevated';
        break;
      case 'Stage 1 Hypertension':
      case 'Hatua ya 1 ya Shinikizo la Juu la Damu':
        alertText += isSwahili
          ? 'Hatua ya 1'
          : 'Stage 1';
        break;
      case 'Stage 2 Hypertension':
      case 'Hatua ya 2 ya Shinikizo la Juu la Damu':
        alertText += isSwahili
          ? 'Hatua ya 2'
          : 'Stage 2';
        break;
      case 'Hypertensive Crisis':
      case 'Mgongano wa Shinikizo la Juu la Damu':
        alertText += isSwahili
          ? 'Mgongano!'
          : 'Crisis!';
        break;
      case 'Low Blood Pressure':
      case 'Shinikizo la Chini la Damu':
        alertText += isSwahili
          ? 'Shinikizo la chini'
          : 'Low';
        break;
      default:
        alertText += isSwahili
          ? 'Endelea kufuatilia'
          : 'Continue monitoring';
    }

    return alertText;
  };

  return (
    <div className={`bg-white shadow-sm w-full rounded-lg p-3 border-l-4 ${bpCategory.color}`}>
      <div data-content="health-alert" className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {bpCategory.icon}
            <h4 className={`text-sm font-bold ${bpCategory.text} truncate`}>{bpCategory.title}</h4>
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-1 line-clamp-2">
          {getAlertText()}
        </div>

        <div className="text-xs mb-1">
          <p><strong>{statusData.systolic}/{statusData.diastolic}</strong> mmHg • <strong>{statusData.heartRate}</strong> bpm</p>
        </div>

        {heartRateAlert && (
          <p className={`text-xs font-semibold ${heartRateAlert.color}`}>
            {heartRateAlert.message}
          </p>
        )}
      </div>
    </div>
  );
}