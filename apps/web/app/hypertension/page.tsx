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



//Connection to the database

// Mock data for demonstration
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
  //Connection to database
  
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
  // const [systolic, setSystolic] = useState("");
  // const [diastolic, setDiastolic] = useState("");
  // const [heartRate, setHeartRate] = useState("");
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
    // Mock AI drug interaction check
    return mockDrugInteractions.filter(interaction => 
      medications.some(med => med.toLowerCase().includes(interaction.drug1.toLowerCase())) &&
      medications.some(med => med.toLowerCase().includes(interaction.drug2.toLowerCase()))
    );
  };

  const generateDietPlan = () => {
    setDietGenerated(true);
    // Mock AI diet generation based on lifestyle
  };

  const interactions = checkDrugInteractions();
  const Provider = dynamic(() => import("../components/maps/ProviderMap"), {
    ssr: false,
  });
  

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <div className="flex flex-row items-center gap-2">
          <HeartPulse color="#21a136" size={24} />
          <h1 className="text-xl font-semibold text-gray-800">
            SmartCare Dashboard
          </h1>
        </div>

        <div className="flex flex-row items-center gap-6">
          <button className="flex flex-row bg-neutral-200 items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-300 transition-colors">
            <Globe color="#27b049" size={16} />
            <span className="text-sm font-medium">EN</span>
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

      {/* Main Content */}
      <main className="flex flex-col items-center px-4 py-6 gap-6">
        
        {/* Patient Info Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xl">SJ</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Sarah Johnson
              </h2>
              <p className="text-sm text-gray-600">
                Age: 34 | Patient ID: #12345
                <br />
                Last check-in: Today, 2:30 PM
              </p>
            </div>
          </div>
          <div className="bg-emerald-400 text-white rounded-full px-4 py-2 text-sm font-medium">
            ● Stable
          </div>
        </div>
        

        {/* Health Alert */}
        <HypertensionAlert refreshToken={alertRefreshToken} />

        {/* Enter Your Vitals */}
        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Enter Your Vitals</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Blood Pressure (mmHg)</label>
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
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors">
                <MicVocal size={16} />
                Voice Input
              </button>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Heart Rate (BPM)</label>
              <input
                type="number"
                placeholder="72"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-emerald-400 focus:outline-none"
              />
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors">
                <MicVocal size={16} />
                Voice Input
              </button>
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
              {status === 'loading' ? 'Checking login...' : 'Save Vitals'}
            </button>
          </div>
          {!hasToken && (
            <p className="text-red-600 text-sm mt-2">You must be logged in to save vitals.</p>
          )}
        </div>

        {/* Medication Management */}
        {/* <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Pill className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">Medication Management</h3>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Add Prescribed Medication</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter medication name (e.g., Aspirin 81mg)"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                className="border-2 border-gray-300 rounded-lg px-3 py-2 flex-1 focus:border-blue-400 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addMedication()}
              />
              <button
                onClick={addMedication}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {medications.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Medications</h4>
              <div className="space-y-2">
                {medications.map((med, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-800">{med}</span>
                    <button
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {interactions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-red-600" size={18} />
                <h4 className="text-sm font-semibold text-red-800">Drug Interaction Warnings</h4>
              </div>
              {interactions.map((interaction, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      interaction.severity === 'High' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {interaction.severity} Risk
                    </span>
                    <span className="text-sm text-red-700">
                      {interaction.drug1} + {interaction.drug2}
                    </span>
                  </div>
                  <p className="text-xs text-red-600">{interaction.warning}</p>
                </div>
              ))}
            </div>
          )}

          {medications.length > 0 && interactions.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={18} />
                <span className="text-sm font-medium text-green-800">No drug interactions detected</span>
              </div>
            </div>
          )}
        </div> */}
        <MedicationAnalysisPage />

        {/* Lifestyle Assessment */}
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

        {/* AI Diet Recommendations */}
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

        {/* Charts Section */}
        <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-4">Blood Pressure (3 Weeks)</h4>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center border">
                <div className="text-center">
                  <div className="w-40 h-24 bg-gradient-to-r from-red-200 via-red-300 to-red-400 rounded-lg mb-3 flex items-center justify-center">
                    <div className="text-red-700 text-xs font-medium">
                      <div className="flex items-center justify-between w-32 text-xs">
                        <span>120/80</span>
                        <span>125/85</span>
                        <span>130/90</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">Trending upward</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold text-gray-800 mb-4">Heart Rate (3 Weeks)</h4>
              <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center border">
                <div className="text-center">
                  <div className="w-40 h-24 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 rounded-lg mb-3 flex items-center justify-center">
                    <div className="text-orange-700 text-xs font-medium">
                      <div className="flex items-center justify-between w-32 text-xs">
                        <span>72</span>
                        <span>75</span>
                        <span>78</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs">Slightly elevated</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Clinics */}
        <div className="w-full max-w-4xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Nearby Clinics
          </h3>
          
          {/* <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <Provider />
              <p className="text-gray-600">Map component would be rendered here</p>
            </div>
          </div> */}
          <Provider />
          
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;