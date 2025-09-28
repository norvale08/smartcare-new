"use client";
import React, { useState } from "react";
import DiabetesAlerts from "../components/diabetesPages/DiabetesAlerts";
import DiabetesVitalsForm from "../components/diabetesPages/diabetesVitals";
import DiabetesAISummary from "../components/diabetesPages/DiabetesAISummary";
import DiabetesAIFeedback from "../components/diabetesPages/DiabetesAIFeedback";
import DiabetesLifestyle from "../components/diabetesPages/DiabetesLifestyle";
import DiabetesMedications from "../components/diabetesPages/DiabetesMedications";
import DiabetesFoodAdvice from "../components/diabetesPages/DiabetesFoodAdvice";
import { LifestyleData } from "../components/diabetesPages/DiabetesLifestyle";

const Page = () => {
  const [refreshToken, setRefreshToken] = useState(0);
  const [vitalsId, setVitalsId] = useState<string | undefined>();
  const [requestAI, setRequestAI] = useState(false);
  const [activeTab, setActiveTab] = useState<"vitals" | "lifestyle" | "medications" | "food" | "final">("vitals");

  const [lifestyleDone, setLifestyleDone] = useState(false);
  const [medicationsDone, setMedicationsDone] = useState(false);
  const [foodDone, setFoodDone] = useState(false);

  const userId = "USER_ID_HERE";

  const handleVitalsSubmit = (id: string, aiRequested: boolean) => {
    setRefreshToken(prev => prev + 1);
    setVitalsId(id);
    setRequestAI(aiRequested);
  };

  const handleTabChange = (tab: string) => setActiveTab(tab as any);

  const isTabDisabled = (tab: string) => {
    switch (tab) {
      case "lifestyle": return !vitalsId;
      case "medications": return !lifestyleDone;
      case "food": return !medicationsDone;
      case "final": return !foodDone;
      default: return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <DiabetesAlerts refreshToken={refreshToken} />

      <div className="flex gap-4 border-b">
        {["vitals", "lifestyle", "medications", "food", "final"].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            disabled={isTabDisabled(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tab}
            {(tab === "lifestyle" && lifestyleDone) || (tab === "medications" && medicationsDone) || (tab === "food" && foodDone) ? (
              <span className="ml-1 text-green-500">✓</span>
            ) : null}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "vitals" && (
          <div className="space-y-6">
            <DiabetesVitalsForm onVitalsSubmitted={handleVitalsSubmit} />
            {vitalsId && requestAI && <DiabetesAISummary vitalsId={vitalsId} />}
          </div>
        )}

        {activeTab === "lifestyle" && (
          <DiabetesLifestyle
            userId={userId}
            onSubmit={(data: LifestyleData) => {
              setLifestyleDone(true);
              setTimeout(() => setActiveTab("medications"), 500);
            }}
          />
        )}

        {activeTab === "medications" && (
          <DiabetesMedications
            onSubmit={() => {
              setMedicationsDone(true);
              setTimeout(() => setActiveTab("food"), 500);
            }}
          />
        )}

        {activeTab === "food" && (
          <DiabetesFoodAdvice
            vitalsId={vitalsId}
            enabled={requestAI}
            onComplete={() => {
              setFoodDone(true);
              setTimeout(() => setActiveTab("final"), 500);
            }}
          />
        )}

        {activeTab === "final" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-blue-600">📊 Final AI Feedback</h3>
            <DiabetesAIFeedback vitalsId={vitalsId} enabled={requestAI} />

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ Completed Actions</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Vitals recorded successfully</li>
                {lifestyleDone && <li>• Lifestyle assessment completed</li>}
                {medicationsDone && <li>• Medications reviewed</li>}
                {foodDone && <li>• Food recommendations received</li>}
                {requestAI && <li>• AI health analysis generated</li>}
              </ul>
            </div>

            <button
              onClick={() => {
                setActiveTab("vitals");
                setVitalsId(undefined);
                setRequestAI(false);
                setLifestyleDone(false);
                setMedicationsDone(false);
                setFoodDone(false);
                setRefreshToken(prev => prev + 1);
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
