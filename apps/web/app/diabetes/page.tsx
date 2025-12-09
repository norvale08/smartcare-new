// apps/web/app/diabetes/page.tsx - FIXED VERSION
"use client";
import React, { useState } from "react";
import DiabetesAlerts from "../components/diabetesPages/DiabetesAlerts";
import DiabetesVitalsForm from "../components/diabetesPages/diabetesVitals";
import DiabetesAISummary from "../components/diabetesPages/DiabetesAISummary";
import FinalFeedback from "../components/diabetesPages/DiabetesAIFeedback";
import LifestyleForm from "../components/diabetesPages/DiabetesLifestyle";
import DiabetesMedications from "../components/diabetesPages/DiabetesMedications";
import DiabetesFoodAdvice from "../components/diabetesPages/DiabetesFoodAdvice";
import UserProfileHeader from "../components/UserProfileHeader";
import MedicationReminders from "../hypertension/components/MedicationReminders";
import { 
  Activity, 
  Heart, 
  Pill, 
  Apple, 
  Brain, 
  CheckCircle,
  RotateCcw,
  Menu,
  X
} from "lucide-react";

type TabType = "vitals" | "lifestyle" | "medications" | "food" | "final";
type LanguageType = "en" | "sw";

// Language content for the main page
const languageContent = {
  en: {
    title: "Diabetes Health Assessment",
    alerts: "Alerts",
    vitals: "Vitals",
    lifestyle: "Lifestyle",
    medications: "Medications",
    food: "Food",
    final: "AI Report",
    continueToMeds: "Continue to Medications",
    continueToFood: "Continue to Food Advice",
    startNew: "Start New Assessment",
    latestReport: "Latest Report Generated",
    reportSuccess: "Your comprehensive health analysis has been successfully generated and is displayed above.",
    step: "Step",
    of: "of",
    mobileLabels: {
      vitals: "Vitals",
      lifestyle: "Lifestyle", 
      medications: "Meds",
      food: "Food",
      final: "Report"
    }
  },
  sw: {
    title: "Tathmini ya Afya ya Kisukari",
    alerts: "Taarifa",
    vitals: "Viwango",
    lifestyle: "Mtindo wa Maisha",
    medications: "Dawa",
    food: "Chakula",
    final: "Ripoti ya AI",
    continueToMeds: "Endelea kwa Dawa",
    continueToFood: "Endelea kwa Ushauri wa Chakula",
    startNew: "Anza Tathmini Mpya",
    latestReport: "Ripoti ya Hivi Karibuni Imetengenezwa",
    reportSuccess: "Uchambuzi wako wa kina wa afya umeundwa kikamilifu na unaonyeshwa hapo juu.",
    step: "Hatua",
    of: "ya",
    mobileLabels: {
      vitals: "Viwango",
      lifestyle: "Maisha",
      medications: "Dawa",
      food: "Chakula",
      final: "Ripoti"
    }
  }
};

const Page = () => {
  const [refreshToken, setRefreshToken] = useState<number>(0);
  const [vitalsId, setVitalsId] = useState<string | undefined>();
  const [requestAI, setRequestAI] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("vitals");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<LanguageType>("en");

  const [lifestyleDone, setLifestyleDone] = useState<boolean>(false);
  const [medicationsDone, setMedicationsDone] = useState<boolean>(false);
  const [foodDone, setFoodDone] = useState<boolean>(false);
  const [finalFeedback, setFinalFeedback] = useState<string>("");

  const currentLanguage = languageContent[language];

  const handleVitalsSubmit = (id: string, aiRequested: boolean): void => {
    setRefreshToken((prev) => prev + 1);
    setVitalsId(id);
    setRequestAI(aiRequested);
  };

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleFeedbackGenerated = (feedback: string): void => {
    setFinalFeedback(feedback);
  };

  const handleLanguageChange = (newLanguage: LanguageType): void => {
    setLanguage(newLanguage);
  };

  const isTabDisabled = (tab: TabType): boolean => {
    switch (tab) {
      case "lifestyle":
        return !vitalsId;
      case "medications":
        return !lifestyleDone;
      case "food":
        return !medicationsDone;
      case "final":
        return !foodDone || !requestAI;
      default:
        return false;
    }
  };

  const tabConfig: Record<TabType, { label: string; icon: React.ReactNode; mobileLabel: string }> = {
    vitals: { 
      label: currentLanguage.vitals, 
      icon: <Activity className="w-4 h-4 md:w-5 md:h-5" />, 
      mobileLabel: currentLanguage.mobileLabels.vitals
    },
    lifestyle: { 
      label: currentLanguage.lifestyle, 
      icon: <Heart className="w-4 h-4 md:w-5 md:h-5" />, 
      mobileLabel: currentLanguage.mobileLabels.lifestyle
    },
    medications: { 
      label: currentLanguage.medications, 
      icon: <Pill className="w-4 h-4 md:w-5 md:h-5" />, 
      mobileLabel: currentLanguage.mobileLabels.medications
    },
    food: { 
      label: currentLanguage.food, 
      icon: <Apple className="w-4 h-4 md:w-5 md:h-5" />, 
      mobileLabel: currentLanguage.mobileLabels.food
    },
    final: { 
      label: currentLanguage.final, 
      icon: <Brain className="w-4 h-4 md:w-5 md:h-5" />, 
      mobileLabel: currentLanguage.mobileLabels.final
    }
  };

  const tabs: TabType[] = ["vitals", "lifestyle", "medications", "food", "final"];
  const currentStepIndex = tabs.indexOf(activeTab) + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Profile Header - Full Width with Language Selector */}
      <div className="w-full bg-white shadow-sm">
        <UserProfileHeader 
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 space-y-6">
        {/* Alerts */}
        <DiabetesAlerts refreshToken={refreshToken} />

        {/* Mobile Menu Button */}
        <div className="lg:hidden sticky top-0 z-20 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {tabConfig[activeTab].icon}
              </div>
              <div>
                <div className="text-sm text-blue-900 font-medium">
                  {currentLanguage.step} {currentStepIndex} {currentLanguage.of} 5
                </div>
                <div className="text-lg font-semibold text-emerald-900">
                  {tabConfig[activeTab].label}
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-cyan-100 text-blue-900 hover:bg-cyan-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-cyan-100 rounded-full h-2 mt-3">
            <div 
              className="bg-emerald-900 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(currentStepIndex / 5) * 100}%` 
              }}
            ></div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
              <div className="p-2 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    disabled={isTabDisabled(tab)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab
                        ? "bg-emerald-900 text-white"
                        : "text-blue-900 hover:bg-cyan-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {tabConfig[tab].icon}
                    <span className="font-medium flex-1">{tabConfig[tab].label}</span>
                    {(tab === "lifestyle" && lifestyleDone) ||
                    (tab === "medications" && medicationsDone) ||
                    (tab === "food" && foodDone) ? (
                      <CheckCircle className="w-4 h-4 text-cyan-100" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden lg:block sticky top-0 z-10 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                disabled={isTabDisabled(tab)}
                className={`flex items-center px-4 py-3 font-medium transition-colors whitespace-nowrap rounded-lg text-base min-w-[140px] justify-center gap-2 ${
                  activeTab === tab
                    ? "bg-emerald-900 text-white shadow-sm"
                    : "text-blue-900 hover:bg-cyan-100 hover:text-emerald-900"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {tabConfig[tab].icon}
                <span>{tabConfig[tab].label}</span>
                {(tab === "lifestyle" && lifestyleDone) ||
                (tab === "medications" && medicationsDone) ||
                (tab === "food" && foodDone) ? (
                  <CheckCircle className="w-4 h-4 text-cyan-100" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "vitals" && (
            <div className="space-y-6">
              <DiabetesVitalsForm 
                onVitalsSubmitted={handleVitalsSubmit} 
                initialLanguage={language}
              />
              {vitalsId && requestAI && <DiabetesAISummary vitalsId={vitalsId} />}
            </div>
          )}

          {activeTab === "lifestyle" && (
            <div className="space-y-6">
              <LifestyleForm />
              <div className="sticky bottom-6 lg:static mt-8">
                <button
                  onClick={() => {
                    setLifestyleDone(true);
                    setTimeout(() => setActiveTab("medications"), 500);
                  }}
                  className="w-full lg:w-auto bg-emerald-900 text-white px-8 py-4 lg:py-3 rounded-lg hover:bg-emerald-800 transition-colors font-semibold flex items-center justify-center gap-3 text-lg lg:text-base"
                >
                  {currentLanguage.continueToMeds}
                  <Pill className="w-5 h-5 lg:w-4 lg:h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === "medications" && (
            <div className="space-y-6">
              <DiabetesMedications />
              <div className="sticky bottom-6 lg:static mt-8">
                <button
                  onClick={() => {
                    setMedicationsDone(true);
                    setTimeout(() => setActiveTab("food"), 500);
                  }}
                  className="w-full lg:w-auto bg-emerald-900 text-white px-8 py-4 lg:py-3 rounded-lg hover:bg-emerald-800 transition-colors font-semibold flex items-center justify-center gap-3 text-lg lg:text-base"
                >
                  {currentLanguage.continueToFood}
                  <Apple className="w-5 h-5 lg:w-4 lg:h-4" />
                </button>
              </div>
              <MedicationReminders />
            </div>
          )}

          {activeTab === "food" && (
            <div className="space-y-6">
              <DiabetesFoodAdvice 
                enabled={requestAI}
                onComplete={() => {
                  setFoodDone(true);
                  setTimeout(() => setActiveTab("final"), 500);
                }}
              />
            </div>
          )}

          {activeTab === "final" && (
            <div className="space-y-6">
              <FinalFeedback onFeedbackGenerated={handleFeedbackGenerated} />

              {finalFeedback && (
                <div className="bg-cyan-100 border border-emerald-900/20 rounded-lg p-6">
                  <div className="flex items-center gap-3 text-emerald-900 mb-3">
                    <CheckCircle className="w-6 h-6 lg:w-5 lg:h-5" />
                    <h4 className="font-semibold text-lg lg:text-base">
                      {currentLanguage.latestReport}
                    </h4>
                  </div>
                  <p className="text-blue-900 text-base lg:text-sm">
                    {currentLanguage.reportSuccess}
                  </p>
                </div>
              )}

              <div className="sticky bottom-6 lg:static mt-8">
                <button
                  onClick={() => {
                    setActiveTab("vitals");
                    setVitalsId(undefined);
                    setRequestAI(false);
                    setLifestyleDone(false);
                    setMedicationsDone(false);
                    setFoodDone(false);
                    setFinalFeedback("");
                    setRefreshToken((prev) => prev + 1);
                  }}
                  className="w-full bg-blue-900 text-white py-4 lg:py-3 px-6 rounded-lg hover:bg-blue-800 transition-colors font-semibold flex items-center justify-center gap-3 text-lg lg:text-base"
                >
                  <RotateCcw className="w-5 h-5 lg:w-4 lg:h-4" />
                  {currentLanguage.startNew}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;