"use client";

import React, { useState, useEffect } from "react";
import { HeartPulse,Globe,TriangleAlert,MicVocal,Pill,Utensils,AlertCircle,CheckCircle,Wine,Cigarette,Coffee,Activity, User, Search, Send,
} from "lucide-react";
import dynamic from "next/dynamic";
import axios from 'axios';
import MedicationAnalysisPage from "../components/hypertension/medicationAnalysis";
import { useSession } from "next-auth/react";
import { useVoiceInput } from "./components/useVoiceInput";
import { wordsToNumbers } from "./components/words-to-numbers";
import Header from "./components/Header";
import PatientProfile from "./components/PatientProfile";
import EditProfileModal from "./components/EditProfileModal";
import HypertensionAlert from "../components/hypertension/alert";
import VitalsInput from "./components/VitalsInput";
import LifestyleAssessment from "./components/LifestyleAssessment";
import DietRecommendations from "./components/DietRecommendations";
import type { LifestyleData } from "./components/LifestyleAssessment";
import HealthTrends from "./components/HealthTrends";
import NearbyClinics from "./components/NearbyClinics";
// import { Doctor } from "@/types/doctor";
import { Button, Input, Card, CardHeader, CardContent, CardDescription, CardTitle } from "@repo/ui";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const getTodayAlertStatus = (vitals: any[]): { status: "alert" | "stable" | null; systolic: number | null; diastolic: number | null; heartRate: number | null; } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayVitals = vitals
    .filter(v => new Date(v.createdAt) >= today)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (todayVitals.length === 0) return { status: null, systolic: null, diastolic: null, heartRate: null };

  const latest = todayVitals[0];
  const systolic = Number(latest.systolic);
  const diastolic = Number(latest.diastolic);
  const heartRate = Number(latest.heartRate);

  const isHigh = systolic > 140 || diastolic > 90;
  const isLow = systolic < 90 || diastolic < 60;
  const heartRateAlert = heartRate < 60 || heartRate > 100;
  const status: "alert" | "stable" = (isHigh || isLow || heartRateAlert) ? "alert" : "stable";

  return { status, systolic, diastolic, heartRate };
};

const getBpLevel = (systolic: number, diastolic: number): string => {
  if (systolic < 90 || diastolic < 60) return 'Low Blood Pressure';
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic < 130 && diastolic < 80) return 'Elevated';
  if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) return 'Stage 1 Hypertension';
  if (systolic >= 140 || diastolic >= 90) return 'Stage 2 Hypertension';
  if (systolic >= 180 || diastolic >= 120) return 'Hypertensive Crisis';
  return '';
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;



function DashboardPage() {
  const { data: session, status } = useSession();
  console.log("Submitting vitals with userId:", session?.user?.id);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [message, setMessage] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [alertRefreshToken, setAlertRefreshToken] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setHasToken(!!token);
    }
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const handleSubmit = async () => {
    if (!systolic || !diastolic || !heartRate) {
      setMessage('Please enter all vitals.');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setMessage('You must be logged in to save vitals.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/hypertensionVitals`, {
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        heartRate: Number(heartRate),
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      setMessage('✅ Vitals saved successfully');
      setSystolic('');
      setDiastolic('');
      setHeartRate('');
      setAlertRefreshToken(Date.now());

      // Refresh AI recommendations after vitals update
      try {
        const res = await axios.get(`${API_URL}/api/hypertension/lifestyle`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setAiRecommendations(res.data);
      } catch (err) {
        console.error("Failed to refresh AI recommendations:", err);
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message || '❌ Failed to save vitals');
      console.error(error);
    }
  };

  const [lifestyle, setLifestyle] = useState<LifestyleData>({
    alcohol: false,
    smoking: false,
    caffeine: 0,
    exercise: ""
  });
  const [dietData, setDietData] = useState<any>(null);
  const [dietLoading, setDietLoading] = useState(false);

  const [aiRecommendations, setAiRecommendations] = useState({ advice: '', alerts: [], warnings: [] });
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Regeneration loading states
  const [regeneratingDiet, setRegeneratingDiet] = useState(false);
  const [regeneratingLifestyle, setRegeneratingLifestyle] = useState(false);

  // Doctor search states
  // const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm, setSearchForm] = useState({
    specialization: "",
    location: "",
    hospitalId: "",
    isAvailable: false
  });

  const Provider = dynamic(() => import("../components/maps/ProviderMap"), {
    ssr: false,
  });
   
  const { listening, transcript, startListening, stopListening, setTranscript, error } =
    useVoiceInput();

  const [language, setLanguage] = useState<string>("en-US");
  const [listeningField, setListeningField] = useState<
    "systolic" | "diastolic" | "heartRate" | null
  >(null);

  useEffect(() => {
    if (!transcript || !listeningField) return;

    const cleaned = transcript.trim().toLowerCase();
    const digitMatch = cleaned.match(/\d{1,3}(?:\.\d+)?/);
    let numericValue: number | null = null;
    if (digitMatch) {
      const parsed = parseFloat(digitMatch[0]);
      if (!Number.isNaN(parsed)) numericValue = Math.round(parsed);
    }
    if (numericValue === null) {
      numericValue = wordsToNumbers(cleaned);
    }

    if (numericValue !== null) {
      if (listeningField === "systolic") setSystolic(String(numericValue));
      if (listeningField === "diastolic") setDiastolic(String(numericValue));
      if (listeningField === "heartRate") setHeartRate(String(numericValue));
    }

    setListeningField(null);
    setTranscript("");
    stopListening();
  }, [transcript, listeningField, setTranscript, stopListening]);

  const [vitals, setVitals] = useState<any[]>([]);
  const formatDateTime = (d?: Date | string | null) => {
    if (!d) return "—";
    try {
      const date = typeof d === "string" ? new Date(d) : d;
      if (isNaN(date.getTime())) return "—";
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return "—";
    }
  };

  // Define functions outside useEffect to make them available throughout the component
  const fetchVitals = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/api/hypertensionVitals/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const allVitals = res.data.data;
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

      const recentVitals = allVitals
        .map((v: any) => ({
          systolic: Number(v.systolic),
          diastolic: Number(v.diastolic),
          heartRate: Number(v.heartRate),
          createdAt: new Date(v.timestamp || v.createdAt),
          date: new Date(v.timestamp || v.createdAt).toLocaleDateString(),
        }))
        .filter((v: any) => v.createdAt >= threeWeeksAgo)
        .sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());

      console.log("Fetched vitals:", recentVitals);
      setVitals(recentVitals);
    } catch (err) {
      console.error("Failed to fetch vitals", err);
    }
  };

  const fetchAIRecommendations = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    try {
      setLoadingAI(true);
      const res = await axios.get(`${API_URL}/api/hypertension/lifestyle`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setAiRecommendations(res.data);
    } catch (err) {
      console.error("Failed to fetch AI recommendations:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  const fetchDietRecommendations = async () => {
    try {
      setRegeneratingDiet(true);
      setDietLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found - cannot fetch diet recommendations");
        return;
      }
      
      const res = await axios.get(`${API_URL}/api/hypertension/diet`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Handle API response format with data wrapper
      const data = res.data?.data || res.data;

      if (data && data.breakfast) {
        setDietData(data);
      } else {
        console.warn("Diet API returned unexpected data:", data);
        // Set fallback if no valid data
        setDietData({
          breakfast: "Maziwa lala with mkate wa maharage and bananas",
          lunch: "Sukuma wiki with lean proteins and small portion of ugali",
          dinner: "Fish with traditional vegetables",
          snacks: "Fresh fruits or boiled maize",
          generalAdvice: "Focus on traditional Kenyan foods with less salt and more vegetables.",
          calorieTarget: 2000,
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch diet recommendations:", err?.response?.data || err);
      if (err?.response?.status === 401) {
        console.warn("User not authenticated — token invalid or missing");
      } else if (err?.response?.status === 500) {
        console.error("Server error fetching diet recommendations");
      }
      // Only set fallback if there's no existing data
      if (!dietData) {
        setDietData({
          breakfast: "Maziwa lala with mkate wa maharage and bananas",
          lunch: "Sukuma wiki with lean proteins and small portion of ugali",
          dinner: "Fish with traditional vegetables",
          snacks: "Fresh fruits or boiled maize",
          generalAdvice: "Focus on traditional Kenyan foods with less salt and more vegetables.",
          calorieTarget: 2000,
        });
      }
    } finally {
      setDietLoading(false);
      setRegeneratingDiet(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    fetchVitals();
    fetchAIRecommendations();
    fetchDietRecommendations();
  }, [alertRefreshToken]);

  const todayAlert = getTodayAlertStatus(vitals);
  const currentBpLevel = todayAlert.systolic !== null && todayAlert.diastolic !== null ? getBpLevel(todayAlert.systolic, todayAlert.diastolic) : '';

  const [patient, setPatient] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const computeAge = (dob?: string) => {
    if (!dob) return "—";
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return "—";
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  useEffect(() => {
    const tokenStr = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!tokenStr) return;
    const getUserFromToken = (t: string) => {
      try {
        const parts = t.split(".");
        if (parts.length < 2) return {} as any;
        const base64Url = parts[1] ?? "";
        if (!base64Url) return {} as any;
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, "=");
        const json = atob(padded);
        const payload = JSON.parse(json);
        return {
          fullName: payload?.name || "",
          firstname: payload?.firstname || "",
          lastname: payload?.lastname || "",
        };
      } catch {
        return {} as any;
      }
    };
    const fetchPatient = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${tokenStr}` },
          withCredentials: true,
        });
        const data = res.data?.data || res.data;
        setPatient(data);
        setEditForm({
          fullName: data?.fullName || "",
          dob: data?.dob ? new Date(data.dob).toISOString().slice(0, 10) : "",
          gender: data?.gender || "",
          weight: data?.weight ?? "",
          height: data?.height ?? "",
          phoneNumber: data?.phoneNumber || "",
        });
      } catch (err: any) {
        const basic = getUserFromToken(tokenStr);
        const fallback: any = {
          fullName: basic.fullName || `${basic.firstname || ""} ${basic.lastname || ""}`.trim(),
          weight: undefined,
          height: undefined,
          dob: undefined,
        };
        setPatient(fallback);
        setEditForm({
          fullName: fallback.fullName || "",
          dob: "",
          gender: "",
          weight: "",
          height: "",
          phoneNumber: "",
        });
        console.error("Failed to fetch patient info", err);
      }
    };
    fetchPatient();
  }, []);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    try {
      const payload: any = {
        fullName: editForm.fullName,
        dob: editForm.dob,
        gender: editForm.gender,
        weight: editForm.weight ? Number(editForm.weight) : undefined,
        height: editForm.height ? Number(editForm.height) : undefined,
        phoneNumber: editForm.phoneNumber,
      };
      await axios.put(`${API_URL}/api/profile`, payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const res = await axios.get(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const data = res.data?.data || res.data;
      setPatient(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update patient profile", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        language={language}
        onLanguageChange={setLanguage}
        patient={patient}
      />

      <main className="flex flex-col items-center px-4 py-6 gap-6">
        
        {patient && (
          <PatientProfile
            patient={patient}
            vitals={vitals}
            onEditClick={() => setIsEditing(true)}
          />
        )}

        {isEditing && (
          <EditProfileModal
            editForm={editForm}
            onClose={() => setIsEditing(false)}
            onSave={handleSaveProfile}
            onChange={handleEditChange}
          />
        )}

        <HypertensionAlert refreshToken={alertRefreshToken} />

        <VitalsInput
          systolic={systolic}
          diastolic={diastolic}
          heartRate={heartRate}
          message={message}
          hasToken={hasToken}
          status={status}
          listening={listening}
          transcript={transcript}
          error={error}
          language={language}
          onSystolicChange={setSystolic}
          onDiastolicChange={setDiastolic}
          onHeartRateChange={setHeartRate}
          onStartListening={(field: "systolic" | "diastolic" | "heartRate") => {
            setListeningField(field);
            startListening(language);
          }}
          onSubmit={handleSubmit}
        />

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <MedicationAnalysisPage />
        </div>

        <LifestyleAssessment
          lifestyle={lifestyle}
          onLifestyleChange={setLifestyle}
          bpLevel={currentBpLevel}
          alertStatus={todayAlert.status}
          todayVitals={{ systolic: todayAlert.systolic, diastolic: todayAlert.diastolic, heartRate: todayAlert.heartRate }}
          aiRecommendations={aiRecommendations}
          loadingAI={loadingAI}
          onRegenerateLifestyle={async () => {
            if (!patient) return;
            
            setRegeneratingLifestyle(true);
            const token = localStorage.getItem("token");
            if (!token) {
              console.warn("No token found - cannot regenerate lifestyle");
              setRegeneratingLifestyle(false);
              return;
            }
            
            try {
              // Fetch latest alerts for the patient
              const alertsRes = await fetch(`${API_URL}/api/hypertensionVitals/me`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
              });
              const alertsData = await alertsRes.json();
              const todayVitals = Array.isArray(alertsData?.data) 
                ? alertsData.data.filter((v: any) => {
                    const vDate = new Date(v.timestamp || v.createdAt);
                    const today = new Date();
                    return vDate.toDateString() === today.toDateString();
                  })
                : [];

              // Get lifestyle data
              const lifestylePayload = {
                smoking: lifestyle.smoking ? "Heavy" : "None",
                alcohol: lifestyle.alcohol ? "Frequently" : "None",
                exercise: lifestyle.exercise === "high" ? "Daily" : 
                         lifestyle.exercise === "moderate" ? "Few times/week" : 
                         lifestyle.exercise === "low" ? "Rarely" : "None",
                sleep: "7-8 hrs"
              };

              // Call the lifestyle update API which will regenerate AI advice
              const updateRes = await axios.post(`${API_URL}/api/hypertension/lifestyle/update`, lifestylePayload, {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
              });

              // Fetch updated AI recommendations
              const aiRes = await axios.get(`${API_URL}/api/hypertension/lifestyle`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
              });
              
              setAiRecommendations(aiRes.data);
            } catch (error) {
              console.error("Failed to regenerate lifestyle recommendations:", error);
            } finally {
              setRegeneratingLifestyle(false);
            }
          }}
          loadingRegenerate={regeneratingLifestyle}
        />

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <DietRecommendations 
            dietData={dietData} 
            loading={dietLoading} 
            onRegenerate={fetchDietRecommendations}
            patient={patient ? {
              age: Number(computeAge(patient?.dob)) || undefined,
              weight: patient?.weight,
              gender: patient?.gender
            } : undefined}
          />
        </div>

        <HealthTrends vitals={vitals} />

        <NearbyClinics />
      </main>
    </div>
  );
}

export default DashboardPage;
