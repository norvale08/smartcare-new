"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import { toast } from "react-hot-toast";
import { FaHeart, FaRedo } from "react-icons/fa";
import { MdCheckCircle } from "react-icons/md";

interface FinalFeedbackProps {
  // Props can be passed from parent component if needed
  onFeedbackGenerated?: (feedback: string) => void;
}

const FinalFeedback: React.FC<FinalFeedbackProps> = ({ onFeedbackGenerated }) => {
  const [feedback, setFeedback] = useState<string>("💪 Your motivational feedback will appear here once generated.");
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getAuthToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  // Load existing feedback on mount
  useEffect(() => {
    loadExistingFeedback();
  }, []);

  const loadExistingFeedback = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      // Try to get the latest glucose reading with all data
      const response = await fetch(`${API_URL}/api/glucose/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setHasData(true);
          
          // Check if final feedback exists
          if (data.data.finalFeedback) {
            setFeedback(data.data.finalFeedback);
            setLastUpdated(data.data.updatedAt);
          }
        }
      }
    } catch (error) {
      console.error("Error loading existing feedback:", error);
    }
  };

  const generateFinalFeedback = async () => {
    setLoading(true);
    setIsGenerating(true);
    setFeedback("💪 Generating your personalized motivational feedback...");

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Please log in to generate feedback");
        return;
      }

      // Get latest glucose data
      const glucoseResponse = await fetch(`${API_URL}/api/glucose/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!glucoseResponse.ok) {
        toast.error("Please add glucose data first");
        return;
      }

      const glucoseData = await glucoseResponse.json();
      if (!glucoseData.success || !glucoseData.data) {
        toast.error("No glucose data found. Please add a reading first.");
        return;
      }

      const latestReading = glucoseData.data;

      // Get lifestyle data if available
      let lifestyleData = null;
      try {
        const lifestyleResponse = await fetch(`${API_URL}/api/lifestyle/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (lifestyleResponse.ok) {
          const lifestyle = await lifestyleResponse.json();
          if (lifestyle.success && lifestyle.data) {
            lifestyleData = {
              exercise: lifestyle.data.exercise,
              sleep: lifestyle.data.sleep,
              alcohol: lifestyle.data.alcohol,
              smoking: lifestyle.data.smoking,
            };
          }
        }
      } catch (error) {
        console.log("No lifestyle data available");
      }

      // Prepare request body for final feedback
      const requestBody: any = {
        glucose: latestReading.glucose,
        context: latestReading.context,
        language: latestReading.language || "en",
      };

      // Add optional fields if available
      if (latestReading.bloodPressure) {
        requestBody.bloodPressure = latestReading.bloodPressure;
      }
      if (latestReading.weight) requestBody.weight = latestReading.weight;
      if (latestReading.height) requestBody.height = latestReading.height;
      if (latestReading.age) requestBody.age = latestReading.age;
      if (latestReading.gender) requestBody.gender = latestReading.gender;
      if (lifestyleData) requestBody.lifestyle = lifestyleData;

      // Call final feedback API
      const response = await fetch(`${API_URL}/api/final-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to generate feedback");
        setFeedback("💪 Failed to generate feedback. Please try again.");
        return;
      }

      if (data.success && data.feedback) {
        setFeedback(data.feedback);
        setLastUpdated(new Date().toISOString());
        toast.success("Motivational feedback generated!");
        onFeedbackGenerated?.(data.feedback);
      } else {
        toast.error("No feedback received");
        setFeedback("💪 Unable to generate feedback at this time.");
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast.error("Network error. Please check your connection.");
      setFeedback("💪 Network error. Please try again.");
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    if (!isGenerating) {
      await generateFinalFeedback();
    } else {
      toast("Feedback is already being generated", { icon: "ℹ️" });
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaHeart className="text-3xl text-red-500 mr-3" />
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Final Motivational Feedback</h3>
            <p className="text-sm text-gray-600">Get personalized encouragement based on your health data</p>
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
              {isGenerating ? "Generating..." : "Your Motivation"}
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

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">ℹ️ How it works:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Uses your latest glucose reading</li>
          <li>• Considers your blood pressure (if available)</li>
          <li>• Factors in your lifestyle habits</li>
          <li>• Provides brief, actionable, and motivating feedback</li>
        </ul>
      </div>

      {!hasData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Please add glucose data first to generate personalized feedback.
          </p>
        </div>
      )}

      <Button
        onClick={generateFinalFeedback}
        disabled={loading || isGenerating}
        className="w-full font-semibold py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <FaRedo className="animate-spin" />
            Generating Feedback...
          </>
        ) : (
          <>
            <FaHeart />
            Generate Motivational Feedback
          </>
        )}
      </Button>
    </div>
  );
};

export default FinalFeedback;