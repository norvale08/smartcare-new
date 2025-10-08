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

  // ✅ Load the summary for this vitalsId from localStorage
  useEffect(() => {
    if (!vitalsId) return;

    const savedSummary = localStorage.getItem(`AISummary_${vitalsId}`);
    if (savedSummary) setSummary(savedSummary);
  }, [vitalsId]);

  // ✅ Fetch summary from backend if not in localStorage
  useEffect(() => {
    if (!vitalsId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchSummary = async () => {
      // Already have summary for this vitalsId? Skip fetch
      if (localStorage.getItem(`AISummary_${vitalsId}`)) return;

      setLoading(true);
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

        // ✅ Persist summary per vitalsId
        localStorage.setItem(`AISummary_${vitalsId}`, brief);

        onComplete?.();
      } catch (err) {
        console.error("AI summary fetch error:", err);
        setSummary("❌ Could not fetch AI summary. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [vitalsId, onComplete]);

  return (
    <div className="bg-white shadow-md p-5 rounded-lg border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-2 text-blue-700">🤖 Quick Health Summary</h3>

      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Generating summary...</p>
        </div>
      ) : summary ? (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-2">
          <p className="text-gray-800 whitespace-pre-wrap">{summary}</p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Submit vitals to see a quick summary.</p>
      )}
    </div>
  );
};

export default DiabetesAISummary;
