import React, { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  vitalsId?: string;
  onComplete?: () => void;
}

const DiabetesAISummary: React.FC<Props> = ({ vitalsId, onComplete }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Track which vitalsIds we've already fetched to prevent duplicates
  const fetchedIds = useRef(new Set<string>());

  useEffect(() => {
    if (!vitalsId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // ✅ Check localStorage first
    const savedSummary = localStorage.getItem(`AISummary_${vitalsId}`);
    if (savedSummary) {
      console.log("📋 Using cached summary for", vitalsId);
      setSummary(savedSummary);
      return;
    }

    // ✅ Prevent duplicate fetches for the same vitalsId
    if (fetchedIds.current.has(vitalsId)) {
      console.log("⏭️ Already fetching/fetched summary for", vitalsId);
      return;
    }

    // ✅ Mark this vitalsId as being fetched
    fetchedIds.current.add(vitalsId);

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("🔄 Fetching AI summary for vitalsId:", vitalsId);
        
        const res = await fetch(`${API_URL}/api/diabetesAi/summary/${vitalsId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        
        // ✅ Extract brief summary (first 2 sentences)
        const brief = data.aiFeedback
          ? data.aiFeedback.split(". ").slice(0, 2).join(". ") + "."
          : "⚠️ No AI summary available yet.";

        setSummary(brief);

        // ✅ Cache the summary
        localStorage.setItem(`AISummary_${vitalsId}`, brief);

        console.log("✅ Summary generated and cached for", vitalsId);
        
        // ✅ Call onComplete only once
        onComplete?.();
        
      } catch (err) {
        console.error("❌ AI summary fetch error:", err);
        const errorMsg = "❌ Could not fetch AI summary. Try again later.";
        setError(errorMsg);
        setSummary(errorMsg);
        
        // ✅ Remove from fetched set on error so retry is possible
        fetchedIds.current.delete(vitalsId);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [vitalsId]); // ✅ Only depend on vitalsId, not onComplete

  return (
    <div className="bg-white shadow-md p-5 rounded-lg border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-2 text-blue-700">
        🤖 Quick Health Summary
      </h3>

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
        <p className="text-gray-500 text-sm">
          Submit vitals to see a quick summary.
        </p>
      )}

      {error && (
        <button
          onClick={() => {
            fetchedIds.current.delete(vitalsId!);
            setError(null);
            setSummary(null);
            // Trigger re-fetch by forcing re-render
            window.location.reload();
          }}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default DiabetesAISummary;