'use client';

import { useState } from 'react';
import { Pill, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../../lib/TranslationContext';

export default function MedicationAnalysisPage() {
  const { t, language } = useTranslation();
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const addMedication = () => {
    const trimmed = newMedication.trim();
    if (trimmed && !medications.includes(trimmed)) {
      setMedications([...medications, trimmed]);
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setErrorMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setErrorMsg('Please log in to analyze medications.');
        setLoading(false);
        return;
      }

      // Pass language parameter to API
      const languageParam = language === "sw-TZ" ? "sw-TZ" : "en-US";
      const response = await fetch(`${API_URL}/api/medications/analyze?language=${languageParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ medications }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Something went wrong.');
      } else {
        setResult(data.aiAnalysis);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Network or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {language === "sw-TZ" ? "Uchambuzi wa Mwingiliano wa Dawa" : "Medication Interaction Analysis"}
      </h1>

      <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Pill className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">
            {language === "sw-TZ" ? "Usimamizi wa Dawa" : "Medication Management"}
          </h3>
        </div>

        {/* Add Medication */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            {language === "sw-TZ" ? "Ongeza Dawa Iliyoagizwa" : "Add Prescribed Medication"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Aspirin 81mg"
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMedication()}
              className="border-2 border-gray-300 rounded-lg px-3 py-2 flex-1 focus:border-blue-400 focus:outline-none"
            />
            <button
              onClick={addMedication}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {language === "sw-TZ" ? "Ongeza" : "Add"}
            </button>
          </div>
        </div>

        {/* Medication List */}
        {medications.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {language === "sw-TZ" ? "Dawa za Sasa" : "Current Medications"}
            </h4>
            <div className="space-y-2">
              {medications.map((med, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm font-medium text-gray-800">{med}</span>
                  <button
                    onClick={() => removeMedication(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    {language === "sw-TZ" ? "Ondoa" : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No extra inputs needed; age and condition are auto-read from profile */}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {loading 
            ? (language === "sw-TZ" ? "Inachambua..." : "Analyzing...") 
            : (language === "sw-TZ" ? "Chambua Dawa" : "Analyze Medications")
          }
        </button>

        {errorMsg && <p className="text-red-600 mt-4">{errorMsg}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {result.safetyNotes && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-yellow-800">
                {language === "sw-TZ" ? "⚠️ Vidokezo vya Usalama" : "⚠️ Safety Notes"}
              </h2>
              <p className="text-gray-800 mt-2 whitespace-pre-wrap">{result.safetyNotes}</p>
            </div>
          )}

          {result.generalRecommendations && (
            <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-blue-800">
                {language === "sw-TZ" ? "📋 Mapendekezo ya Jumla" : "📋 General Recommendations"}
              </h2>
              <p className="text-gray-800 mt-2 whitespace-pre-wrap">{result.generalRecommendations}</p>
            </div>
          )}

          {Array.isArray(result.interactions) && result.interactions.length > 0 && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-red-800">
                {language === "sw-TZ" ? "💊 Mwingiliano wa Dawa" : "💊 Drug Interactions"}
              </h2>
              <ul className="mt-4 space-y-4">
                {result.interactions.map((interaction: any, index: number) => (
                  <li key={index} className="bg-white border p-4 rounded shadow-sm">
                    <p className="font-semibold text-red-700">
                      {interaction.drug1} × {interaction.drug2} —{' '}
                      <span className="uppercase">{interaction.severity}</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>{language === "sw-TZ" ? "Onyo:" : "Warning:"}</strong> {interaction.warning}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>{language === "sw-TZ" ? "Mapendekezo:" : "Recommendation:"}</strong> {interaction.recommendation}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.interactions?.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={18} />
                <span className="text-sm font-medium text-green-800">
                  {language === "sw-TZ" 
                    ? "Hakuna mwingiliano wa dawa uliogunduliwa" 
                    : "No drug interactions detected"
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
