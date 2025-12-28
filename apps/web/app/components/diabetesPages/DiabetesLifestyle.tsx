"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@repo/ui";
import { toast } from "react-hot-toast";
import {
  FaWineGlassAlt,
  FaBeer,
  FaSmoking,
  FaBan,
  FaBed,
  FaRunning,
  FaCouch,
  FaRedo,
} from "react-icons/fa";
import { MdSmokeFree, MdFitnessCenter, MdAccessTime } from "react-icons/md";

export type AlcoholLevel = "None" | "Occasionally" | "Frequently";
export type SmokingLevel = "None" | "Light" | "Heavy";
export type ExerciseLevel = "Daily" | "Few times/week" | "Rarely" | "None";
export type SleepLevel = "<5 hrs" | "6-7 hrs" | "7-8 hrs" | ">8 hrs" | "Irregular";

export interface LifestyleData {
  alcohol?: AlcoholLevel;
  smoking?: SmokingLevel;
  exercise?: ExerciseLevel;
  sleep?: SleepLevel;
}

interface Props {
  onSubmit?: (data: LifestyleData) => void;
  initialData?: LifestyleData;
}

interface OptionConfig {
  label: string;
  icon: React.ReactNode;
}

const options = {
  alcohol: [
    { label: "None" as AlcoholLevel, icon: <FaBan className="text-xl text-gray-700" /> },
    { label: "Occasionally" as AlcoholLevel, icon: <FaWineGlassAlt className="text-xl text-red-500" /> },
    { label: "Frequently" as AlcoholLevel, icon: <FaBeer className="text-xl text-yellow-600" /> },
  ],
  smoking: [
    { label: "None" as SmokingLevel, icon: <MdSmokeFree className="text-xl text-green-600" /> },
    { label: "Light" as SmokingLevel, icon: <FaSmoking className="text-xl text-gray-600" /> },
    { label: "Heavy" as SmokingLevel, icon: <FaSmoking className="text-xl text-red-600" /> },
  ],
  exercise: [
    { label: "Daily" as ExerciseLevel, icon: <FaRunning className="text-xl text-blue-600" /> },
    { label: "Few times/week" as ExerciseLevel, icon: <MdFitnessCenter className="text-xl text-purple-600" /> },
    { label: "Rarely" as ExerciseLevel, icon: <FaCouch className="text-xl text-gray-600" /> },
    { label: "None" as ExerciseLevel, icon: <FaBan className="text-xl text-red-600" /> },
  ],
  sleep: [
    { label: "<5 hrs" as SleepLevel, icon: <FaBed className="text-xl text-red-600" /> },
    { label: "6-7 hrs" as SleepLevel, icon: <FaBed className="text-xl text-yellow-600" /> },
    { label: "7-8 hrs" as SleepLevel, icon: <FaBed className="text-xl text-green-600" /> },
    { label: ">8 hrs" as SleepLevel, icon: <FaBed className="text-xl text-blue-600" /> },
    { label: "Irregular" as SleepLevel, icon: <MdAccessTime className="text-xl text-gray-600" /> },
  ],
};

const DiabetesLifestyle: React.FC<Props> = ({ onSubmit, initialData }) => {
  const [form, setForm] = useState<LifestyleData>(initialData || {});
  const [aiAdvice, setAiAdvice] = useState("🤖 AI advice will appear here once you save your lifestyle data.");
  const [loading, setLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const maxPollAttempts = 30;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getAuthToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  const handleSelect = (field: keyof LifestyleData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateForm = () =>
    ["alcohol", "smoking", "exercise", "sleep"].every((f) => form[f as keyof LifestyleData]);

  // Poll AI advice from backend
  const pollAIAdvice = async (recordId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/lifestyle/advice/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success) {
        setLastUpdated(data.lastUpdated);

        if (data.isGenerating) {
          const dots = ".".repeat((pollAttempts % 3) + 1);
          setAiAdvice(`🤖 Generating personalized lifestyle advice${dots}`);
          setIsGeneratingAI(true);
          setPollAttempts((prev) => prev + 1);

          if (pollAttempts >= maxPollAttempts) stopPolling();
        } else {
          setAiAdvice(data.aiAdvice || " AI advice generated but empty.");
          setIsGeneratingAI(false);
          setPollAttempts(0);
          stopPolling();
          toast.success("AI advice generated successfully!");
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  const startPolling = (recordId: string) => {
    stopPolling();
    setPollAttempts(0);
    pollingInterval.current = setInterval(() => pollAIAdvice(recordId), 2000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/api/lifestyle/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setForm({
              alcohol: data.data.alcohol,
              smoking: data.data.smoking,
              exercise: data.data.exercise,
              sleep: data.data.sleep,
            });
            setAiAdvice(data.data.aiAdvice || aiAdvice);
            setLastUpdated(data.data.updatedAt);
            setCurrentRecordId(data.data._id);

            if (data.data.isGenerating) startPolling(data.data._id);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadExistingData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return toast.error("Please fill in all lifestyle information");
    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) return toast.error("Please log in to save lifestyle data");

      const response = await fetch(`${API_URL}/api/lifestyle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to save lifestyle data");
        return;
      }

      toast.success("Lifestyle data saved successfully!");
      onSubmit?.(form);

      if (data.recordId) {
        if (currentRecordId !== data.recordId || !isGeneratingAI) {
          setCurrentRecordId(data.recordId);
          setAiAdvice("Generating personalized lifestyle advice...");
          setIsGeneratingAI(true);
          setPollAttempts(0);
          startPolling(data.recordId);
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save lifestyle data.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAdvice = async () => {
    if (currentRecordId && !isGeneratingAI) {
      setIsGeneratingAI(true);
      setPollAttempts(0);
      setAiAdvice("🤖 Refreshing AI advice...");
      startPolling(currentRecordId);
    } else if (!currentRecordId) {
      toast.error("Please save your lifestyle data first");
    } else if (isGeneratingAI) {
      toast("AI advice is already being generated", );
    }
  };

  const renderOptions = (field: keyof LifestyleData, title: string, opts: OptionConfig[]) => (
    <div>
      <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {opts.map((opt) => (
          <div
            key={opt.label.toString()}
            onClick={() => handleSelect(field, opt.label.toString())}
            className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
              form[field] === opt.label
                ? "border-blue-600 bg-blue-50 shadow-md transform scale-105"
                : "border-gray-200 hover:border-blue-300 bg-gray-50 hover:shadow-sm"
            }`}
          >
            {opt.icon}
            <span className="mt-2 text-sm font-medium text-center">{opt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderOptions("alcohol", "Alcohol Intake", options.alcohol)}
        {renderOptions("smoking", "Smoking", options.smoking)}
        {renderOptions("exercise", "Exercise", options.exercise)}
        {renderOptions("sleep", "Sleep (hours/night)", options.sleep)}

        <Button
          type="submit"
          disabled={loading || !validateForm()}
          className="w-full font-semibold py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
        >
          {loading ? "Saving..." : "Save Lifestyle Info"}
        </Button>
      </form>

      <div
        className={`mt-4 p-5 rounded-xl border-l-4 transition-all duration-300 ${
          isGeneratingAI ? "bg-blue-50 border-blue-600" : "bg-green-50 border-green-600"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-bold flex items-center">
            <span className="text-2xl mr-2">🤖</span>
            <span className={isGeneratingAI ? "text-blue-700" : "text-green-700"}>
              Personalized Lifestyle Advice
            </span>
          </h4>

          {currentRecordId && (
            <Button
              onClick={handleRefreshAdvice}
              disabled={isGeneratingAI}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-sm"
            >
              <FaRedo className={`text-xs ${isGeneratingAI ? "animate-spin" : ""}`} />
              {isGeneratingAI ? "Generating..." : "Refresh"}
            </Button>
          )}
        </div>

        <div className={`text-gray-800 ${isGeneratingAI ? "animate-pulse" : ""}`}>
          {aiAdvice.length > 1000 ? aiAdvice.substring(0, 1000) + "..." : aiAdvice}
        </div>

        {lastUpdated && !isGeneratingAI && (
          <div className="text-xs text-gray-500 mt-2">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiabetesLifestyle;
