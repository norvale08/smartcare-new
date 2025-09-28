"use client";
import React, { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  vitalsId?: string;
  enabled?: boolean;
  onComplete?: () => void;
}

const DiabetesAISummary: React.FC<Props> = ({ vitalsId, enabled = true, onComplete }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vitalsId || !enabled) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setSummary(null);

        const res = await fetch(`${API_URL}/api/diabetesVitals/ai/${vitalsId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const data = await res.json();

        if (data.aiFeedback) {
          // Keep AI summary short (max 2 sentences)
          const brief = data.aiFeedback.split(". ").slice(0, 2).join(". ") + ".";
          setSummary(brief);
          onComplete?.();
        } else if (data.aiProcessing) {
          setSummary("⏳ AI summary is being generated. Please check back shortly.");
        } else {
          setSummary("⚠️ No AI summary available.");
        }
      } catch (err) {
        console.error("AI summary fetch error:", err);
        setSummary("❌ Could not fetch AI summary. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [vitalsId, enabled, onComplete]);

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
