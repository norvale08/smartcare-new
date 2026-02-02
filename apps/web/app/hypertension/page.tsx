"use client";

import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "../../../web/lib/hypertension/useTranslation";
import axios from 'axios';
import { 
  Activity, 
  User, 
  Pill, 
  Utensils, 
  Globe, 
  TrendingUp,
  Menu,
  X,
  CheckCircle,
  Heart,
  Sparkles
} from "lucide-react";

import Header from "./components/Header";
import PatientProfile from "./components/PatientProfile";
import EditProfileModal from "./components/EditProfileModal";
import TabContent from "./components/TabContent";
import HypertensionAlert from "../components/hypertension/alert";
import SidebarHealthAlert from "../components/hypertension/SidebarHealthAlert";
import { usePatientData } from "./hooks/usePatientData";
import { useVitalsData } from "./hooks/useVitalsData";
import { useLifestyleData } from "./hooks/useLifestyleData";
import { useDietData } from "./hooks/useDietData";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function DashboardPage() {
  const { t, language, setLanguage } = useTranslation();
  const { data: session } = useSession();
  
  const [activeTab, setActiveTab] = useState('vitals');
  const [isEditing, setIsEditing] = useState(false);
  const [alertRefreshToken, setAlertRefreshToken] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom hooks for data management
  const {
    patient,
    editForm,
    setPatient,
    setEditForm,
    handleEditChange,
    handleSaveProfile,
    fetchPatient
  } = usePatientData();

  const {
    vitals,
    todayAlert,
    currentBpLevel,
    fetchVitals
  } = useVitalsData(alertRefreshToken);

  const {
    lifestyle,
    setLifestyle,
    aiRecommendations,
    setAiRecommendations,
    loadingAI,
    regeneratingLifestyle,
    fetchAIRecommendations,
    handleRegenerateLifestyle
  } = useLifestyleData(language, alertRefreshToken);

  const {
    dietData,
    dietLoading,
    regeneratingDiet,
    fetchDietRecommendations
  } = useDietData(language);

  // Initial data fetch
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    fetchPatient();
    fetchVitals();
    fetchAIRecommendations();
    fetchDietRecommendations();
  }, [alertRefreshToken]);

  // Refetch on language change
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    fetchAIRecommendations();
    fetchDietRecommendations();
  }, [language]);

  const tabs = [
    { id: 'vitals', label: t.common.vitals, icon: Activity, color: 'emerald' },
    { id: 'health-trends', label: language === "sw-TZ" ? "Mienendo ya Afya & Tathmini ya Hatari" : "Health Trends & Risk", icon: TrendingUp, color: 'teal' },
    { id: 'doctor', label: t.common.doctor, icon: User, color: 'cyan' },
    { id: 'medicine', label: t.common.medicine, icon: Pill, color: 'blue' },
    { id: 'lifestyle', label: t.common.lifestyleAndDiet, icon: Utensils, color: 'green' },
    { id: 'maps', label: t.common.maps, icon: Globe, color: 'indigo' }
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header - non-sticky, still with beautiful gradient */}
      <div className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 shadow-xl border-b border-emerald-600/20">
        <Header 
          t={t}
          language={language}
          onLanguageChange={setLanguage}
          patient={patient}
        />
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 right-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/50 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-110"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Menu */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-white to-emerald-50/30 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="pt-8 px-6 pb-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-200">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              {t.common.dashboard}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Mobile Alerts */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200/50 shadow-sm">
                <HypertensionAlert refreshToken={alertRefreshToken} />
              </div>
            </div>
            
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-left group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                        : "text-gray-700 hover:bg-emerald-50/50 hover:shadow-md"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 animate-pulse" />
                    )}
                    <div className={`flex-shrink-0 relative z-10 ${
                      isActive 
                        ? "text-white" 
                        : "text-emerald-600 group-hover:text-emerald-700"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <span className={`font-semibold text-sm truncate ${
                        isActive ? "text-white" : "text-gray-700"
                      }`}>
                        {tab.label}
                      </span>
                    </div>
                    {isActive && (
                      <CheckCircle className="w-5 h-5 flex-shrink-0 text-white relative z-10" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="mt-6 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 py-3 rounded-xl font-semibold hover:from-emerald-200 hover:to-teal-200 transition-all shadow-sm border border-emerald-200"
          >
            {language === "sw-TZ" ? "Funga Menyu" : "Close Menu"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="space-y-6 sticky top-24">
              {/* Alerts Card with beautiful design */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {language === "sw-TZ" ? "Arifa za Afya" : "Health Alerts"}
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <SidebarHealthAlert refreshToken={alertRefreshToken} />
                </div>
              </div>

              {/* Navigation Card with beautiful design */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-white" />
                    <h3 className="text-sm font-bold text-white">
                      {language === "sw-TZ" ? "Menyu" : "Navigation"}
                    </h3>
                  </div>
                </div>
                <nav className="p-4 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left group relative overflow-hidden ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 transform scale-[1.02]"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:shadow-md"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20" />
                        )}
                        <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 transition-colors ${
                          isActive ? "text-white" : "text-emerald-600 group-hover:text-emerald-700"
                        }`} />
                        <span className={`font-semibold text-sm flex-1 truncate relative z-10 ${
                          isActive ? "text-white" : "text-gray-700"
                        }`}>
                          {tab.label}
                        </span>
                        {isActive && (
                          <CheckCircle className="w-5 h-5 flex-shrink-0 text-white relative z-10" />
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
            <div className="lg:hidden mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100/50 p-4">
                <HypertensionAlert refreshToken={alertRefreshToken} />
              </div>
            </div>

            {/* Patient Profile */}
            {patient && (
              <div className="mb-6">
                <PatientProfile
                  patient={patient}
                  vitals={vitals}
                  onEditClick={() => setIsEditing(true)}
                />
              </div>
            )}

            {isEditing && (
              <EditProfileModal
                editForm={editForm}
                onClose={() => setIsEditing(false)}
                onSave={handleSaveProfile}
                onChange={handleEditChange}
              />
            )}

            {/* Content Card with beautiful design */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100/50 overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-6 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    {tabs.find(t => t.id === activeTab)?.icon && (
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        {React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "w-6 h-6 text-white" })}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold">
                        {tabs.find(t => t.id === activeTab)?.label || t.common.dashboard}
                      </h2>
                      <p className="text-emerald-100 text-sm md:text-base mt-1">
                        {activeTab === "vitals" && (language === "sw-TZ" ? "Rekodi viwango vyako vya leo" : "Record your today's vitals")}
                        {activeTab === "health-trends" && (language === "sw-TZ" ? "Angalia mwenendo wa afya yako" : "View your health trends")}
                        {activeTab === "doctor" && (language === "sw-TZ" ? "Fuatilia daktari wako" : "Track your doctor")}
                        {activeTab === "medicine" && (language === "sw-TZ" ? "Fuatilia dawa zako" : "Track your medications")}
                        {activeTab === "lifestyle" && (language === "sw-TZ" ? "Rekodi tabia zako za kila siku" : "Record your daily habits")}
                        {activeTab === "maps" && (language === "sw-TZ" ? "Tafuta vituo vya afya karibu" : "Find nearby health facilities")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body - Scrollable with beautiful padding */}
              <div className="p-6 md:p-8 min-h-[500px] max-h-[calc(100vh-250px)] overflow-y-auto bg-gradient-to-b from-white to-emerald-50/30">
                <TabContent
                  activeTab={activeTab}
                  alertRefreshToken={alertRefreshToken}
                  setAlertRefreshToken={setAlertRefreshToken}
                  vitals={vitals}
                  lifestyle={lifestyle}
                  setLifestyle={setLifestyle}
                  currentBpLevel={currentBpLevel}
                  todayAlert={todayAlert}
                  aiRecommendations={aiRecommendations}
                  loadingAI={loadingAI}
                  regeneratingLifestyle={regeneratingLifestyle}
                  onRegenerateLifestyle={handleRegenerateLifestyle}
                  dietData={dietData}
                  dietLoading={dietLoading}
                  onRegenerateDiet={fetchDietRecommendations}
                  patient={patient}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
