"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Wine, Cigarette, Coffee, TriangleAlert, CheckCircle } from "lucide-react";
import axios from 'axios';
import { useTranslation } from "../../../lib/hypertension/useTranslation";
import TTSReader from "../../components/diabetesPages/components/TTSReader";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type LifestyleData = {
  alcohol: boolean;
  smoking: boolean;
  caffeine: number;
  exercise: "" | "none" | "low" | "moderate" | "high";
};

interface TodayVitals {
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
}

interface AiRecommendations {
  advice: string;
  alerts: string[];
  warnings: string[];
}

interface LifestyleAssessmentProps {
  lifestyle: LifestyleData;
  onLifestyleChange: Dispatch<SetStateAction<LifestyleData>>;
  bpLevel?: string;
  alertStatus?: "alert" | "stable" | null;
  todayVitals: TodayVitals;
  aiRecommendations: AiRecommendations;
  loadingAI: boolean;
  onRegenerateLifestyle?: () => void;
  loadingRegenerate?: boolean;
  patientName?: string;
}

function LifestyleAssessment({ lifestyle, onLifestyleChange, bpLevel, alertStatus, todayVitals, aiRecommendations, loadingAI, onRegenerateLifestyle, loadingRegenerate, patientName }: LifestyleAssessmentProps) {
  const { t, language } = useTranslation();
  
  const handleUpdateLifestyle = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const payload = {
        smoking: lifestyle.smoking ? "Heavy" : "None",
        alcohol: lifestyle.alcohol ? "Frequently" : "None",
        caffeine: lifestyle.caffeine,
        exercise: lifestyle.exercise === "high" ? "Daily" : lifestyle.exercise === "moderate" ? "Few times/week" : lifestyle.exercise === "low" ? "Rarely" : "None",
        sleep: "7-8 hrs",
        language: language
      };
      const response = await axios.post(`${API_URL}/api/hypertension/lifestyle/update`, payload, {
        headers: {
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      
      if (response.data) {
        // Refresh lifestyle data and regenerate AI recommendations
        await axios.get(`${API_URL}/api/hypertension/lifestyle`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        
        if (onRegenerateLifestyle) {
          onRegenerateLifestyle(); // Trigger AI recommendations refresh
        }
        console.log('Lifestyle updated, AI recommendations refreshed');
      }
    } catch (error: any) {
      console.error("Failed to update lifestyle:", error);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100/50 overflow-hidden mb-6">
      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl shadow-sm">
              <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-900">
                {t.lifestyle.title}
              </h2>
              {patientName && (
                <p className="text-sm text-emerald-600 mt-1">
                  {language === "en-US" 
                    ? `Personalized for ${patientName}`
                    : `Iliyobinafsishwa kwa ${patientName}`}
                </p>
              )}
            </div>
          </div>
          
          {onRegenerateLifestyle && !loadingAI && (
            <button
              onClick={onRegenerateLifestyle}
              disabled={loadingRegenerate}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {loadingRegenerate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {language === "en-US" ? "Regenerating..." : "Inatengeneza upya..."}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t.lifestyle.regenerateButton}
                </>
              )}
            </button>
          )}
        </div>

        {/* Alert Status Banner */}
        {alertStatus && todayVitals.systolic !== null && (
          <div className={`mb-6 rounded-xl p-4 border ${
            alertStatus === 'alert' 
              ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' 
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-3">
              {alertStatus === 'alert' ? (
                <>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <TriangleAlert className="text-red-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800">
                      {t.alerts.alert}
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      {language === "en-US" 
                        ? 'Monitor closely and adjust lifestyle factors.' 
                        : 'Fuatilia kwa karibu na rekebisha mambo ya maisha.'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CheckCircle className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-800">
                      {t.alerts.stable}
                    </h4>
                    <p className="text-sm text-emerald-700 mt-1">
                      {language === "en-US"
                        ? 'Vitals are stable today. Maintain good habits.'
                        : 'Vitali ziko imara leo. Dumisha tabia nzuri.'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Lifestyle Input Section */}
        <div data-content="lifestyle" className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Substance Use Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-lg font-bold text-emerald-900 mb-4">
                {language === "en-US" ? "Substance Use" : "Matumizi ya Vitu"}
              </h4>
              <div className="space-y-4">
                <label className="flex items-center gap-4 p-3 bg-white/70 rounded-lg border border-emerald-100 hover:bg-white transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Wine className="text-purple-600" size={18} />
                    </div>
                    <span className="font-medium text-gray-800">
                      {language === "en-US" ? "Regular alcohol consumption" : "Kunywa pombe mara kwa mara"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={lifestyle.alcohol}
                    onChange={(e) => onLifestyleChange(prev => ({ ...prev, alcohol: e.target.checked }))}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
                
                <label className="flex items-center gap-4 p-3 bg-white/70 rounded-lg border border-emerald-100 hover:bg-white transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Cigarette className="text-orange-600" size={18} />
                    </div>
                    <span className="font-medium text-gray-800">
                      {language === "en-US" ? "Smoking/tobacco use" : "Uvutaji sigara/matumizi ya tumbaku"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={lifestyle.smoking}
                    onChange={(e) => onLifestyleChange(prev => ({ ...prev, smoking: e.target.checked }))}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            {/* Daily Habits Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-lg font-bold text-emerald-900 mb-4">
                {language === "en-US" ? "Daily Habits" : "Tabia za Kila Siku"}
              </h4>
              <div className="space-y-4">
                <div className="p-3 bg-white/70 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Coffee className="text-amber-600" size={18} />
                    </div>
                    <label className="font-medium text-gray-800">
                      {language === "en-US" ? "Caffeine intake (cups/day)" : "Kafeini iliyotumiwa (vikombe/siku)"}
                    </label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={lifestyle.caffeine}
                    onChange={(e) =>
                      onLifestyleChange(prev => ({ ...prev, caffeine: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
                  />
                </div>
                
                <div className="p-3 bg-white/70 rounded-lg border border-emerald-100">
                  <label className="font-medium text-gray-800 block mb-2">
                    {language === "en-US" ? "Exercise frequency" : "Mara ya kufanya mazoezi"}
                  </label>
                  <select
                    value={lifestyle.exercise}
                    onChange={(e) =>
                      onLifestyleChange(prev => ({ ...prev, exercise: e.target.value as LifestyleData["exercise"] }))
                    }
                    className="w-full border border-emerald-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
                  >
                    <option value="">{t.lifestyle.noneExercise}</option>
                    <option value="low">{t.lifestyle.lowExercise}</option>
                    <option value="moderate">{t.lifestyle.moderateExercise}</option>
                    <option value="high">{t.lifestyle.highExercise}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Update Button */}
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleUpdateLifestyle}
              disabled={loadingRegenerate}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {loadingRegenerate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {t.language === "en-US" ? "Updating..." : "Inasasisha..."}
                </>
              ) : language === "en-US" ? "Update Lifestyle" : "Sasisha Maisha"}
            </button>
          </div>
        </div>

        {/* AI Recommendations Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">
                  {language === "en-US" ? "AI Health Recommendations" : "Mapendekezo ya Afya ya AI"}
                </h3>
                <p className="text-sm text-emerald-600 mt-1">
                  {language === "en-US" ? "Personalized insights based on your health data" : "Uchambuzi uliobinafsishwa kulingana na data yako ya afya"}
                </p>
              </div>
            </div>
            
            {aiRecommendations.advice && !loadingAI && (
              <TTSReader 
                text={aiRecommendations.advice} 
                language={language === "en-US" ? "en" : "sw"}
                showControls={true}
              />
            )}
          </div>
          
          {loadingAI ? (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-xl border border-emerald-200">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-emerald-800">
                    {language === "en-US" ? "Analyzing Your Health Data" : "Inachambua Data Yako ya Afya"}
                  </p>
                  <p className="text-sm text-emerald-600 mt-2 max-w-md">
                    {language === "en-US" 
                      ? "Our AI is reviewing your vitals and lifestyle to generate personalized recommendations..."
                      : "AI yetu inachambua vitali zako na maisha yako ili kutoa mapendekezo yaliyobinafsishwa..."}
                  </p>
                </div>
              </div>
            </div>
          ) : aiRecommendations.advice ? (
            <div className="space-y-5">
              {(() => {
                const parseAIAdvice = (advice: string) => {
                  const sections = {
                    keyInsights: '',
                    actionPlan: '',
                    lifestyleGoals: '',
                    weatherTips: ''
                  };

                  const keyInsightsMatch = advice.match(/(KEY INSIGHTS|UHAKIKI MUHIMU):[^]*?(?=(TODAY'S ACTION PLAN|MPANGO WA LEO|ACTION PLAN|MPANGO|LIFESTYLE GOALS|MALENGO YA MAISHA|WEATHER TIPS|USHAURI WA HEWA):|$)/si);
                  const actionPlanMatch = advice.match(/(TODAY'S ACTION PLAN|MPANGO WA LEO|ACTION PLAN|MPANGO):[^]*?(?=(LIFESTYLE GOALS|MALENGO YA MAISHA|WEATHER TIPS|USHAURI WA HEWA):|$)/si);
                  const lifestyleGoalsMatch = advice.match(/(LIFESTYLE GOALS|MALENGO YA MAISHA):[^]*?(?=(WEATHER TIPS|USHAURI WA HEWA):|$)/si);
                  const weatherTipsMatch = advice.match(/(WEATHER TIPS|USHAURI WA HEWA):[^]*?(?=$)/si);

                  if (keyInsightsMatch) sections.keyInsights = keyInsightsMatch[0].replace(/(KEY INSIGHTS|UHAKIKI MUHIMU):\s*/i, '').trim();
                  if (actionPlanMatch) sections.actionPlan = actionPlanMatch[0].replace(/(TODAY'S ACTION PLAN|MPANGO WA LEO|ACTION PLAN|MPANGO):\s*/i, '').trim();
                  if (lifestyleGoalsMatch) sections.lifestyleGoals = lifestyleGoalsMatch[0].replace(/(LIFESTYLE GOALS|MALENGO YA MAISHA):\s*/i, '').trim();
                  if (weatherTipsMatch) sections.weatherTips = weatherTipsMatch[0].replace(/(WEATHER TIPS|USHAURI WA HEWA):\s*/i, '').trim();

                  return sections;
                };

                const sections = parseAIAdvice(aiRecommendations.advice);

                return (
                  <>
                    {/* Key Insights Section */}
                    {sections.keyInsights && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-bold text-blue-900 text-lg">
                            {language === "en-US" ? "Key Insights" : "Uhakiki Muhimu"}
                          </h4>
                        </div>
                        <p className="text-gray-800 leading-relaxed text-sm">{sections.keyInsights}</p>
                      </div>
                    )}

                    {/* Today's Action Plan */}
                    {sections.actionPlan && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-bold text-green-900 text-lg">
                            {language === "en-US" ? "Today's Action Plan" : "Mpango wa Leo"}
                          </h4>
                        </div>
                        <div className="text-gray-800 leading-relaxed text-sm whitespace-pre-line">{sections.actionPlan}</div>
                      </div>
                    )}

                    {/* Lifestyle Goals */}
                    {sections.lifestyleGoals && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-bold text-purple-900 text-lg">
                            {language === "en-US" ? "Lifestyle Goals" : "Malengo ya Maisha"}
                          </h4>
                        </div>
                        <div className="text-gray-800 leading-relaxed text-sm whitespace-pre-line">{sections.lifestyleGoals}</div>
                      </div>
                    )}

                    {/* Weather Tips */}
                    {sections.weatherTips && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-bold text-amber-900 text-lg">
                            {language === "en-US" ? "Weather Tips" : "Ushauri wa Hewa"}
                          </h4>
                        </div>
                        <p className="text-gray-800 leading-relaxed text-sm">{sections.weatherTips}</p>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Warnings Section */}
              {aiRecommendations.warnings.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TriangleAlert className="text-yellow-600" size={20} />
                    <h4 className="font-bold text-yellow-900 text-lg">
                      {language === "en-US" ? "Important Warnings" : "Onyo Muhimu"}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {aiRecommendations.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-3 bg-white/70 p-3 rounded-lg">
                        <p className="text-sm text-yellow-900 flex-1 leading-relaxed">{warning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critical Alerts Section */}
              {aiRecommendations.alerts.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TriangleAlert className="text-red-600" size={20} />
                    <h4 className="font-bold text-red-900 text-lg">
                      {language === "en-US" ? "Critical Alerts" : "Onyo Mkuu"}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {aiRecommendations.alerts.map((alert, index) => (
                      <div key={index} className="flex items-start gap-3 bg-white/70 p-3 rounded-lg">
                        <p className="text-sm text-red-900 flex-1 leading-relaxed">{alert}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default LifestyleAssessment;