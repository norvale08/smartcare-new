// apps/web/app/diabetes/page.tsx - Fixed Layout
"use client";
import React, { useState, useEffect } from "react";

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
  BarChart3,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

type TabType = "vitals" | "lifestyle" | "medications" | "food" | "final";
type LanguageType = "en" | "sw";

const getUserFromToken = () => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return null;

    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const languageContent = {
  en: {
    title: "Diabetes Health Assessment",
    alerts: "Health Alerts",
    vitals: "Vitals",
    trends: "View Trends",
    lifestyle: "Lifestyle",
    medications: "Medications",
    food: "Food Advice",
    final: "AI Report",
    continueToLifestyle: "Continue to Lifestyle",
    continueToMeds: "Continue to Medications",
    continueToFood: "Continue to Food Advice",
    continueToFinal: "Generate AI Report",
    startNew: "Start New Assessment",
    latestReport: "Assessment Complete",
    reportSuccess: "Your comprehensive health analysis has been successfully generated and is displayed above.",
    step: "Step",
    of: "of",
    progress: "Progress",
    aiDisclaimer: {
      title: "AI-Generated Content",
      content: "This AI analysis is for informational purposes only and does not replace professional medical advice. Always consult your healthcare provider for medical decisions."
    },
    vitalsTitle: "Enter Today's Vitals",
    vitalsDescription: "Record your current glucose and blood pressure readings",
    trendsTitle: "Your Health Trends",
    trendsSubtitle: "Visualize your glucose and blood pressure patterns over time",
    trendsHelper: "View your health data over time",
    closeMenu: "Close Menu",
    closeTrends: "Close Trends"
  },
  sw: {
    title: "Tathmini ya Afya ya Kisukari",
    alerts: "Arifa za Afya",
    vitals: "Viwango",
    trends: "Angalia Mwenendo",
    lifestyle: "Mtindo wa Maisha",
    medications: "Dawa",
    food: "Ushauri wa Chakula",
    final: "Ripoti ya AI",
    continueToLifestyle: "Endelea kwa Mtindo wa Maisha",
    continueToMeds: "Endelea kwa Dawa",
    continueToFood: "Endelea kwa Ushauri wa Chakula",
    continueToFinal: "Tengeneza Ripoti ya AI",
    startNew: "Anza Tathmini Mpya",
    latestReport: "Tathmini Imekamilika",
    reportSuccess: "Uchambuzi wako wa kina wa afya umeundwa kikamilifu.",
    step: "Hatua",
    of: "ya",
    progress: "Maendeleo",
    aiDisclaimer: {
      title: "Onyo la Maudhui ya AI",
      content: "Uchambuzi huu ni wa maelezo tu. Daima wasiliana na daktari wako kabla ya kufanya maamuzi ya kiafya."
    },
    vitalsTitle: "Ingiza Viwango vya Leo",
    vitalsDescription: "Rekodi usomaji wako wa sukari na shinikizo la damu",
    trendsTitle: "Mwenendo wa Afya Yako",
    trendsSubtitle: "Angalia mifumo yako ya sukari na shinikizo la damu",
    trendsHelper: "Angalia data yako ya afya kwa muda",
    closeMenu: "Funga Menyu",
    closeTrends: "Funga Mwenendo"
  }
};

const AIDisclaimerBox = ({ language }: { language: LanguageType }) => {
  const content = languageContent[language].aiDisclaimer;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-blue-900 text-xs leading-relaxed">
          <span className="font-semibold">{content.title}:</span> {content.content}
        </p>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTrends, setShowTrends] = useState(false);

  const [vitalsDone, setVitalsDone] = useState<boolean>(false);
  const [lifestyleDone, setLifestyleDone] = useState<boolean>(false);
  const [medicationsDone, setMedicationsDone] = useState<boolean>(false);
  const [foodDone, setFoodDone] = useState<boolean>(false);
  const [finalFeedback, setFinalFeedback] = useState<string>("");

  const [userDiseases, setUserDiseases] = useState<string[]>([]);

  useEffect(() => {
    const user = getUserFromToken();
    if (user?.disease) {
    
      setUserDiseases(user.disease);
    }
  }, []);

  const currentLanguage = languageContent[language];

  const handleVitalsSubmit = (id: string, aiRequested: boolean): void => {
    setRefreshToken((prev) => prev + 1);
    setVitalsId(id);
    setRequestAI(aiRequested);
    setVitalsDone(true);
  };

  const handleTabChange = (tab: TabType): void => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setShowTrends(false);
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
      case "food":
        return !medicationsDone;
      case "final":
        return !foodDone || !requestAI;
      default:
        return false; // "vitals", "medications" are always accessible
    }
  };

  const assessmentSteps: Array<{ id: TabType; label: string; icon: any; done: boolean }> = [
    { id: "vitals", label: currentLanguage.vitals, icon: Activity, done: vitalsDone },
    { id: "lifestyle", label: currentLanguage.lifestyle, icon: Heart, done: lifestyleDone },
    { id: "medications", label: currentLanguage.medications, icon: Pill, done: medicationsDone },
    { id: "food", label: currentLanguage.food, icon: Apple, done: foodDone },
    { id: "final", label: currentLanguage.final, icon: Brain, done: !!finalFeedback }
  ];

  const completedSteps = assessmentSteps.filter(s => s.done).length;
  const progressPercentage = (completedSteps / assessmentSteps.length) * 100;

  return (
    <div className="min-h-screen bg-white">
      {/* User Profile Header - Fixed */}
      <div className="sticky top-0 z-50 w-full bg-blue-200 shadow-sm border-b border-gray-200">
        <UserProfileHeader 
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 right-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-emerald-800 text-white p-3 rounded-full shadow-lg hover:bg-blue-800 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Menu */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="pt-6 px-6 pb-6 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{currentLanguage.title}</h2>
            
            {/* Mobile Alerts with Trends Button */}
            <div className="mb-4">
              <div className="relative">
                <DiabetesAlerts refreshToken={refreshToken} language={language} />
                {/* Trends Button positioned at top-right */}
                <button
                  onClick={() => {
                    setShowTrends(true);
                    setMobileMenuOpen(false);
                  }}
                  className="absolute top-2 right-2 bg-gradient-to-r from-blue-900 to-cyan-700 text-white p-2 rounded-lg hover:from-blue-800 hover:to-cyan-600 transition-colors shadow-sm z-10"
                  title={currentLanguage.trends}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Progress Bar at the top for mobile - NOW ABOVE STEPS */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">{currentLanguage.progress}</span>
                <span className="text-emerald-900 font-bold">
                  {currentLanguage.step} {completedSteps} {currentLanguage.of} {assessmentSteps.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-emerald-900 to-cyan-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            <nav className="space-y-2">
              {assessmentSteps.map((step) => {
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
                      <span className="font-medium text-sm truncate">
                        {step.label}
                      </span>
                    </div>
                    {isCompleted && (
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? "text-cyan-100" : "text-emerald-600"
                      }`} />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="mt-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {currentLanguage.closeMenu}
          </button>
        </div>
      </div>

      {/* Fullscreen Trends Modal */}
      {showTrends && (
        <div className="fixed inset-0 bg-white z-50">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-cyan-700 text-white p-4 md:p-6 flex items-center justify-between z-10 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{currentLanguage.trendsTitle}</h1>
                <p className="text-cyan-100 text-sm md:text-base">{currentLanguage.trendsSubtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setShowTrends(false)}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 md:p-3 transition-colors"
              aria-label="Close trends"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="h-[calc(100vh-80px)] overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
              {/* Graphs Section */}
              <div className="mb-8">
                <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-200">
                  <DiabetesVitalsGraph language={language} />
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    How to Read Your Trends
                  </h3>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Spikes in glucose after meals are normal but should return to baseline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Consistent blood pressure patterns help identify hypertension</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Track morning and evening readings for better control</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-6 border border-emerald-200">
                  <h3 className="text-lg font-bold text-emerald-900 mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recommended Targets
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-emerald-800">Fasting Glucose</h4>
                      <p className="text-emerald-700">Target: 80-130 mg/dL</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">Blood Pressure</h4>
                      <p className="text-emerald-700">Target: &lt;140/90 mmHg</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">Post-Meal Glucose</h4>
                      <p className="text-emerald-700">Target: &lt;180 mg/dL (2 hours after eating)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Close Button at Bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={() => setShowTrends(false)}
                className="w-full md:w-auto bg-gradient-to-r from-blue-900 to-cyan-700 text-white px-8 py-3 rounded-lg hover:from-blue-800 hover:to-cyan-600 transition-colors font-semibold shadow-md"
              >
                {currentLanguage.closeTrends}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6 ${showTrends ? 'hidden' : 'block'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          
          {/* Left Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="space-y-4 sticky top-24">
              {/* Alerts Card with Trends Button */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    {currentLanguage.alerts}
                  </h3>
                  {/* Trends Button positioned next to "Health Alerts" */}
                  <button
                    onClick={() => setShowTrends(true)}
                    className="bg-gradient-to-r from-blue-900 to-cyan-700 text-white px-3 py-1.5 rounded-lg hover:from-blue-800 hover:to-cyan-600 transition-colors shadow-sm text-xs font-semibold flex items-center gap-1.5"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    {currentLanguage.trends}
                  </button>
                </div>
                <DiabetesAlerts refreshToken={refreshToken} language={language} />
              </div>

              {/* Navigation Card with Progress Bar on Top */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                {/* Progress Bar at the top of steps */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">{currentLanguage.progress}</span>
                    <span className="text-emerald-900 font-bold">
                      {currentLanguage.step} {completedSteps} {currentLanguage.of} {assessmentSteps.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-900 to-cyan-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                
                <nav className="space-y-2">
                  {assessmentSteps.map((step) => {
                    const Icon = step.icon;
                    const isActive = activeTab === step.id;
                    const isCompleted = step.done;
                    const isDisabled = isTabDisabled(step.id);
                    
                    return (
                      <button
                        key={step.id}
                        onClick={() => !isDisabled && handleTabChange(step.id)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left group ${
                          isActive
                            ? "bg-emerald-900 text-white shadow-sm"
                            : isDisabled
                            ? "text-gray-400 cursor-not-allowed opacity-50"
                            : "text-gray-700 hover:bg-cyan-50"
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-cyan-100" : isDisabled ? "text-gray-300" : "text-gray-400 group-hover:text-emerald-900"
                        }`} />
                        <span className="font-medium text-sm flex-1 truncate">
                          {step.label}
                        </span>
                        {isCompleted && (
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? "text-cyan-100" : "text-emerald-600"
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {/* Alerts for Mobile */}
            <div className="lg:hidden mb-4">
              {/* Mobile Alerts with Trends Button */}
              <div className="relative">
                <DiabetesAlerts refreshToken={refreshToken} language={language} />
                {/* Trends Button positioned at top-right */}
                <button
                  onClick={() => setShowTrends(true)}
                  className="absolute top-2 right-2 bg-gradient-to-r from-blue-900 to-cyan-700 text-white p-2 rounded-lg hover:from-blue-800 hover:to-cyan-600 transition-colors shadow-sm z-10"
                  title={currentLanguage.trends}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-emerald-500 text-white p-4 md:p-6">
                <div className="flex items-center gap-3 mb-2">
                  {activeTab === "vitals" && <Activity className="w-6 h-6" />}
                  {activeTab === "lifestyle" && <Heart className="w-6 h-6" />}
                  {activeTab === "medications" && <Pill className="w-6 h-6" />}
                  {activeTab === "food" && <Apple className="w-6 h-6" />}
                  {activeTab === "final" && <Brain className="w-6 h-6" />}
                  <h2 className="text-xl md:text-2xl font-bold">
                    {activeTab === "vitals" && currentLanguage.vitalsTitle}
                    {activeTab === "lifestyle" && currentLanguage.lifestyle}
                    {activeTab === "medications" && currentLanguage.medications}
                    {activeTab === "food" && currentLanguage.food}
                    {activeTab === "final" && currentLanguage.final}
                  </h2>
                </div>
                <p className="text-cyan-100 text-xs md:text-sm">
                  {activeTab === "vitals" && currentLanguage.vitalsDescription}
                  {activeTab === "lifestyle" && (language === "sw" ? "Rekodi tabia zako za kila siku" : "Record your daily habits")}
                  {activeTab === "medications" && (language === "sw" ? "Fuatilia dawa zako" : "Track your medications")}
                  {activeTab === "food" && (language === "sw" ? "Pata mapendekezo ya chakula" : "Get dietary recommendations")}
                  {activeTab === "final" && (language === "sw" ? "Angalia uchambuzi wako kamili" : "View your health analysis")}
                </p>
              </div>

              {/* Body - Now scrollable with proper padding */}
              <div className="p-4 md:p-6 min-h-[400px] max-h-[calc(100vh-200px)] overflow-y-auto">
                {activeTab === "vitals" && (
                  <div className="space-y-6">
                    <DiabetesVitalsForm 
                      onVitalsSubmitted={handleVitalsSubmit} 
                      initialLanguage={language}
                      userDiseases={userDiseases}
                    />

                    {vitalsId && requestAI && (
                      <>
                        <DiabetesAISummary vitalsId={vitalsId}
                        language={language}
                        />
                        <AIDisclaimerBox language={language} />
                        
                        <div className="pt-6 border-t border-gray-200">
                          <button
                            onClick={() => setActiveTab("lifestyle")}
                            className="w-full sm:w-auto bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-blue-500 transition-colors font-semibold flex items-center justify-center gap-2"
                          >
                            {currentLanguage.continueToLifestyle}
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "lifestyle" && (
                  <div className="space-y-6">
                    <LifestyleForm
                    language={language}
                    onLanguageChange={handleLanguageChange}
                    />
                    <div className="pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setLifestyleDone(true);
                          setTimeout(() => setActiveTab("medications"), 300);
                        }}
                        className="w-full sm:w-auto bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-blue-500 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        {currentLanguage.continueToMeds}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "medications" && (
                  <div className="space-y-6">
                    <DiabetesMedications />
                    <div className="pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setMedicationsDone(true);
                          setTimeout(() => setActiveTab("food"), 300);
                        }}
                        className="w-full sm:w-auto bg-emerald-900 text-white px-8 py-3 rounded-lg hover:bg-emerald-800 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        {currentLanguage.continueToFood}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "food" && (
                  <div className="space-y-6">
                    <DiabetesFoodAdvice 
                      enabled={requestAI}
                      onComplete={() => {
                        setFoodDone(true);
                        setTimeout(() => setActiveTab("final"), 300);
                      }}
                      language={language}
                    />
                  </div>
                )}

                {activeTab === "final" && (
                  <div className="space-y-6">
                    <FinalFeedback onFeedbackGenerated={handleFeedbackGenerated}
                    language={language}
                    />
                    <AIDisclaimerBox language={language} />

                    {finalFeedback && (
                      <div className="bg-cyan-100 border border-emerald-900/20 rounded-lg p-4 md:p-6">
                        <div className="flex items-center gap-3 text-emerald-900 mb-3">
                          <CheckCircle className="w-6 h-6" />
                          <h4 className="font-semibold text-lg">
                            {currentLanguage.latestReport}
                          </h4>
                        </div>
                        <p className="text-blue-500 text-base">
                          {currentLanguage.reportSuccess}
                        </p>
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-200">
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
                        className="w-full sm:w-auto bg-blue-500 text-white py-3 px-8 rounded-lg hover:bg-emerald-500 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-5 h-5" />
                        {currentLanguage.startNew}
                      </button>
                    </div>
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