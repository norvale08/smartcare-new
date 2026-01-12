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
  language?: "en" | "sw"; 
}


const languageContent = {
  en: {
    title: "AI Health Analysis",
    subtitle: "Comprehensive feedback based on your health data",
    generating: "Generating...",
    yourReport: "Your Health Report",
    refresh: "Refresh",
    lastUpdated: "Last updated:",
    addDataNote: "Please add glucose data first to generate personalized feedback.",
    noteLabel: "Note:",
    generateButton: "Generate Health Report",
    generatingButton: "Generating Feedback...",
    placeholder: "Your comprehensive health feedback will appear here once generated.",
    generatingText: " Generating your comprehensive health feedback...",
    failed: "Failed to generate feedback. Please try again.",
    loginRequired: "Please log in to generate feedback",
    successMessage: "Comprehensive feedback generated!",
    alreadyGenerating: "Feedback is already being generated",
    errorMessage: "Failed to generate feedback",
    noData: "No feedback data received",
  },
  sw: {
    title: "Uchambuzi wa Afya wa AI",
    subtitle: "Maoni kamili kulingana na data yako ya afya",
    generating: "Inaunda...",
    yourReport: "Ripoti Yako ya Afya",
    refresh: "Onyesha Upya",
    lastUpdated: "Ilisasishwa mwisho:",
    addDataNote: "Tafadhali ongeza data ya sukari kwanza ili kupata maoni ya kibinafsi.",
    noteLabel: "Kumbuka:",
    generateButton: "Tengeneza Ripoti ya Afya",
    generatingButton: "Inaunda Maoni...",
    placeholder: "Maoni yako kamili ya afya yataonekana hapa yanapoundwa.",
    generatingText: " Inaunda maoni yako kamili ya afya...",
    failed: "Imeshindwa kuunda maoni. Tafadhali jaribu tena.",
    loginRequired: "Tafadhali ingia ili kuunda maoni",
    successMessage: "Maoni kamili yameundwa!",
    alreadyGenerating: "Maoni tayari yanaundwa",
    errorMessage: "Imeshindwa kuunda maoni",
    noData: "Hakuna data ya maoni iliyopokelewa",
  }
};

const FinalFeedback: React.FC<FinalFeedbackProps> = ({ 
  onFeedbackGenerated, 
  language = "en" 
}) => {
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const currentLang = languageContent[language];

  //  Update placeholder when language changes
  useEffect(() => {
    if (!feedback || feedback === languageContent.en.placeholder || feedback === languageContent.sw.placeholder) {
      setFeedback(currentLang.placeholder);
    }
  }, [language]);

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
    setFeedback(currentLang.generatingText);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error(currentLang.loginRequired);
        return;
      }

      const response = await fetch(`${API_URL}/api/latest-comprehensive-feedback?language=${language}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || currentLang.errorMessage);
      }

      if (data.success && data.data) {
        // Extract just the comprehensive feedback string from the full object
        const feedbackText = data.data.comprehensiveFeedback;
        setFeedback(feedbackText);
        setLastUpdated(new Date().toISOString());
        toast.success(currentLang.successMessage);
        
        // Pass only the string to the parent component
        onFeedbackGenerated?.(feedbackText);
      } else {
        throw new Error(currentLang.noData);
      }
    } catch (error: any) {
      console.error("Error generating feedback:", error);
      toast.error(error.message || currentLang.errorMessage);
      setFeedback(currentLang.failed);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    if (!isGenerating) {
      await generateComprehensiveFeedback();
    } else {
      toast(currentLang.alreadyGenerating);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FaHeart className="text-3xl text-fuchsia-600 mr-3" />
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{currentLang.title}</h3>
            <p className="text-sm text-gray-600">{currentLang.subtitle}</p>
          </div>
        </div>
      </div>

      <div
        className={`p-5 rounded-xl border-l-4 transition-all duration-300 ${
          isGenerating
            ? "bg-blue-50 border-blue-600"
            : feedback.includes("Failed") || feedback.includes("Imeshindwa") || feedback.includes("Network error")
            ? "bg-red-50 border-red-600"
            : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-600"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-bold flex items-center">
            
            <span
              className={
                isGenerating
                  ? "text-blue-700"
                  : feedback.includes("Failed") || feedback.includes("Imeshindwa") || feedback.includes("Network error")
                  ? "text-red-700"
                  : "text-green-700"
              }
            >
              {isGenerating ? currentLang.generating : currentLang.yourReport}
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
            {isGenerating ? currentLang.generating : currentLang.refresh}
          </Button>
        </div>

        <div className={`text-gray-800 text-base leading-relaxed ${isGenerating ? "animate-pulse" : ""}`}>
          {feedback}
        </div>

        {lastUpdated && !isGenerating && (
          <div className="text-xs text-gray-500 mt-3 flex items-center">
            <MdCheckCircle className="mr-1 text-green-600" />
            {currentLang.lastUpdated} {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      {!hasData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>{currentLang.noteLabel}</strong> {currentLang.addDataNote}
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
            {currentLang.generatingButton}
          </>
        ) : (
          <>
            <FaHeart />
            {currentLang.generateButton}
          </>
        )}
      </Button>
    </div>
  );
};

export default FinalFeedback;