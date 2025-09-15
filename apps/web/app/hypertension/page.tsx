"use client";

import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Globe,
  TriangleAlert,
  MicVocal,
  Pill,
  Utensils,
  AlertCircle,
  CheckCircle,
  Wine,
  Cigarette,
  Coffee,
  Activity,
} from "lucide-react";
import dynamic from "next/dynamic";
import axios from 'axios';
import MedicationAnalysisPage from "../components/hypertension/medicationAnalysis";
import { useSession } from "next-auth/react";
import HypertensionAlert from "../components/hypertension/alert";
import { useVoiceInput } from "../components/hypertension/useVoiceInput";
import { wordsToNumbers } from "../components/hypertension/words-to-numbers"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const mockDrugInteractions = [
  { drug1: "Aspirin", drug2: "Warfarin", severity: "High", warning: "Increased bleeding risk" },
  { drug1: "Ibuprofen", drug2: "Lisinopril", severity: "Medium", warning: "Reduced effectiveness of blood pressure medication" },
];

const mockDietRecommendations = {
  breakfast: "Oatmeal with berries and nuts",
  lunch: "Grilled chicken salad with olive oil dressing",
  dinner: "Baked salmon with quinoa and steamed vegetables",
  snacks: "Greek yogurt, almonds, or apple slices"
};

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
      const response = await axios.post('http://localhost:3001/api/hypertensionVitals', {
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
    } catch (error: any) {
      setMessage(error?.response?.data?.message || '❌ Failed to save vitals');
      console.error(error);
    }
  };

  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState("");
  const [lifestyle, setLifestyle] = useState({
    alcohol: false,
    smoking: false,
    caffeine: 0,
    exercise: ""
  });
  const [dietGenerated, setDietGenerated] = useState(false);

  const addMedication = () => {
    if (newMedication.trim()) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication("");
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const checkDrugInteractions = () => {
    return mockDrugInteractions.filter(interaction => 
      medications.some(med => med.toLowerCase().includes(interaction.drug1.toLowerCase())) &&
      medications.some(med => med.toLowerCase().includes(interaction.drug2.toLowerCase()))
    );
  };

  const generateDietPlan = () => {
    setDietGenerated(true);
  };

  const interactions = checkDrugInteractions();
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

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const fetchVitals = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/hypertensionVitals/me", {
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

    fetchVitals();
  }, [alertRefreshToken]);

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
        const res = await axios.get("http://localhost:3001/api/profile/me", {
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
      await axios.put("http://localhost:3001/api/profile", payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const res = await axios.get("http://localhost:3001/api/profile/me", {
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
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <div className="flex flex-row items-center gap-2">
          <HeartPulse color="#21a136" size={24} />
          <h1 className="text-xl font-semibold text-gray-800">
            SmartCare Dashboard
          </h1>
        </div>

        <div className="flex flex-row items-center gap-6">
          <button
            onClick={() => setLanguage((prev) => (prev === "en-US" ? "sw-TZ" : "en-US"))}
            className="flex flex-row bg-neutral-200 items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-300 transition-colors"
          >
            <Globe color="#27b049" size={16} />
            <span className="text-sm font-medium">{language === "en-US" ? "EN" : "SW"}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">SJ</span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Sarah Johnson
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center px-4 py-6 gap-6">
        
        {patient && (
          <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xl">
                  {(patient?.fullName?.[0] || patient?.firstname?.[0] || "P")}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {patient?.fullName || `${patient?.firstname ?? ""} ${patient?.lastname ?? ""}`.trim() || "Unknown Patient"}
                </h2>
                <p className="text-sm text-gray-600">
                  Age: {computeAge(patient?.dob)} | Weight: {patient?.weight ?? "—"} kg
                  <br />
                  Last check-in: {formatDateTime(vitals.length > 0 ? vitals[vitals.length - 1]?.createdAt : null)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Edit Profile
              </button>
              <div className="bg-emerald-400 text-white rounded-full px-4 py-2 text-sm font-medium">
                ● {patient?.status || "Active"}
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm text-gray-700">Full Name</label>
                  <input name="fullName" value={editForm.fullName || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-700">DOB</label>
                    <input type="date" name="dob" value={editForm.dob || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Gender</label>
                    <select name="gender" value={editForm.gender || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-700">Weight (kg)</label>
                    <input type="number" name="weight" value={editForm.weight ?? ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700">Height (cm)</label>
                    <input type="number" name="height" value={editForm.height ?? ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-700">Phone Number</label>
                  <input name="phoneNumber" value={editForm.phoneNumber || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
                <button onClick={handleSaveProfile} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Save</button>
              </div>
            </div>
          </div>
        )}

        <HypertensionAlert refreshToken={alertRefreshToken} />

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Enter Your Vitals
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Blood Pressure (mmHg)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  placeholder="Systolic (120)"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-400 focus:outline-none flex-1 w-1/2"
                />
                <span className="flex items-center text-gray-500 px-2">/</span>
                <input
                  type="number"
                  placeholder="Diastolic (80)"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-400 focus:outline-none flex-1 w-1/2"
                />
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => {
                    setListeningField("systolic");
                    startListening(language);
                  }}
                  disabled={listening}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 flex-1"
                >
                  <MicVocal size={16} />
                  Voice Systolic
                </button>
                <button
                  onClick={() => {
                    setListeningField("diastolic");
                    startListening(language);
                  }}
                  disabled={listening}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 flex-1"
                >
                  <MicVocal size={16} />
                  Voice Diastolic
                </button>
              </div>
              <div className="flex gap-2 items-center mt-2">
                {listening && (
                  <span className="text-xs text-emerald-700">Listening…</span>
                )}
                {transcript && (
                  <span className="text-xs text-gray-600">"{transcript}"</span>
                )}
                {error && (
                  <span className="text-xs text-red-600">{error}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Heart Rate (BPM)
              </label>
              <input
                type="number"
                placeholder="72"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-emerald-400 focus:outline-none"
              />
              <button
                onClick={() => {
                  setListeningField("heartRate");
                  startListening(language);
                }}
                disabled={listening}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
              >
                <MicVocal size={16} />
                Voice Heart Rate
              </button>
              <div className="flex items-center gap-2 mt-2">
                {listening && (
                  <span className="text-xs text-emerald-700">Listening…</span>
                )}
                {transcript && (
                  <span className="text-xs text-gray-600">"{transcript}"</span>
                )}
                {error && (
                  <span className="text-xs text-red-600">{error}</span>
                )}
              </div>
            </div>
          </div>

          {message && (
            <p className="text-sm mb-4 text-gray-700 font-medium">{message}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              disabled={!hasToken || !systolic || !diastolic || !heartRate}
            >
              {status === "loading" ? "Checking login..." : "Save Vitals"}
            </button>
          </div>
        </div>

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <MedicationAnalysisPage />
        </div>

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Lifestyle Assessment</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Substance Use</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={lifestyle.alcohol}
                    onChange={(e) => setLifestyle({...lifestyle, alcohol: e.target.checked})}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <Wine className="text-purple-600" size={16} />
                  <span className="text-sm text-gray-700">Regular alcohol consumption</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={lifestyle.smoking}
                    onChange={(e) => setLifestyle({...lifestyle, smoking: e.target.checked})}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <Cigarette className="text-purple-600" size={16} />
                  <span className="text-sm text-gray-700">Smoking/tobacco use</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Habits</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Coffee className="text-purple-600" size={16} />
                  <label className="text-sm text-gray-700">Caffeine intake (cups/day):</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={lifestyle.caffeine}
                    onChange={(e) => setLifestyle({...lifestyle, caffeine: parseInt(e.target.value) || 0})}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 mb-2 block">Exercise frequency:</label>
                  <select
                    value={lifestyle.exercise}
                    onChange={(e) => setLifestyle({...lifestyle, exercise: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">Select frequency</option>
                    <option value="none">No exercise</option>
                    <option value="low">1-2 times per week</option>
                    <option value="moderate">3-4 times per week</option>
                    <option value="high">5+ times per week</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Utensils className="text-green-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">AI Diet Recommendations</h3>
            </div>
            <button
              onClick={generateDietPlan}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Generate Diet Plan
            </button>
          </div>

          {dietGenerated && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-700">
                  <strong>AI Analysis:</strong> Based on your lifestyle assessment {lifestyle.alcohol && "(alcohol use noted)"} 
                  {lifestyle.smoking && "(smoking detected)"} and health data, here's your personalized diet plan:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">🌅 Breakfast</h4>
                  <p className="text-sm text-blue-700">{mockDietRecommendations.breakfast}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">🌞 Lunch</h4>
                  <p className="text-sm text-yellow-700">{mockDietRecommendations.lunch}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">🌙 Dinner</h4>
                  <p className="text-sm text-orange-700">{mockDietRecommendations.dinner}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">🍎 Snacks</h4>
                  <p className="text-sm text-purple-700">{mockDietRecommendations.snacks}</p>
                </div>
              </div>

              {(lifestyle.alcohol || lifestyle.smoking) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">⚠️ Lifestyle Recommendations</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {lifestyle.alcohol && <li>• Limit alcohol consumption to support cardiovascular health</li>}
                    {lifestyle.smoking && <li>• Consider smoking cessation programs for better heart health</li>}
                    {lifestyle.caffeine > 4 && <li>• Reduce caffeine intake to help manage blood pressure</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-emerald-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Health Trends</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <h4 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Blood Pressure Trends
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={vitals.length > 0 ? vitals : []}>
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
                    tickFormatter={(value) => value}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis domain={[60, 180]} fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => `Date: ${value}`}
                    formatter={(value, name) => [value, name]}
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
                    fill="url(#systolicGradient)"
                    name="Systolic" 
                    dot={{ fill: '#dc2626', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#dc2626' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    fill="url(#diastolicGradient)"
                    name="Diastolic" 
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {vitals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-red-600 text-sm font-medium">No data available</p>
                  <p className="text-red-500 text-xs mt-1">Save some vitals to see trends</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                Heart Rate Trends
              </h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={vitals.length > 0 ? vitals : []}>
                  <defs>
                    <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => value}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                    stroke="#6b7280"
                  />
                  <YAxis domain={[50, 120]} fontSize={12} stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => `Date: ${value}`}
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
                    fill="url(#heartRateGradient)"
                    name="Heart Rate" 
                    dot={{ fill: '#ea580c', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#ea580c' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {vitals.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-orange-600 text-sm font-medium">No data available</p>
                  <p className="text-orange-500 text-xs mt-1">Save some vitals to see trends</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Nearby Clinics
          </h3>
          <Provider />
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;