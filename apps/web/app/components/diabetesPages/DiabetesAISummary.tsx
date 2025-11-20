"use client";
import React, { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  vitalsId?: string;
  onComplete?: () => void;
}

const DiabetesAISummary: React.FC<Props> = ({ vitalsId, onComplete }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!vitalsId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/diabetesAi/summary/${vitalsId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      const brief = data.aiFeedback
        ? data.aiFeedback.split(". ").slice(0, 2).join(". ") + "."
        : "⚠️ No AI summary available yet.";

      setSummary(brief);
      localStorage.setItem(`AISummary_${vitalsId}`, brief);
      onComplete?.();
    } catch (err: any) {
      console.error("AI summary fetch error:", err);
      setError("❌ Failed to fetch summary. Check your connection or try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vitalsId) return;

    const saved = localStorage.getItem(`AISummary_${vitalsId}`);
    if (saved) setSummary(saved);
    else fetchSummary();
  }, [vitalsId, onComplete]);

  return (
    <div className="bg-white shadow-md p-5 rounded-lg border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-blue-700">
          🤖 Quick Health Summary
        </h3>

        {/* 🔄 Refresh button */}
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Fetching summary...</p>
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : summary ? (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-2">
          <p className="text-gray-800 whitespace-pre-wrap">{summary}</p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Submit vitals to see a quick summary.
        </p>
      )}
    </div>
  );
};

export default DiabetesAISummary;
