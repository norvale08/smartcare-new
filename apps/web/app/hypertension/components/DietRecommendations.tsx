"use client";

import React, { useState } from "react";
import { Utensils, Coffee, Sun, Moon, Apple } from "lucide-react";
import { useTranslation } from "../../../lib/hypertension/useTranslation";
import TTSReader from "../../components/diabetesPages/components/TTSReader";

interface DietRecommendationsData {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  generalAdvice: string;
  calorieTarget?: number;
  whyBreakfast?: string;
  whyLunch?: string;
  whyDinner?: string;
  whySnacks?: string;
}

interface DietRecommendationsProps {
  dietData: DietRecommendationsData | null;
  loading: boolean;
  onRegenerate?: () => void;
  patient?: {
    name?: string;
    age?: number;
    weight?: number | string;
    gender?: string;
  };
}

const DietRecommendations: React.FC<DietRecommendationsProps> = ({ dietData, loading, onRegenerate, patient }) => {
  const { t, language } = useTranslation();
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const handleRegenerate = async () => {
    if (onRegenerate) {
      setIsRegenerating(true);
      try {
        await onRegenerate();
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div data-content="diet" className="space-y-6">
        {/* Header with regenerate button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Utensils className="text-emerald-700" size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-900">
                {language === "en-US"
                  ? `${patient?.name ? `${patient.name}'s ` : ""}AI Diet Recommendations`
                  : `${patient?.name ? `${patient.name} - ` : ""}Mapendekezo ya Mlo ya AI`}
              </h3>
              {patient && (
                <p className="text-sm text-emerald-600 mt-1">
                  {language === "en-US" 
                    ? `${patient.age ? `${patient.age} years old, ` : ''}${patient.gender ? `${patient.gender}, ` : ''}${patient.weight ? `${patient.weight} kg` : ''}`
                    : `${patient.age ? `Umri: ${patient.age}, ` : ''}${patient.gender ? `${patient.gender}, ` : ''}${patient.weight ? `Uzito: ${patient.weight} kg` : ''}`
                  }
                </p>
              )}
            </div>
          </div>
          
          {(onRegenerate && !loading) && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {isRegenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {language === "en-US" ? "Regenerating..." : "Inatengeneza upya..."}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {language === "en-US" ? "Regenerate Diet" : "Tengeneza Upya Mlo"}
                </>
              )}
            </button>
          )}
        </div>
        
        {loading && !isRegenerating ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-emerald-800">
                  {language === "en-US" 
                    ? "Creating Your Personalized Diet Plan"
                    : "Inaunda Mpango Wako wa Mlo Unaolengwa"
                  }
                </p>
                <p className="text-sm text-emerald-600 max-w-md">
                  {language === "en-US" 
                    ? "Our AI is analyzing your health profile to generate Kenyan diet recommendations tailored for heart health..."
                    : "AI yetu inachambua wasifu wako wa afya ili kutoa mapendekezo ya mlo ya Kenya yanayolengwa kwa afya ya moyo..."
                  }
                </p>
              </div>
            </div>
          </div>
        ) : dietData ? (
          <>
            <div className="flex justify-end mb-2">
              <TTSReader 
                text={`${dietData.breakfast} ${dietData.lunch} ${dietData.dinner} ${dietData.snacks} ${dietData.generalAdvice || ''}`} 
                language={language === "en-US" ? "en" : "sw"}
                showControls={true}
              />
            </div>

            {/* AI Analysis Card */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <span className="text-lg"></span>
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-900 mb-2">
                    {language === "en-US" ? "AI Health Analysis" : "Uchambuzi wa Afya wa AI"}
                  </h4>
                  <p className="text-emerald-800 leading-relaxed">
                    {language === "en-US" 
                      ? "Based on your health profile and current vitals, here's your personalized Kenyan diet plan designed to support heart health and manage blood pressure:"
                      : "Kulingana na wasifu wako wa afya na vitali za sasa, huu ndio mpango wako wa mlo wa Kenya uliolengwa kuunga mkono afya ya moyo na kudhibiti shinikizo la damu:"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Diet Plan Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Breakfast */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Coffee className="text-amber-600" size={20} />
                  </div>
                  <h4 className="font-bold text-amber-800">
                    {language === "en-US" ? "Breakfast" : "Chakula cha Asubuhi"}
                  </h4>
                </div>
                <p className="text-amber-900 leading-relaxed mb-3">{dietData.breakfast}</p>
                {dietData.whyBreakfast && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-amber-800 text-sm font-medium mb-1">
                      {language === "en-US" ? "Why this helps:" : "Kwa nini hii husaidia:"}
                    </p>
                    <p className="text-amber-700 text-sm">{dietData.whyBreakfast}</p>
                  </div>
                )}
              </div>

              {/* Lunch */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Sun className="text-emerald-600" size={20} />
                  </div>
                  <h4 className="font-bold text-emerald-800">
                    {language === "en-US" ? "Lunch" : "Chakula cha Mchana"}
                  </h4>
                </div>
                <p className="text-emerald-900 leading-relaxed mb-3">{dietData.lunch}</p>
                {dietData.whyLunch && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-emerald-800 text-sm font-medium mb-1">
                      {language === "en-US" ? "Why this helps:" : "Kwa nini hii husaidia:"}
                    </p>
                    <p className="text-emerald-700 text-sm">{dietData.whyLunch}</p>
                  </div>
                )}
              </div>

              {/* Dinner */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Moon className="text-indigo-600" size={20} />
                  </div>
                  <h4 className="font-bold text-indigo-800">
                    {language === "en-US" ? "Dinner" : "Chakula cha Jioni"}
                  </h4>
                </div>
                <p className="text-indigo-900 leading-relaxed mb-3">{dietData.dinner}</p>
                {dietData.whyDinner && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-indigo-800 text-sm font-medium mb-1">
                      {language === "en-US" ? "Why this helps:" : "Kwa nini hii husaidia:"}
                    </p>
                    <p className="text-indigo-700 text-sm">{dietData.whyDinner}</p>
                  </div>
                )}
              </div>

              {/* Snacks */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <Apple className="text-rose-600" size={20} />
                  </div>
                  <h4 className="font-bold text-rose-800">
                    {language === "en-US" ? "Snacks" : "Vitafunio"}
                  </h4>
                </div>
                <p className="text-rose-900 leading-relaxed mb-3">{dietData.snacks}</p>
                {dietData.whySnacks && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <p className="text-rose-800 text-sm font-medium mb-1">
                      {language === "en-US" ? "Why this helps:" : "Kwa nini hii husaidia:"}
                    </p>
                    <p className="text-rose-700 text-sm">{dietData.whySnacks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dietary Advice */}
            {dietData.generalAdvice && (
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <span className="text-sky-600 text-lg"></span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sky-800 mb-2">
                      {language === "en-US" ? "Dietary Guidance" : "Ushauri wa Mlo"}
                    </h4>
                    <p className="text-sky-900 leading-relaxed">{dietData.generalAdvice}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Calorie Target */}
            {dietData.calorieTarget && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <span className="text-emerald-600 text-lg"></span>
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-800">
                        {language === "en-US" ? "Daily Calorie Target" : "Lengo la Kalori za Kila Siku"}
                      </h4>
                      <p className="text-sm text-emerald-600 mt-1">
                        {language === "en-US" ? "Recommended daily intake for optimal health" : "Ulio pendekezwa kila siku kwa afya bora"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-700">{dietData.calorieTarget}</div>
                    <div className="text-sm text-emerald-600">
                      {language === "en-US" ? "calories" : "kalori"}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                      style={{ width: `${Math.min((dietData.calorieTarget / 2500) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 mt-2">
                    <span>1500</span>
                    <span>{language === "en-US" ? "Target" : "Lengo"}</span>
                    <span>2500</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-8 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-3 bg-white rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Utensils className="text-emerald-500" size={28} />
              </div>
              <h4 className="font-semibold text-emerald-800">
                {language === "en-US" 
                  ? "Diet Recommendations Unavailable"
                  : "Mapendekezo ya Mlo Hayapatikani"
                }
              </h4>
              <p className="text-emerald-600">
                {language === "en-US" 
                  ? "We're unable to load personalized diet recommendations at this time. Please try again or contact support."
                  : "Hatuwezi kupakia mapendekezo ya mlo yaliyolengwa kwa sasa. Tafadhali jaribu tena au wasiliana na msaada."
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DietRecommendations;