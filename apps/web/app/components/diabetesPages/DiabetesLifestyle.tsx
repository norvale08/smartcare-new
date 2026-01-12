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
  language?: "en" | "sw"; // ✅ Receive language from parent
  onLanguageChange?: (lang: "en" | "sw") => void; // ✅ Receive language change handler
}

interface OptionConfig {
  label: string;
  labelSw: string;
  icon: React.ReactNode;
}

// ✅ Language content
const languageContent = {
  en: {
    alcoholTitle: "Alcohol Intake",
    smokingTitle: "Smoking",
    exerciseTitle: "Exercise",
    sleepTitle: "Sleep (hours/night)",
    saveButton: "Save Lifestyle Info",
    savingButton: "Saving...",
    adviceTitle: "Personalized Lifestyle Advice",
    refreshButton: "Refresh",
    generatingButton: "Generating...",
    lastUpdated: "Last updated:",
    fillAllFields: "Please fill in all lifestyle information",
    loginRequired: "Please log in to save lifestyle data",
    saveFailed: "Failed to save lifestyle data",
    saveSuccess: "Lifestyle data saved successfully!",
    adviceSuccess: "AI advice generated successfully!",
    saveDataFirst: "Please save your lifestyle data first",
    alreadyGenerating: "AI advice is already being generated",
    aiPlaceholder: "🤖 AI advice will appear here once you save your lifestyle data.",
    generatingAdvice: "🤖 Generating personalized lifestyle advice",
    refreshingAdvice: "🤖 Refreshing AI advice...",
  },
  sw: {
    alcoholTitle: "Matumizi ya Pombe",
    smokingTitle: "Kuvuta Sigara",
    exerciseTitle: "Mazoezi",
    sleepTitle: "Usingizi (masaa kwa usiku)",
    saveButton: "Hifadhi Taarifa za Mtindo wa Maisha",
    savingButton: "Inahifadhi...",
    adviceTitle: "Ushauri wa Kibinafsi wa Mtindo wa Maisha",
    refreshButton: "Onyesha Upya",
    generatingButton: "Inaunda...",
    lastUpdated: "Ilisasishwa mwisho:",
    fillAllFields: "Tafadhali jaza taarifa zote za mtindo wa maisha",
    loginRequired: "Tafadhali ingia ili kuhifadhi data ya mtindo wa maisha",
    saveFailed: "Imeshindwa kuhifadhi data ya mtindo wa maisha",
    saveSuccess: "Data ya mtindo wa maisha imehifadhiwa!",
    adviceSuccess: "Ushauri wa AI umeundwa!",
    saveDataFirst: "Tafadhali hifadhi data yako ya mtindo wa maisha kwanza",
    alreadyGenerating: "Ushauri wa AI tayari unaundwa",
    aiPlaceholder: "🤖 Ushauri wa AI utaonekana hapa ukisha hifadhi data yako ya mtindo wa maisha.",
    generatingAdvice: "🤖 Inaunda ushauri wa kibinafsi wa mtindo wa maisha",
    refreshingAdvice: "🤖 Inasasisha ushauri wa AI...",
  }
};

const options = {
  alcohol: [
    { label: "None", labelSw: "Hakuna", icon: <FaBan className="text-xl text-gray-700" /> },
    { label: "Occasionally", labelSw: "Mara kwa mara", icon: <FaWineGlassAlt className="text-xl text-red-500" /> },
    { label: "Frequently", labelSw: "Mara nyingi", icon: <FaBeer className="text-xl text-yellow-600" /> },
  ],
  smoking: [
    { label: "None", labelSw: "Hakuna", icon: <MdSmokeFree className="text-xl text-green-600" /> },
    { label: "Light", labelSw: "Kidogo", icon: <FaSmoking className="text-xl text-gray-600" /> },
    { label: "Heavy", labelSw: "Kwingi", icon: <FaSmoking className="text-xl text-red-600" /> },
  ],
  exercise: [
    { label: "Daily", labelSw: "Kila siku", icon: <FaRunning className="text-xl text-blue-600" /> },
    { label: "Few times/week", labelSw: "Mara chache/wiki", icon: <MdFitnessCenter className="text-xl text-purple-600" /> },
    { label: "Rarely", labelSw: "Nadra", icon: <FaCouch className="text-xl text-gray-600" /> },
    { label: "None", labelSw: "Hakuna", icon: <FaBan className="text-xl text-red-600" /> },
  ],
  sleep: [
    { label: "<5 hrs", labelSw: "<5 masaa", icon: <FaBed className="text-xl text-red-600" /> },
    { label: "6-7 hrs", labelSw: "6-7 masaa", icon: <FaBed className="text-xl text-yellow-600" /> },
    { label: "7-8 hrs", labelSw: "7-8 masaa", icon: <FaBed className="text-xl text-green-600" /> },
    { label: ">8 hrs", labelSw: ">8 masaa", icon: <FaBed className="text-xl text-blue-600" /> },
    { label: "Irregular", labelSw: "Isiyo ya kawaida", icon: <MdAccessTime className="text-xl text-gray-600" /> },
  ],
};

const DiabetesLifestyle: React.FC<Props> = ({ 
  onSubmit, 
  initialData, 
  language = "en", // ✅ Use language from parent
  onLanguageChange // ✅ Use language change handler from parent
}) => {
  const [form, setForm] = useState<LifestyleData>(initialData || {});
  const [aiAdvice, setAiAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const maxPollAttempts = 30;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const currentLang = languageContent[language];

  // Set initial AI placeholder based on language
  useEffect(() => {
    if (!aiAdvice || aiAdvice === languageContent.en.aiPlaceholder || aiAdvice === languageContent.sw.aiPlaceholder) {
      setAiAdvice(currentLang.aiPlaceholder);
    }
  }, [language]);

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
          setAiAdvice(`${currentLang.generatingAdvice}${dots}`);
          setIsGeneratingAI(true);
          setPollAttempts((prev) => prev + 1);

          if (pollAttempts >= maxPollAttempts) stopPolling();
        } else {
          setAiAdvice(data.aiAdvice || currentLang.aiPlaceholder);
          setIsGeneratingAI(false);
          setPollAttempts(0);
          stopPolling();
          toast.success(currentLang.adviceSuccess);
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

        const response = await fetch(`${API_URL}/api/lifestyle/latest?language=${language}`, {
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
            setAiAdvice(data.data.aiAdvice || currentLang.aiPlaceholder);
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
  }, [language]);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return toast.error(currentLang.fillAllFields);
  setLoading(true);

  try {
    const token = getAuthToken();
    if (!token) return toast.error(currentLang.loginRequired);

    // ✅ ADD language to the request body
    const response = await fetch(`${API_URL}/api/lifestyle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        language: language // ✅ ADD THIS
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.message || currentLang.saveFailed);
      return;
    }

    toast.success(currentLang.saveSuccess);
    onSubmit?.(form);

    if (data.recordId) {
      if (currentRecordId !== data.recordId || !isGeneratingAI) {
        setCurrentRecordId(data.recordId);
        setAiAdvice(currentLang.generatingAdvice + "...");
        setIsGeneratingAI(true);
        setPollAttempts(0);
        startPolling(data.recordId);
      }
    }
  } catch (error) {
    console.error("Submit error:", error);
    toast.error(currentLang.saveFailed);
  } finally {
    setLoading(false);
  }
};
  const handleRefreshAdvice = async () => {
    if (currentRecordId && !isGeneratingAI) {
      setIsGeneratingAI(true);
      setPollAttempts(0);
      setAiAdvice(currentLang.refreshingAdvice);
      startPolling(currentRecordId);
    } else if (!currentRecordId) {
      toast.error(currentLang.saveDataFirst);
    } else if (isGeneratingAI) {
      toast(currentLang.alreadyGenerating);
    }
  };

  const renderOptions = (field: keyof LifestyleData, title: string, opts: OptionConfig[]) => (
    <div>
      <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {opts.map((opt) => (
          <div
            key={opt.label}
            onClick={() => handleSelect(field, opt.label)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${
              form[field] === opt.label
                ? "border-blue-600 bg-blue-50 shadow-md transform scale-105"
                : "border-gray-200 hover:border-blue-300 bg-gray-50 hover:shadow-sm"
            }`}
          >
            {opt.icon}
            <span className="mt-2 text-sm font-medium text-center">
              {language === "en" ? opt.label : opt.labelSw}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
      {/* ✅ REMOVED: Language toggle button - now controlled by parent */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderOptions("alcohol", currentLang.alcoholTitle, options.alcohol)}
        {renderOptions("smoking", currentLang.smokingTitle, options.smoking)}
        {renderOptions("exercise", currentLang.exerciseTitle, options.exercise)}
        {renderOptions("sleep", currentLang.sleepTitle, options.sleep)}

        <Button
          type="submit"
          disabled={loading || !validateForm()}
          className="w-full font-semibold py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
        >
          {loading ? currentLang.savingButton : currentLang.saveButton}
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
              {currentLang.adviceTitle}
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
              {isGeneratingAI ? currentLang.generatingButton : currentLang.refreshButton}
            </Button>
          )}
        </div>

        <div className={`text-gray-800 ${isGeneratingAI ? "animate-pulse" : ""}`}>
          {aiAdvice.length > 1000 ? aiAdvice.substring(0, 1000) + "..." : aiAdvice}
        </div>

        {lastUpdated && !isGeneratingAI && (
          <div className="text-xs text-gray-500 mt-2">
            {currentLang.lastUpdated} {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiabetesLifestyle;