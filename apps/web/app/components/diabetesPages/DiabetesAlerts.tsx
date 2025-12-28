"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, CheckCircle, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";

type DiabetesStatus = {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  status: "alert" | "stable";
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  refreshToken?: number;
}

export default function DiabetesAlerts({ refreshToken }: Props) {
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
          setError("You must be logged in to view diabetes alerts.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/diabetesVitals/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const msg = (await res.json().catch(() => null))?.message || `Failed to load vitals`;
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

        let isAlert = false;
        if (context === "Fasting") isAlert = glucose < 70 || glucose > 125;
        else if (context === "Post-meal") isAlert = glucose < 70 || glucose > 180;
        else isAlert = glucose < 70 || glucose > 200;

        setStatusData({ glucose, context, status: isAlert ? "alert" : "stable" });
      } catch (e: any) {
        setError(e?.message || "Failed to load diabetes alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayVitals();
  }, [refreshToken]);

  function getGlucoseCategory(glucose: number, context: string) {
    if (glucose < 70) return { 
      title: "Low Blood Sugar", 
      color: "bg-blue-50 border-cyan-600", 
      text: "text-blue-950", 
      icon: <TriangleAlert className="text-cyan-600" size={18} />, 
      message: "Glucose too low!",
      buttonText: "Find Help",
      buttonGradient: "from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
    };
    
    if (context === "Fasting") return glucose <= 125
      ? { 
        title: "Normal Fasting", 
        color: "bg-emerald-50 border-emerald-600", 
        text: "text-emerald-950", 
        icon: <CheckCircle className="text-emerald-600" size={18} />, 
        message: "Fasting glucose normal",
        buttonText: "Find Facilities",
        buttonGradient: "from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
      }
      : { 
        title: "High Fasting", 
        color: "bg-red-50 border-red-600", 
        text: "text-red-950", 
        icon: <TriangleAlert className="text-red-600" size={18} />, 
        message: "Fasting glucose high",
        buttonText: "Find Doctor",
        buttonGradient: "from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
      };
    
    if (context === "Post-meal") return glucose <= 180
      ? { 
        title: "Normal Post-meal", 
        color: "bg-emerald-50 border-emerald-600", 
        text: "text-emerald-950", 
        icon: <CheckCircle className="text-emerald-600" size={18} />, 
        message: "Post-meal glucose normal",
        buttonText: "Find Facilities",
        buttonGradient: "from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
      }
      : { 
        title: "High Post-meal", 
        color: "bg-red-50 border-red-600", 
        text: "text-red-950", 
        icon: <TriangleAlert className="text-red-600" size={18} />, 
        message: "Post-meal glucose high",
        buttonText: "Find Specialist",
        buttonGradient: "from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
      };
    
    return glucose <= 200
      ? { 
        title: "Normal Random", 
        color: "bg-emerald-50 border-emerald-600", 
        text: "text-emerald-950", 
        icon: <CheckCircle className="text-emerald-600" size={18} />, 
        message: "Random glucose normal",
        buttonText: "Find Facilities",
        buttonGradient: "from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
      }
      : { 
        title: "High Random", 
        color: "bg-red-50 border-red-600", 
        text: "text-red-950", 
        icon: <TriangleAlert className="text-red-600" size={18} />, 
        message: "Random glucose high",
        buttonText: "Get Help Now",
        buttonGradient: "from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
      };
  }

  // Loading State - Compact
  if (loading) return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-3 sm:p-4 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-cyan-600 animate-spin mr-2" />
      <span className="text-sm text-gray-600">Loading alert...</span>
    </div>
  );
  
  // Error State - Compact
  if (error) return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <p className="text-xs sm:text-sm text-red-600 flex-1">{error}</p>
        <Link href="/map" className="flex-shrink-0">
          <button className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            Find Facilities
          </button>
        </Link>
      </div>
    </div>
  );
  
  // No Data State - Compact
  if (!statusData) return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <p className="text-xs sm:text-sm text-gray-600 flex-1">No glucose data for today. Enter vitals.</p>
        <Link href="/map" className="flex-shrink-0">
          <button className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            Find Facilities
          </button>
        </Link>
      </div>
    </div>
  );

  const glucoseCategory = getGlucoseCategory(statusData.glucose, statusData.context);

  // Alert Display - Compact & Mobile-First
  return (
    <div className={`${glucoseCategory.color} shadow-sm rounded-lg border-l-4 p-3 sm:p-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {/* Left Side - Status Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {glucoseCategory.icon}
            <h3 className={`text-sm sm:text-base font-bold ${glucoseCategory.text} truncate`}>
              {glucoseCategory.title}
            </h3>
          </div>
          
          <p className={`text-xs sm:text-sm ${glucoseCategory.text} mb-2`}>
            {glucoseCategory.message}
          </p>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
            <span className="font-semibold">
              <span className={glucoseCategory.text}>Glucose:</span> {statusData.glucose} mg/dL
            </span>
            <span className={`px-2 py-0.5 rounded-full ${glucoseCategory.color} ${glucoseCategory.text} font-medium`}>
              {statusData.context}
            </span>
          </div>
        </div>
        
        {/* Right Side - Action Button */}
        <Link href="/map" className="flex-shrink-0 w-full sm:w-auto">
          <button className={`w-full sm:w-auto bg-gradient-to-r ${glucoseCategory.buttonGradient} text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg transition-all text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm`}>
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {glucoseCategory.buttonText}
          </button>
        </Link>
      </div>
    </div>
  );
}