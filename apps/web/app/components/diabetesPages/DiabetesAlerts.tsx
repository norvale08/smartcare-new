"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, CheckCircle, MapPin } from "lucide-react";
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

  if (loading) return (
    <div className="bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 flex items-center justify-center min-h-[120px]">
      Loading diabetes alert...
    </div>
  );
  
  if (error) return (
    <div className="bg-white shadow-lg w-full max-w-4xl rounded-lg p-6">
      <div className="text-red-600 mb-4">{error}</div>
      <Link href="/map">
        <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Find Medical Facilities
        </button>
      </Link>
    </div>
  );
  
  if (!statusData) return (
    <div className="bg-white shadow-lg w-full max-w-4xl rounded-lg p-6">
      <div className="text-gray-600 mb-4">No glucose data for today. Please enter your vitals.</div>
      <Link href="/map">
        <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Find Medical Facilities
        </button>
      </Link>
    </div>
  );

  function getGlucoseCategory(glucose: number, context: string) {
    if (glucose < 70) return { 
      title: "Low Blood Sugar", 
      color: "bg-blue-50 border-blue-600", 
      text: "text-blue-700", 
      icon: <TriangleAlert color="#2563eb" size={20} />, 
      message: "Glucose too low!",
      buttonText: "Find Emergency Help",
      buttonColor: "from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
    };
    
    if (context === "Fasting") return glucose <= 125
      ? { 
        title: "Normal Fasting Glucose", 
        color: "bg-green-50 border-green-600", 
        text: "text-green-700", 
        icon: <CheckCircle color="#16a34a" size={20} />, 
        message: "Fasting glucose normal",
        buttonText: "Find Medical Facilities",
        buttonColor: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      }
      : { 
        title: "High Fasting Glucose", 
        color: "bg-red-50 border-red-600", 
        text: "text-red-700", 
        icon: <TriangleAlert color="#dc2626" size={20} />, 
        message: "Fasting glucose high",
        buttonText: "Find Nearby Doctor",
        buttonColor: "from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
      };
    
    if (context === "Post-meal") return glucose <= 180
      ? { 
        title: "Normal Post-meal Glucose", 
        color: "bg-green-50 border-green-600", 
        text: "text-green-700", 
        icon: <CheckCircle color="#16a34a" size={20} />, 
        message: "Post-meal glucose normal",
        buttonText: "Find Medical Facilities",
        buttonColor: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      }
      : { 
        title: "High Post-meal Glucose", 
        color: "bg-red-50 border-red-600", 
        text: "text-red-700", 
        icon: <TriangleAlert color="#dc2626" size={20} />, 
        message: "Post-meal glucose high",
        buttonText: "Find Diabetes Specialist",
        buttonColor: "from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
      };
    
    return glucose <= 200
      ? { 
        title: "Normal Random Glucose", 
        color: "bg-green-50 border-green-600", 
        text: "text-green-700", 
        icon: <CheckCircle color="#16a34a" size={20} />, 
        message: "Random glucose normal",
        buttonText: "Find Medical Facilities",
        buttonColor: "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      }
      : { 
        title: "High Random Glucose", 
        color: "bg-red-50 border-red-600", 
        text: "text-red-700", 
        icon: <TriangleAlert color="#dc2626" size={20} />, 
        message: "Random glucose high",
        buttonText: "Emergency Medical Help",
        buttonColor: "from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
      };
  }

  const glucoseCategory = getGlucoseCategory(statusData.glucose, statusData.context);

  return (
    <div className={`bg-white shadow-lg w-full max-w-4xl rounded-lg p-6 border-l-4 ${glucoseCategory.color}`}>
      <div className="flex items-center gap-2 mb-2">
        {glucoseCategory.icon}
        <h3 className={`text-lg font-bold ${glucoseCategory.text}`}>
          {glucoseCategory.title}
        </h3>
      </div>
      
      <p className={`text-sm ${glucoseCategory.text} mb-4`}>
        {glucoseCategory.message}
      </p>
      
      <div className="text-sm mb-2">
        <p><strong>Glucose:</strong> {statusData.glucose} mg/dL</p>
        <p><strong>Context:</strong> {statusData.context}</p>
      </div>
      
      {/* SINGLE BUTTON THAT TAKES USER TO /map PAGE */}
      <Link href="/map">
        <button className={`bg-gradient-to-r ${glucoseCategory.buttonColor} text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2`}>
          <MapPin className="w-4 h-4" />
          {glucoseCategory.buttonText}
        </button>
      </Link>
    </div>
  );
}