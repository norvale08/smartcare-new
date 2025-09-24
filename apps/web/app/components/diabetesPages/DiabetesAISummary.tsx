"use client";
import React, { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  vitalsId?: string;
  enabled?: boolean;                  // Optional: whether to fetch AI summary
  onComplete?: () => void;            // Optional: callback when AI summary is ready
}

const DiabetesAISummary: React.FC<Props> = ({ vitalsId, enabled = true, onComplete }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  useEffect(() => {
    if (!vitalsId || !enabled) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setSummary(null);

    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_URL}/api/diabetesVitals/ai/${vitalsId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.aiFeedback) {
          setSummary(data.aiFeedback);
          setAiProcessing(false);
          onComplete?.();   // Call callback if provided
        } else if (data.aiProcessing) {
          setAiProcessing(true);
        } else {
          setSummary("No AI summary available for this reading.");
        }
      } catch (err) {
        console.error(err);
        setSummary("❌ Failed to fetch AI summary.");
        setAiProcessing(false);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSummary();
    // Poll every 5 seconds if AI feedback not ready
    const interval: number = window.setInterval(fetchSummary, 5000);

    return () => window.clearInterval(interval);
  }, [vitalsId, enabled, onComplete]);

  return (
    <div className="bg-white shadow-md p-5 rounded-lg border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-2 text-blue-700">
        🤖 Quick Health Summary
      </h3>

      {loading || aiProcessing ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">
            {loading ? "Fetching summary..." : "AI is processing..."}
          </p>
        </div>
      ) : summary ? (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-2">
          <p className="text-gray-800 whitespace-pre-wrap">{summary}</p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Submit vitals to get your AI summary.
        </p>
      )}
    </div>
  );
};

export default DiabetesAISummary;
