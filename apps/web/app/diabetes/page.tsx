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
import DoctorManagement from "../components/DoctorManagement";

const Page = () => {
  const [refreshToken, setRefreshToken] = useState(0);
  const [vitalsId, setVitalsId] = useState<string | undefined>();
  const [requestAI, setRequestAI] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "vitals" | "lifestyle" | "medications" | "food" | "final" | "doctors"
  >("vitals");

  const [lifestyleDone, setLifestyleDone] = useState(false);
  const [medicationsDone, setMedicationsDone] = useState(false);
  const [foodDone, setFoodDone] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<string>("");

  const handleVitalsSubmit = (id: string, aiRequested: boolean) => {
    setRefreshToken((prev) => prev + 1);
    setVitalsId(id);
    setRequestAI(aiRequested);
  };

  const handleTabChange = (tab: string) => setActiveTab(tab as any);

  const handleFeedbackGenerated = (feedback: string) => {
    setFinalFeedback(feedback);
  };

  const isTabDisabled = (tab: string) => {
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

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-6">
      {/* User Profile Header */}
      <UserProfileHeader />

      {/* Alerts */}
      <DiabetesAlerts refreshToken={refreshToken} />

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b overflow-x-auto">
        {["vitals", "lifestyle", "medications", "food", "doctors", "final"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            disabled={isTabDisabled(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tab === "final" ? "AI Report" : tab}
            {(tab === "lifestyle" && lifestyleDone) ||
            (tab === "medications" && medicationsDone) ||
            (tab === "food" && foodDone) ? (
              <span className="ml-1 text-green-500">✓</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "vitals" && (
          <div className="space-y-6">
            <DiabetesVitalsForm onVitalsSubmitted={handleVitalsSubmit} />
            {vitalsId && requestAI && <DiabetesAISummary vitalsId={vitalsId} />}
          </div>
        )}

        {activeTab === "lifestyle" && (
          <div className="space-y-4">
            <LifestyleForm />
            <button
              onClick={() => {
                setLifestyleDone(true);
                setTimeout(() => setActiveTab("medications"), 500);
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Medications
            </button>
          </div>
        )}

        {activeTab === "medications" && (
          <div className="space-y-4">
            <DiabetesMedications />
            <button
              onClick={() => {
                setMedicationsDone(true);
                setTimeout(() => setActiveTab("food"), 500);
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Food Advice
            </button>
          </div>
        )}

        {activeTab === "food" && (
          <div className="space-y-4">
            <DiabetesFoodAdvice 
              enabled={requestAI}
              onComplete={() => {
                setFoodDone(true);
                setTimeout(() => setActiveTab("final"), 500);
              }}
            />
          </div>
        )}

        {activeTab === "doctors" && (
          <DoctorManagement condition="diabetes" />
        )}

        {activeTab === "final" && (
          <div className="space-y-6">
            {/* Simple Final Feedback Component */}
            <FinalFeedback onFeedbackGenerated={handleFeedbackGenerated} />

            {finalFeedback && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  ✅ Latest Report Generated
                </h4>
                <p className="text-sm text-green-700">
                  Your comprehensive health analysis has been successfully generated and is displayed above.
                </p>
              </div>
            )}

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
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Start New Assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;