'use client';

import { useState } from 'react';
import { Pill, AlertCircle, CheckCircle } from 'lucide-react';

export default function MedicationAnalysisPage() {
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState('');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      const response = await fetch(`${API_URL}/api/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications,
          patientAge: age ? parseInt(age) : undefined,
          conditions: conditions ? conditions.split(',').map(c => c.trim()) : [],
          language,
        }),
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Medication Interaction Analysis</h1>

      <div className="shadow-lg bg-white w-full rounded-lg px-6 py-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Pill className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">Medication Management</h3>
        </div>

        {/* Add Medication */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Add Prescribed Medication</label>
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
              Add
            </button>
          </div>
        </div>

        {/* Medication List */}
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

        {/* Age, Conditions, Language */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Patient Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Conditions (optional)"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'sw')}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="en">English</option>
            <option value="sw">Swahili</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze Medications'}
        </button>

        {errorMsg && <p className="text-red-600 mt-4">{errorMsg}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {result.safetyNotes && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-yellow-800">⚠️ Safety Notes</h2>
              <p className="text-gray-800 mt-2">{result.safetyNotes}</p>
            </div>
          )}

          {result.generalRecommendations && (
            <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-blue-800">📋 General Recommendations</h2>
              <p className="text-gray-800 mt-2">{result.generalRecommendations}</p>
            </div>
          )}

          {Array.isArray(result.interactions) && result.interactions.length > 0 && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-red-800">💊 Drug Interactions</h2>
              <ul className="mt-4 space-y-4">
                {result.interactions.map((interaction: any, index: number) => (
                  <li key={index} className="bg-white border p-4 rounded shadow-sm">
                    <p className="font-semibold text-red-700">
                      {interaction.drug1} × {interaction.drug2} —{' '}
                      <span className="uppercase">{interaction.severity}</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Warning:</strong> {interaction.warning}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Recommendation:</strong> {interaction.recommendation}
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
                  No drug interactions detected
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
