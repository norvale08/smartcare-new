"use client";
import React, { useState, useEffect } from "react";
import TTSReader from "./components/TTSReader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  vitalsId?: string;
  onComplete?: () => void;
  language?: "en" | "sw";
  autoPlayVoice?: boolean; // Auto-play TTS when feedback loads
}

// Language content
const languageContent = {
  en: {
    title: " AI Health Feedback",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    fetching: "Fetching feedback...",
    error: " Failed to fetch feedback. Check your connection or try again.",
    noSummary: "No AI feedback available yet.",
    submitPrompt: "Submit vitals with AI enabled to see feedback.",
  },
  sw: {
    title: "Maoni ya AI ya Afya",
    refresh: "Onyesha Upya",
    refreshing: "Inasasisha...",
    fetching: "Inapakia maoni...",
    error: "Imeshindwa kupata maoni. Angalia muunganisho wako au jaribu tena.",
    noSummary: "Maoni ya AI hayapatikani bado.",
    submitPrompt: "Wasilisha viwango na AI ili kuona maoni.",
  }
};

const DiabetesAISummary: React.FC<Props> = ({ 
  vitalsId, 
  onComplete, 
  language = "en",
  autoPlayVoice = false,
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLang = languageContent[language];

  const fetchSummary = async () => {
    if (!vitalsId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/diabetesAi/summary/${vitalsId}?language=${language}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      const fullFeedback = data.aiFeedback || currentLang.noSummary;

      setSummary(fullFeedback);
      localStorage.setItem(`AISummary_${vitalsId}`, fullFeedback);
      onComplete?.();
    } catch (err: any) {
      console.error("AI summary fetch error:", err);
      setError(currentLang.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vitalsId) return;

    const saved = localStorage.getItem(`AISummary_${vitalsId}`);
    if (saved) {
      setSummary(saved);
    } else {
      fetchSummary();
    }
  }, [vitalsId, language]);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg p-6 rounded-2xl border-2 border-blue-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-blue-800">
          {currentLang.title}
        </h3>

        {/* Refresh button */}
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? currentLang.refreshing : currentLang.refresh}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center space-x-3 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600"></div>
          <p className="text-gray-600 font-medium">{currentLang.fetching}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      ) : summary ? (
        <div className="space-y-4">
          {/* Feedback text */}
          <div className="bg-white border-2 border-blue-200 p-4 rounded-lg shadow-sm">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {summary}
            </p>
          </div>

          {/* ✅ TTS Reader Component */}
          <TTSReader
            text={summary}
            language={language}
            autoPlay={autoPlayVoice}
            showControls={true}
            onComplete={() => {
              console.log("✅ Finished reading AI feedback");
            }}
          />
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
          <p className="text-gray-600">{currentLang.submitPrompt}</p>
        </div>
      )}
    </div>
  );
};

export default DiabetesAISummary;