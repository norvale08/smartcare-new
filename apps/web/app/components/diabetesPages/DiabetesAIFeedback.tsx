"use client";
import React, { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  vitalsId?: string;
  enabled: boolean;
  onComplete?: () => void; // ✅ allow parent to pass a callback
}

const DiabetesAIFeedback: React.FC<Props> = ({ vitalsId, enabled, onComplete }) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !vitalsId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setFeedback("Generating final AI feedback...");

    const fetchFeedback = async () => {
      try {
        const res = await fetch(`${API_URL}/api/diabetesVitals/final/${vitalsId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.aiFeedback) {
          setFeedback(data.aiFeedback);
          setLoading(false);

          // ✅ Notify parent once feedback is ready
          if (onComplete) onComplete();
        } else {
          setFeedback("⚠️ No AI feedback available yet.");
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setFeedback("❌ Failed to fetch AI feedback.");
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [vitalsId, enabled, onComplete]);

  return (
    <div className="bg-white shadow-md p-5 rounded-lg border-l-4 border-purple-500">
      <h3 className="text-lg font-semibold mb-2 text-purple-700 flex items-center gap-2">
        🤖 Final AI Feedback
      </h3>

      {loading ? (
        <p className="text-gray-500">Analyzing your data...</p>
      ) : feedback ? (
        <p className="text-gray-800 whitespace-pre-wrap">{feedback}</p>
      ) : (
        <p className="text-gray-500 text-sm">
          Complete all steps to get your final AI feedback.
        </p>
      )}
    </div>
  );
};

export default DiabetesAIFeedback;
