"use client";

import React, { useState, useEffect } from "react";
import {HeartPulse,Globe,TriangleAlert,MicVocal,Pill,Utensils,AlertCircle,CheckCircle,Wine,Cigarette,Coffee,Activity,
} from "lucide-react";
import dynamic from "next/dynamic";
import axios from 'axios';
import MedicationAnalysisPage from "../components/hypertension/medicationAnalysis";
import { useSession } from "next-auth/react";
import HypertensionAlert from "../components/hypertension/alert";
import { useVoiceInput } from "../components/hypertension/useVoiceInput";
import { wordsToNumbers } from "../components/hypertension/words-to-numbers"
import Lifestyle from "../components/hypertension/Lifestyle";
import ProfileCard from "../components/hypertension/ProfileCard";
import VitalsEntry from "../components/hypertension/VitalsEntry";
import Diet from "../components/hypertension/Diet";
import Charts from "../components/hypertension/charts";

//Mock drug data


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
            {patient?.fullName || `${patient?.firstname ?? ""} ${patient?.lastname ?? ""}`.trim() || "Unknown Patient"}
                
              {/* Sarah Johnson */}
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center px-4 py-6 gap-6">
        
        {patient && (
          <ProfileCard
            patient={patient}
            lastCheckIn={formatDateTime(vitals.length > 0 ? vitals[vitals.length - 1]?.createdAt : null)}
            onEdit={() => setIsEditing(true)}
          />
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

        <HypertensionAlert 
          refreshToken={alertRefreshToken}
          age={patient?.dob ? Number(computeAge(patient.dob)) : 0}
        />

        <VitalsEntry
          systolic={systolic}
          diastolic={diastolic}
          heartRate={heartRate}
          setSystolic={setSystolic}
          setDiastolic={setDiastolic}
          setHeartRate={setHeartRate}
          listening={listening}
          transcript={transcript}
          error={error}
          onVoiceSystolic={() => { setListeningField("systolic"); startListening(language); }}
          onVoiceDiastolic={() => { setListeningField("diastolic"); startListening(language); }}
          onVoiceHeartRate={() => { setListeningField("heartRate"); startListening(language); }}
          canSave={hasToken && systolic && diastolic && heartRate}
          onSave={handleSubmit}
          statusText={status === "loading" ? "Checking login..." : "Save Vitals"}
        />

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <MedicationAnalysisPage />
        </div>

        <Lifestyle lifestyle={lifestyle} setLifestyle={setLifestyle} />

        <Diet
          dietGenerated={dietGenerated}
          onGenerate={generateDietPlan}
          lifestyle={lifestyle}
          recommendations={mockDietRecommendations}
        />

        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <Charts vitals={vitals} />
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
