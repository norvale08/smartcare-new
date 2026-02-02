"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, CheckCircle, MapPin, Loader2, Heart, Activity } from "lucide-react";

type DiabetesStatus = {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  status: "alert" | "stable";
  hasBothConditions?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  refreshToken?: number;
  language?: "en" | "sw";
}

// Helper function to decode JWT and extract user info
const getUserFromToken = () => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return null;

    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export default function DiabetesAlerts({ refreshToken, language = "en" }: Props) {
  const [statusData, setStatusData] = useState<DiabetesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodayVitals = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setError(language === "sw" 
            ? "Lazima uwe umeingia ili kuona arifa" 
            : "You must be logged in to view diabetes alerts.");
          setLoading(false);
          return;
        }

        // Check if user has both conditions
        const user = getUserFromToken();
        const userDiseases = user?.disease || [];
        const hasDiabetes = userDiseases.some((d: string) => d.toLowerCase().includes('diabetes'));
        const hasHypertension = userDiseases.some((d: string) => 
          d.toLowerCase().includes('hypertension') || d.toLowerCase().includes('high blood pressure')
        );
        const hasBothConditions = hasDiabetes && hasHypertension;

        console.log("🔍 DiabetesAlerts - User Disease Status:", {
          userDiseases,
          hasDiabetes,
          hasHypertension,
          hasBothConditions
        });

        const res = await fetch(`${API_URL}/api/diabetesVitals/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const msg = (await res.json().catch(() => null))?.message || 
            (language === "sw" ? "Imeshindwa kupakia data" : "Failed to load vitals");
          throw new Error(msg);
        }

        const json = await res.json();
        const vitals = Array.isArray(json?.data) ? json.data : [];

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayVitals = vitals
          .filter((v: any) => {
            const t = new Date(v.timestamp || v.createdAt);
            return t >= startOfDay && t < endOfDay;
          })
          .sort(
            (a: any, b: any) =>
              new Date(b.timestamp || b.createdAt).getTime() -
              new Date(a.timestamp || a.createdAt).getTime()
          );

        if (todayVitals.length === 0) {
          setStatusData(null);
          setLoading(false);
          return;
        }

        const latest = todayVitals[0];
        const glucose = Number(latest.glucose);
        const context = latest.context || "Random";
        const systolic = latest.systolic ? Number(latest.systolic) : undefined;
        const diastolic = latest.diastolic ? Number(latest.diastolic) : undefined;
        const heartRate = latest.heartRate ? Number(latest.heartRate) : undefined;

        let isAlert = false;
        
        // Check glucose levels
        if (context === "Fasting") isAlert = glucose < 70 || glucose > 125;
        else if (context === "Post-meal") isAlert = glucose < 70 || glucose > 180;
        else isAlert = glucose < 70 || glucose > 200;

        // Check BP levels if user has both conditions
        if (hasBothConditions && systolic && diastolic) {
          const bpAlert = systolic >= 140 || diastolic >= 90 || systolic < 90 || diastolic < 60;
          isAlert = isAlert || bpAlert;
        }

        setStatusData({ 
          glucose, 
          context, 
          systolic, 
          diastolic, 
          heartRate, 
          status: isAlert ? "alert" : "stable",
          hasBothConditions 
        });
      } catch (e: any) {
        setError(e?.message || (language === "sw" ? "Imeshindwa kupakia arifa" : "Failed to load diabetes alerts"));
      } finally {
        setLoading(false);
      }
    };

    fetchTodayVitals();
  }, [refreshToken, language]);

  function getGlucoseCategory(glucose: number, context: string) {
    const isSwahili = language === "sw";
    
    if (glucose < 70) return { 
      title: isSwahili ? "Sukari ya Chini" : "Low Blood Sugar", 
      color: "bg-teal-50 border-teal-500", 
      text: "text-teal-950", 
      icon: <TriangleAlert className="text-teal-600" size={16} />
    };
    
    if (context === "Fasting") return glucose <= 125
      ? { 
        title: isSwahili ? "Kawaida (Njaa)" : "Normal Fasting", 
        color: "bg-emerald-50 border-emerald-500", 
        text: "text-emerald-950", 
        icon: <CheckCircle className="text-emerald-600" size={16} />
      }
      : { 
        title: isSwahili ? "Juu (Njaa)" : "High Fasting", 
        color: "bg-orange-50 border-orange-500", 
        text: "text-orange-950", 
        icon: <TriangleAlert className="text-orange-600" size={16} />
      };
    
    if (context === "Post-meal") return glucose <= 180
      ? { 
        title: isSwahili ? "Kawaida (Baada ya Kula)" : "Normal Post-meal", 
        color: "bg-emerald-50 border-emerald-500", 
        text: "text-emerald-950", 
        icon: <CheckCircle className="text-emerald-600" size={16} />
      }
      : { 
        title: isSwahili ? "Juu (Baada ya Kula)" : "High Post-meal", 
        color: "bg-orange-50 border-orange-500", 
        text: "text-orange-950", 
        icon: <TriangleAlert className="text-orange-600" size={16} />
      };
    
    return glucose <= 200
      ? { 
        title: isSwahili ? "Kawaida (Bila Mpango)" : "Normal Random", 
        color: "bg-emerald-50 border-emerald-500", 
        text: "text-emerald-950", 
        icon: <CheckCircle className="text-emerald-600" size={16} />
      }
      : { 
        title: isSwahili ? "Juu (Bila Mpango)" : "High Random", 
        color: "bg-orange-50 border-orange-500", 
        text: "text-orange-950", 
        icon: <TriangleAlert className="text-orange-600" size={16} />
      };
  }

  function getBloodPressureStatus(systolic: number, diastolic: number) {
    const isSwahili = language === "sw";
    
    if (systolic < 90 || diastolic < 60) {
      return {
        category: isSwahili ? "Shinikizo la Chini" : "Low BP",
        color: "bg-teal-50 border-teal-500",
        textColor: "text-teal-950",
        icon: <TriangleAlert className="text-teal-600" size={16} />,
        severity: "low"
      };
    } else if (systolic < 120 && diastolic < 80) {
      return {
        category: isSwahili ? "Kawaida" : "Normal",
        color: "bg-emerald-50 border-emerald-500",
        textColor: "text-emerald-950",
        icon: <CheckCircle className="text-emerald-600" size={16} />,
        severity: "normal"
      };
    } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
      return {
        category: isSwahili ? "Kiwango Cha Juu" : "Elevated",
        color: "bg-amber-50 border-amber-500",
        textColor: "text-amber-950",
        icon: <TriangleAlert className="text-amber-600" size={16} />,
        severity: "elevated"
      };
    } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
      return {
        category: isSwahili ? "Hatua 1" : "Stage 1 HTN",
        color: "bg-orange-50 border-orange-500",
        textColor: "text-orange-950",
        icon: <TriangleAlert className="text-orange-600" size={16} />,
        severity: "stage1"
      };
    } else if ((systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) {
      return {
        category: isSwahili ? "Hatua 2" : "Stage 2 HTN",
        color: "bg-red-50 border-red-500",
        textColor: "text-red-950",
        icon: <TriangleAlert className="text-red-600" size={16} />,
        severity: "stage2"
      };
    } else {
      return {
        category: isSwahili ? "Mgongano wa Hatari" : "Hypertensive Crisis",
        color: "bg-red-50 border-red-700",
        textColor: "text-red-950",
        icon: <TriangleAlert className="text-red-700" size={16} />,
        severity: "crisis"
      };
    }
  }

  // Loading State - Emerald/Teal themed
  if (loading) return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm rounded-lg border border-emerald-200 p-2 flex items-center justify-center">
      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin mr-1.5" />
      <span className="text-sm text-emerald-800 font-medium">
        {language === "sw" ? "Inapakia arifa..." : "Loading alert..."}
      </span>
    </div>
  );
  
  // Error State - Teal themed
  if (error) return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm rounded-lg border border-emerald-200 p-2">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <a href="/map" className="w-full">
          <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-2 py-1.5 rounded-md transition-all text-sm font-medium flex items-center justify-center gap-1.5 shadow-md">
            <MapPin className="w-3.5 h-3.5" />
            {language === "sw" ? "Tafuta Vituo" : "Find Facilities"}
          </button>
        </a>
      </div>
    </div>
  );
  
  // No Data State - Emerald themed
  if (!statusData) return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm rounded-lg border border-emerald-200 p-2">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-emerald-800 font-medium">
          {language === "sw" 
            ? "Hakuna data ya sukari kwa leo. Ingiza viwango vyako." 
            : "No glucose data for today. Enter vitals."}
        </p>
        <a href="/map" className="w-full">
          <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-2 py-1.5 rounded-md transition-all text-sm font-medium flex items-center justify-center gap-1.5 shadow-md">
            <MapPin className="w-3.5 h-3.5" />
            {language === "sw" ? "Tafuta Vituo" : "Find Facilities"}
          </button>
        </a>
      </div>
    </div>
  );

  const glucoseCategory = getGlucoseCategory(statusData.glucose, statusData.context);
  const bpStatus = statusData.systolic && statusData.diastolic 
    ? getBloodPressureStatus(statusData.systolic, statusData.diastolic)
    : null;

  // For dual conditions, use white background with gradient border
  // For single condition, use the condition's background color
  const containerClass = statusData.hasBothConditions 
    ? "bg-gradient-to-br from-white to-emerald-50 shadow-sm rounded-lg border border-emerald-200 p-2"
    : `bg-gradient-to-br ${glucoseCategory.color.includes('bg-emerald') ? 'from-emerald-50 to-teal-50' : 'from-orange-50 to-amber-50'} shadow-sm rounded-lg border-l-4 p-2`;

  // Alert Display - Independent Color Coding
  return (
    <div className={containerClass}>
      {/* Dual Condition Header */}
      {statusData.hasBothConditions && (
        <div className="mb-2 pb-2 border-b border-emerald-200">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <Heart className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800">
              {language === "sw" 
                ? "Tathmini ya Kisukari na Shinikizo la Juu" 
                : "Diabetes & Hypertension Assessment"}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Glucose Status Card - Independent Colors - Fixed Height */}
        <div className={statusData.hasBothConditions ? `${glucoseCategory.color} border-l-4 rounded-lg p-2 h-[72px] flex flex-col justify-center` : "h-[72px] flex flex-col justify-center"}>
          <div className="flex flex-col gap-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                {glucoseCategory.icon}
                <h3 className={`text-sm font-bold ${glucoseCategory.text} truncate`}>
                  {glucoseCategory.title}
                </h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                <span className="font-semibold">
                  <span className={glucoseCategory.text}>
                    {language === "sw" ? "Sukari:" : "Glucose:"}
                  </span> {statusData.glucose} mg/dL
                </span>
                <span className={`px-1.5 py-0.5 rounded-full ${glucoseCategory.color.includes('bg-emerald') ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'} font-medium text-xs`}>
                  {language === "sw" 
                    ? (statusData.context === "Fasting" ? "Njaa" : statusData.context === "Post-meal" ? "Baada ya Kula" : "Bila Mpango")
                    : statusData.context}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Blood Pressure Status Card - Independent Colors - Fixed Height */}
        {statusData.hasBothConditions && bpStatus && statusData.systolic && statusData.diastolic && (
          <div className={`${bpStatus.color} border-l-4 rounded-lg p-2 h-[72px] flex flex-col justify-center`}>
            <div className="flex flex-col gap-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Heart className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  {bpStatus.icon}
                  <h4 className={`text-sm font-bold ${bpStatus.textColor}`}>
                    {bpStatus.category}
                  </h4>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <span className="font-semibold">
                    <span className={bpStatus.textColor}>
                      {language === "sw" ? "Sys:" : "Sys:"}
                    </span> {statusData.systolic}
                  </span>
                  <span className="font-semibold">
                    <span className={bpStatus.textColor}>
                      {language === "sw" ? "Dia:" : "Dia:"}
                    </span> {statusData.diastolic}
                  </span>
                  {statusData.heartRate && (
                    <span className="font-semibold">
                      <span className="text-emerald-800">
                        {language === "sw" ? "HR:" : "HR:"}
                      </span> {statusData.heartRate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Single Action Button - Emerald/Teal gradient */}
        <div className="pt-1">
          <a href="/map" className="w-full block">
            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-2 py-1.5 rounded-md transition-all text-sm font-semibold flex items-center justify-center gap-1.5 shadow-md">
              <MapPin className="w-3.5 h-3.5" />
              {language === "sw" ? "Tafuta Vituo" : "Find Facilities"}
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}