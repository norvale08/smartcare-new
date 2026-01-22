"use client";

import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "../../../web/lib/hypertension/useTranslation";
import axios from 'axios';

import Header from "./components/Header";
import PatientProfile from "./components/PatientProfile";
import EditProfileModal from "./components/EditProfileModal";
import TabNavigation from "./components/TabNavigation";
import TabContent from "./components/TabContent";
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        t={t}
        language={language}
        onLanguageChange={setLanguage}
        patient={patient}
      />

      <main className="flex flex-col items-center">
        <div className="w-full bg-white shadow-sm">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="w-full px-4 py-6">
          {patient && (
            <div className="max-w-4xl mx-auto mb-6">
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

          <div className="flex flex-col items-center gap-6">
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
      </main>
    </div>
  );
}

export default DashboardPage;
