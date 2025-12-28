// components/FinalFeedback.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import { toast } from "react-hot-toast";
import { FaHeart, FaRedo } from "react-icons/fa";
import { MdCheckCircle } from "react-icons/md";

interface FoodAdvice {
  breakfast: string;
  lunch: string;
  supper: string;
  foods_to_avoid: string;
}

interface ComprehensiveFeedbackData {
  comprehensiveFeedback: string;
  components: {
    summary: string;
    foodAdvice: FoodAdvice;
    quickTips: string;
    lifestyleFeedback: string;
  };
  context: {
    glucose: number;
    context: string;
    bloodPressure: string;
    heartRate: string;
    exercise: string;
    lifestyleRecorded: boolean;
  };
  recommendations: {
    recordBloodPressure: boolean;
    recordHeartRate: boolean;
    completeLifestyle: boolean;
  };
}

interface FinalFeedbackProps {
  onFeedbackGenerated?: (feedback: string) => void;
}

const FinalFeedback: React.FC<FinalFeedbackProps> = ({ onFeedbackGenerated }) => {
  const [feedback, setFeedback] = useState<string>("💪 Your comprehensive health feedback will appear here once generated.");
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getAuthToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    checkForExistingData();
  }, []);

  const checkForExistingData = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/diabetesVitals/glucose/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHasData(data.success && data.data);
      }
    } catch (error) {
      console.error("Error checking for data:", error);
    }
  };

  const generateComprehensiveFeedback = async () => {
    setLoading(true);
    setIsGenerating(true);
    setFeedback("💪 Generating your comprehensive health feedback...");

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Please log in to generate feedback");
        return;
      }

      const response = await fetch(`${API_URL}/api/latest-comprehensive-feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate feedback");
      }

      if (data.success && data.data) {
        // ✅ Extract just the comprehensive feedback string from the full object
        const feedbackText = data.data.comprehensiveFeedback;
        setFeedback(feedbackText);
        setLastUpdated(new Date().toISOString());
        toast.success("Comprehensive feedback generated!");
        
        // ✅ Pass only the string to the parent component
        onFeedbackGenerated?.(feedbackText);
      } else {
        throw new Error("No feedback data received");
      }
    } catch (error: any) {
      console.error("Error generating feedback:", error);
      toast.error(error.message || "Failed to generate feedback");
      setFeedback("💪 Failed to generate feedback. Please try again.");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    if (!isGenerating) {
      await generateComprehensiveFeedback();
    } else {
      toast("Feedback is already being generated");
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FaHeart className="text-3xl text-red-500 mr-3" />
          <div>
            <h3 className="text-2xl font-bold text-gray-800">AI Health Analysis</h3>
            <p className="text-sm text-gray-600">Comprehensive feedback based on your health data</p>
          </div>
        </div>
      </div>

      <div
        className={`p-5 rounded-xl border-l-4 transition-all duration-300 ${
          isGenerating
            ? "bg-blue-50 border-blue-600"
            : feedback.includes("Failed") || feedback.includes("Network error")
            ? "bg-red-50 border-red-600"
            : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-600"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold flex items-center">
            <span className="text-2xl mr-2">💪</span>
            <span
              className={
                isGenerating
                  ? "text-blue-700"
                  : feedback.includes("Failed") || feedback.includes("Network error")
                  ? "text-red-700"
                  : "text-green-700"
              }
            >
              {isGenerating ? "Generating..." : "Your Health Report"}
            </span>
          </h4>

          <Button
            onClick={handleRefresh}
            disabled={isGenerating || loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-sm"
          >
            <FaRedo className={`text-xs ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Refresh"}
          </Button>
        </div>

        <div className={`text-gray-800 text-base leading-relaxed ${isGenerating ? "animate-pulse" : ""}`}>
          {feedback}
        </div>

        {lastUpdated && !isGenerating && (
          <div className="text-xs text-gray-500 mt-3 flex items-center">
            <MdCheckCircle className="mr-1 text-green-600" />
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      {!hasData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Please add glucose data first to generate personalized feedback.
          </p>
        </div>
      )}

      <Button
        onClick={generateComprehensiveFeedback}
        disabled={loading || isGenerating || !hasData}
        className="w-full font-semibold py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <FaRedo className="animate-spin" />
            Generating Feedback...
          </>
        ) : (
          <>
            <FaHeart />
            Generate Health Report
          </>
        )}
      </Button>
    </div>
  );
};

export default FinalFeedback;