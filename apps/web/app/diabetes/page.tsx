// apps/web/app/diabetes/page.tsx - REDESIGNED WITH SIDE NAVIGATION
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
import DiabetesVitalsGraph from "../components/diabetesPages/components/DiabetesVitalsGraph";
import { 
  Activity, 
  Heart, 
  Pill, 
  Apple, 
  Brain, 
  CheckCircle,
  RotateCcw,
  Info,
  TrendingUp,
  BarChart3,
  ChevronRight
} from "lucide-react";

type TabType = "vitals" | "lifestyle" | "medications" | "food" | "final" | "trends";
type LanguageType = "en" | "sw";

// Language content for the main page
const languageContent = {
  en: {
    title: "Diabetes Health Assessment",
    alerts: "Alerts",
    vitals: "Vitals",
    trends: "Trends",
    lifestyle: "Lifestyle",
    medications: "Medications",
    food: "Food",
    final: "AI Report",
    continueToTrends: "View Trends",
    continueToLifestyle: "Continue to Lifestyle",
    continueToMeds: "Continue to Medications",
    continueToFood: "Continue to Food Advice",
    continueToFinal: "Generate AI Report",
    startNew: "Start New Assessment",
    latestReport: "Latest Report Generated",
    reportSuccess: "Your comprehensive health analysis has been successfully generated and is displayed above.",
    step: "Step",
    of: "of",
    progress: "Progress",
    steps: "Steps",
    aiDisclaimer: {
      title: "AI-Generated Content",
      content: "This AI analysis is for informational purposes only and does not replace professional medical advice. Always consult your healthcare provider for medical decisions."
    },
    viewTrends: "View Your Health Trends",
    trendsDescription: "Track your glucose and blood pressure patterns over time to better understand your health journey.",
    vitalsTitle: "Enter Today's Vitals",
    vitalsDescription: "Record your current glucose and blood pressure readings to get personalized insights.",
    backToForm: "Back to Vitals Form",
    trendsTitle: "Your Health Trends",
    trendsSubtitle: "Visualize your glucose and blood pressure patterns over time"
  },
  sw: {
    title: "Tathmini ya Afya ya Kisukari",
    alerts: "Taarifa",
    vitals: "Viwango",
    trends: "Mwenendo",
    lifestyle: "Mtindo wa Maisha",
    medications: "Dawa",
    food: "Chakula",
    final: "Ripoti ya AI",
    continueToTrends: "Angalia Mwenendo",
    continueToLifestyle: "Endelea kwa Mtindo wa Maisha",
    continueToMeds: "Endelea kwa Dawa",
    continueToFood: "Endelea kwa Ushauri wa Chakula",
    continueToFinal: "Tengeneza Ripoti ya AI",
    startNew: "Anza Tathmini Mpya",
    latestReport: "Ripoti ya Hivi Karibuni Imetengenezwa",
    reportSuccess: "Uchambuzi wako wa kina wa afya umeundwa kikamilifu na unaonyeshwa hapo juu.",
    step: "Hatua",
    of: "ya",
    progress: "Maendeleo",
    steps: "Hatua",
    aiDisclaimer: {
      title: "Onyo la Maudhui Yaliyotengenezwa na AI",
      content: "Uchambuzi huu umetengenezwa na akili bandia na unalenga kutoa maelezo tu. HAUFAI kuchukua nafasi ya ushauri wa kitaalamu wa kimatibabu, utambuzi, au matibabu. Daima wasiliana na watoa huduma za afya wenye sifa kabla ya kufanya maamuzi yoyote ya kiafya au mabadiliko kwenye mpango wako wa matibabu. Ikiwa unakumbana na dharura ya kimatibabu, wasiliana na huduma za dharura mara moja."
    },
    viewTrends: "Angalia Mwenendo wa Afya Yako",
    trendsDescription: "Fuatilia mifumo yako ya sukari ya damu na shinikizo la damu kwa muda kwa muda ili kuelewa vyema safari yako ya afya.",
    vitalsTitle: "Ingiza Viwango vya Leo",
    vitalsDescription: "Rekodi usomaji wako wa sasa wa sukari ya damu na shinikizo la damu ili kupata ufahamu wa kibinafsi.",
    backToForm: "Rudi kwa Fomu ya Viwango",
    trendsTitle: "Mwenendo wa Afya Yako",
    trendsSubtitle: "Angalia mifumo yako ya sukari ya damu na shinikizo la damu kwa muda"
  }
};

// AI Disclaimer Component
const AIDisclaimerBox = ({ language }: { language: LanguageType }) => {
  const content = languageContent[language].aiDisclaimer;
  
  return (
    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-blue-900 rounded-xl p-4 lg:p-6 shadow-sm">
      <div className="flex items-start gap-3 lg:gap-4">
        <div className="flex-shrink-0">
          <div className="bg-blue-900 rounded-full p-2 lg:p-2.5">
            <Info className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-100" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-blue-900 text-base lg:text-lg mb-2 flex items-center gap-2">
            {content.title}
          </h3>
          <p className="text-emerald-900 text-sm lg:text-base leading-relaxed">
            {content.content}
          </p>
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  const [refreshToken, setRefreshToken] = useState<number>(0);
  const [vitalsId, setVitalsId] = useState<string | undefined>();
  const [requestAI, setRequestAI] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("vitals");
  const [language, setLanguage] = useState<LanguageType>("en");

  const [vitalsDone, setVitalsDone] = useState<boolean>(false);
  const [lifestyleDone, setLifestyleDone] = useState<boolean>(false);
  const [medicationsDone, setMedicationsDone] = useState<boolean>(false);
  const [foodDone, setFoodDone] = useState<boolean>(false);
  const [finalFeedback, setFinalFeedback] = useState<string>("");

  const currentLanguage = languageContent[language];

  const handleVitalsSubmit = (id: string, aiRequested: boolean): void => {
    setRefreshToken((prev) => prev + 1);
    setVitalsId(id);
    setRequestAI(aiRequested);
    setVitalsDone(true);
  };

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
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
        return !vitalsDone;
      case "medications":
        return false; // Always accessible
      case "food":
        return !medicationsDone;
      case "final":
        return !foodDone || !requestAI;
      default:
        return false;
    }
  };

  // Main steps (excluding trends)
  const mainSteps: Array<{ id: TabType; label: string; icon: any; done: boolean }> = [
    { id: "vitals", label: currentLanguage.vitals, icon: Activity, done: vitalsDone },
    { id: "lifestyle", label: currentLanguage.lifestyle, icon: Heart, done: lifestyleDone },
    { id: "medications", label: currentLanguage.medications, icon: Pill, done: medicationsDone },
    { id: "food", label: currentLanguage.food, icon: Apple, done: foodDone },
    { id: "final", label: currentLanguage.final, icon: Brain, done: false }
  ];

  const completedSteps = mainSteps.filter(s => s.done).length;
  const progressPercentage = (completedSteps / mainSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50">
      {/* User Profile Header - Full Width with Language Selector */}
      <div className="w-full bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <UserProfileHeader 
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alerts - Full Width */}
        <div className="mb-6">
          <DiabetesAlerts refreshToken={refreshToken} />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Side Navigation - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                {currentLanguage.steps}
              </h2>
              
              <nav className="space-y-2">
                {mainSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = activeTab === step.id;
                  const isCompleted = step.done;
                  const isDisabled = isTabDisabled(step.id);
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => !isDisabled && handleTabChange(step.id)}
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group ${
                        isActive
                          ? "bg-emerald-900 text-white shadow-md"
                          : isDisabled
                          ? "text-gray-400 cursor-not-allowed opacity-50"
                          : "text-gray-700 hover:bg-cyan-50"
                      }`}
                    >
                      <div className={`flex-shrink-0 ${
                        isActive 
                          ? "text-cyan-100" 
                          : isDisabled 
                          ? "text-gray-300" 
                          : "text-gray-400 group-hover:text-emerald-900"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${
                            isActive ? "text-cyan-100" : "text-gray-500"
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium text-sm truncate">
                            {step.label}
                          </span>
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-cyan-100" : "text-emerald-600"
                        }`} />
                      )}
                    </button>
                  );
                })}

                {/* Trends - Separate from main steps - Always visible */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleTabChange("trends")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group ${
                      activeTab === "trends"
                        ? "bg-blue-900 text-white shadow-md"
                        : "text-gray-700 hover:bg-cyan-50"
                    }`}
                  >
                    <div className={`flex-shrink-0 ${
                      activeTab === "trends" ? "text-cyan-100" : "text-gray-400 group-hover:text-blue-900"
                    }`}>
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm truncate flex-1">
                      {currentLanguage.trends}
                    </span>
                  </button>
                </div>
              </nav>

              {/* Progress */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">{currentLanguage.progress}</span>
                  <span className="text-emerald-900 font-bold">
                    {completedSteps}/{mainSteps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-900 to-cyan-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-600">
                {currentLanguage.step} {mainSteps.findIndex(s => s.id === activeTab) + 1} {currentLanguage.of} {mainSteps.length}
              </h2>
              <span className="text-xs text-emerald-900 font-bold">
                {completedSteps}/{mainSteps.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-gradient-to-r from-emerald-900 to-cyan-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center overflow-x-auto gap-2 pb-2">
              {mainSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeTab === step.id;
                const isDisabled = isTabDisabled(step.id);
                
                return (
                  <button
                    key={step.id}
                    onClick={() => !isDisabled && handleTabChange(step.id)}
                    disabled={isDisabled}
                    className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all min-w-[70px] ${
                      isActive
                        ? "bg-emerald-900 text-white"
                        : isDisabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-cyan-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{step.label}</span>
                    {step.done && (
                      <CheckCircle className={`w-3 h-3 ${isActive ? "text-cyan-100" : "text-emerald-600"}`} />
                    )}
                  </button>
                );
              })}
              {/* Trends - Always visible on mobile */}
              <button
                onClick={() => handleTabChange("trends")}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all min-w-[70px] ${
                  activeTab === "trends"
                    ? "bg-blue-900 text-white"
                    : "text-gray-600 hover:bg-cyan-50"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs font-medium">{currentLanguage.trends}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Content Header */}
              <div className="bg-gradient-to-r from-blue-900 to-emerald-900 text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                  {activeTab === "vitals" && <Activity className="w-6 h-6" />}
                  {activeTab === "trends" && <BarChart3 className="w-6 h-6" />}
                  {activeTab === "lifestyle" && <Heart className="w-6 h-6" />}
                  {activeTab === "medications" && <Pill className="w-6 h-6" />}
                  {activeTab === "food" && <Apple className="w-6 h-6" />}
                  {activeTab === "final" && <Brain className="w-6 h-6" />}
                  <h2 className="text-2xl font-bold">
                    {activeTab === "vitals" && currentLanguage.vitalsTitle}
                    {activeTab === "trends" && currentLanguage.trendsTitle}
                    {activeTab === "lifestyle" && currentLanguage.lifestyle}
                    {activeTab === "medications" && currentLanguage.medications}
                    {activeTab === "food" && currentLanguage.food}
                    {activeTab === "final" && currentLanguage.final}
                  </h2>
                </div>
                <p className="text-cyan-100 text-sm">
                  {activeTab === "vitals" && currentLanguage.vitalsDescription}
                  {activeTab === "trends" && currentLanguage.trendsSubtitle}
                  {activeTab === "lifestyle" && "Record your daily lifestyle habits and activities"}
                  {activeTab === "medications" && "Track your current medications and supplements"}
                  {activeTab === "food" && "Get personalized dietary recommendations"}
                  {activeTab === "final" && "View your comprehensive health analysis"}
                </p>
              </div>

              {/* Content Body */}
              <div className="p-6">
                {activeTab === "vitals" && (
                  <div className="space-y-6">
                    <DiabetesVitalsForm 
                      onVitalsSubmitted={handleVitalsSubmit} 
                      initialLanguage={language}
                    />

                    {vitalsId && requestAI && (
                      <>
                        <DiabetesAISummary vitalsId={vitalsId} />
                        <AIDisclaimerBox language={language} />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => setActiveTab("trends")}
                            className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-semibold flex items-center justify-center gap-2"
                          >
                            <BarChart3 className="w-5 h-5" />
                            {currentLanguage.continueToTrends}
                          </button>
                          
                          <button
                            onClick={() => setActiveTab("lifestyle")}
                            className="bg-emerald-900 text-white px-6 py-3 rounded-lg hover:bg-emerald-800 transition-colors font-semibold flex items-center justify-center gap-2"
                          >
                            {currentLanguage.continueToLifestyle}
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "trends" && (
                  <div className="space-y-6">
                    <DiabetesVitalsGraph language={language} />
                    
                    <div className="pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setActiveTab("lifestyle")}
                        className="w-full sm:w-auto bg-emerald-900 text-white px-8 py-3 rounded-lg hover:bg-emerald-800 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        {currentLanguage.continueToLifestyle}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "lifestyle" && (
                  <div className="space-y-6">
                    <LifestyleForm />
                    <button
                      onClick={() => {
                        setLifestyleDone(true);
                        setTimeout(() => setActiveTab("medications"), 500);
                      }}
                      className="w-full sm:w-auto bg-emerald-900 text-white px-8 py-3 rounded-lg hover:bg-emerald-800 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      {currentLanguage.continueToMeds}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {activeTab === "medications" && (
                  <div className="space-y-6">
                    <DiabetesMedications />
                    <button
                      onClick={() => {
                        setMedicationsDone(true);
                        setTimeout(() => setActiveTab("food"), 500);
                      }}
                      className="w-full sm:w-auto bg-emerald-900 text-white px-8 py-3 rounded-lg hover:bg-emerald-800 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      {currentLanguage.continueToFood}
                      <ChevronRight className="w-5 h-5" />
                    </button>
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
                    
                    <AIDisclaimerBox language={language} />

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

                    <button
                      onClick={() => {
                        setActiveTab("vitals");
                        setVitalsId(undefined);
                        setRequestAI(false);
                        setVitalsDone(false);
                        setLifestyleDone(false);
                        setMedicationsDone(false);
                        setFoodDone(false);
                        setFinalFeedback("");
                        setRefreshToken((prev) => prev + 1);
                      }}
                      className="w-full sm:w-auto bg-blue-900 text-white py-3 px-8 rounded-lg hover:bg-blue-800 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      {currentLanguage.startNew}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;