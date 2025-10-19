import React, { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  onComplete?: () => void;
}

interface HistoryItem {
  _id: string;
  foodAdvice: string;
  createdAt: string;
  updatedAt: string;
}

const DiabetesFoodAdvice: React.FC<Props> = ({ onComplete }) => {
  const [foodAdvice, setFoodAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const pollAttempts = useRef(0);
  const maxPollAttempts = 40;

  const getAuthToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("token") || sessionStorage.getItem("token")
      : null;

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const pollFoodStatus = async (id: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/food/recommendation/status/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data.success) {
        setLastUpdated(data.lastUpdated);

        if (data.isGenerating) {
          pollAttempts.current++;
          const dots = ".".repeat((pollAttempts.current % 3) + 1);
          setFoodAdvice(`🍽️ Generating personalized Kenyan food recommendations${dots}`);
          setIsGenerating(true);

          if (pollAttempts.current >= maxPollAttempts) {
            stopPolling();
            setError("Generation is taking longer than expected. Please refresh.");
            setIsGenerating(false);
          }
        } else {
          setFoodAdvice(data.foodAdvice || "⚠️ No food recommendations available.");
          setIsGenerating(false);
          pollAttempts.current = 0;
          stopPolling();
          onComplete?.();
          loadHistory(); // refresh history
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  const startPolling = (id: string) => {
    stopPolling();
    pollAttempts.current = 0;
    pollingInterval.current = setInterval(() => pollFoodStatus(id), 2000);
  };

  // Load latest recommendation and history
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        // Latest recommendation
        const latestRes = await fetch(`${API_URL}/api/food/recommendation/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (latestRes.ok) {
          const data = await latestRes.json();
          if (data.success && data.data) {
            setRecordId(data.data._id);
            setFoodAdvice(data.data.foodAdvice || null);
            setLastUpdated(data.data.updatedAt);
            if (data.data.isGenerating) {
              setIsGenerating(true);
              startPolling(data.data._id);
            }
          }
        }

        // History
        await loadHistory();
      } catch (err) {
        console.error("Error loading initial recommendations:", err);
      }
    };

    loadInitialData();
    return () => stopPolling();
  }, []);

  const loadHistory = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/food/recommendation/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setHistory(data.history || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please log in to get food recommendations");
        return;
      }

      const res = await fetch(`${API_URL}/api/food/recommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to generate recommendations");
        return;
      }

      if (data.recordId) {
        setRecordId(data.recordId);
        setFoodAdvice("🍽️ Generating personalized Kenyan food recommendations...");
        setIsGenerating(true);
        pollAttempts.current = 0;
        startPolling(data.recordId);
      }
    } catch (err) {
      console.error("Generate error:", err);
      setError("Failed to generate food recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (recordId && !isGenerating) {
      setIsGenerating(true);
      pollAttempts.current = 0;
      setFoodAdvice("🍽️ Refreshing food recommendations...");
      startPolling(recordId);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-yellow-50 shadow-lg rounded-2xl p-6 space-y-4 border-2 border-green-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="text-3xl mr-2">🇰🇪</span>
          <div>
            <div className="text-lg">Kenyan Food Plan</div>
            <div className="text-xs text-gray-600 font-normal">Personalized diabetes-friendly meals</div>
          </div>
        </h3>
        {recordId && !isGenerating && (
          <button
            onClick={handleRefresh}
            className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Refresh
          </button>
        )}
      </div>

      {/* Generate Button */}
      {!foodAdvice && !loading && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-700 mb-3">
              Get a personalized meal plan with authentic Kenyan foods like:
            </p>
            <div className="flex flex-wrap gap-2">
              {["Ugali", "Sukuma Wiki", "Githeri", "Omena", "Ndengu", "Managu", "Arrow Roots"].map(food => (
                <span key={food} className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {food}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Loading...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🍽️</span> Generate My Kenyan Food Plan
              </span>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Latest Recommendation */}
      {(foodAdvice || isGenerating) && (
        <div
          className={`p-6 rounded-xl border-2 transition-all duration-300 ${
            isGenerating 
              ? "bg-blue-50 border-blue-400 animate-pulse" 
              : "bg-white border-green-300 shadow-sm"
          }`}
        >
          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {foodAdvice}
          </div>

          {lastUpdated && !isGenerating && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                📅 {new Date(lastUpdated).toLocaleDateString('en-KE', { 
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">🇰🇪 Kenyan Foods</span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Diabetes-Friendly</span>
              </div>
            </div>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-blue-700">
              Preparing your personalized Kenyan meal plan...
            </span>
          </div>
          <div className="text-xs text-gray-600 flex items-center gap-2">
            <span>⏱️</span> This may take 10-20 seconds
          </div>
        </div>
      )}

      {/* History */}
      <div className="mt-6">
        <h4 className="font-bold mb-2">📜 Previous Recommendations</h4>
        {history.length === 0 && <p className="text-sm text-gray-500">No previous recommendations.</p>}
        <div className="space-y-4">
          {history.map(rec => (
            <div key={rec._id} className="p-4 border rounded-lg bg-gray-50">
              <div className="text-xs text-gray-400 mb-2">
                {new Date(rec.createdAt).toLocaleString("en-KE")}
              </div>
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {rec.foodAdvice || "⚠️ Not generated yet."}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiabetesFoodAdvice;
