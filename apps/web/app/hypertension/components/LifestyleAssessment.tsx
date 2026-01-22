"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Wine, Cigarette, Coffee, TriangleAlert, CheckCircle } from "lucide-react";
import axios from 'axios';
import { useTranslation } from "../../../lib/hypertension/useTranslation";

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
}

function LifestyleAssessment({ lifestyle, onLifestyleChange, bpLevel, alertStatus, todayVitals, aiRecommendations, loadingAI, onRegenerateLifestyle, loadingRegenerate }: LifestyleAssessmentProps) {
  const { t, language } = useTranslation();
  
  function getRecommendations(level?: string, status?: "alert" | "stable" | null): string[] {
    const baseRecs = (() => {
      switch (level) {
        case 'Normal':
          return language === "en-US" ? [
            'Maintain a balanced diet rich in fruits and vegetables.',
            'Continue regular physical activity.',
            'Keep stress levels in check.',
          ] : [
            'Dumisha mlo wenye usawa uliojaa matunda na mboga.',
            'Endelea na shughuli za kimwili mara kwa mara.',
            'Dumisha viwango vya msongo wa mawazo.',
          ];
        case 'Elevated':
          return language === "en-US" ? [
            'Reduce salt intake in your meals.',
            'Engage in at least 30 minutes of exercise daily.',
            'Limit alcohol and caffeine consumption.',
          ] : [
            'Punguza ulaji wa chumvi katika milo yako.',
            'Fanya angalau dakika 30 za mazoezi kila siku.',
            'Punguza kunywa pombe na vinywaji vya kafeini.',
          ];
        case 'Stage 1 Hypertension':
          return language === "en-US" ? [
            'Lower sodium intake significantly.',
            'Exercise 30-60 minutes, 5 days a week.',
            'Maintain a healthy body weight.',
            'Manage stress through relaxation or meditation.',
          ] : [
            'Punguza sana ulaji wa sodiamu.',
            'Fanya mazoezi dakika 30-60, siku 5 kwa wiki.',
            'Dumisha uzito wa mwili wenye afya.',
            'Dhibiti msongo wa mawazo kupitia utulivu au kutafakari.',
          ];
        case 'Stage 2 Hypertension':
          return language === "en-US" ? [
            'Consult a doctor for medical evaluation.',
            'Take medication as prescribed.',
            'Adopt a DASH diet (fruits, vegetables, whole grains).',
            'Quit smoking and avoid alcohol.',
          ] : [
            'Wasiliana na daktari kwa tathmini ya matibabu.',
            'Tumia dawa kama ilivyoagizwa.',
            'Fuata mlo wa DASH (matunda, mboga, nafaka nzima).',
            'Acha uvutaji sigara na epuka pombe.',
          ];
        case 'Hypertensive Crisis':
          return language === "en-US" ? [
            'Seek immediate medical attention!',
            'Follow emergency medical guidance.',
            'Strictly adhere to doctor\'s advice afterward.',
          ] : [
            'Tafuta huduma ya matibabu haraka!',
            'Fuata mwongozo wa dharura wa matibabu.',
            'Shikilia kwa uthabiti ushauri wa daktari baadaye.',
          ];
        case 'Low Blood Pressure':
          return language === "en-US" ? [
            'Stay hydrated and drink more fluids.',
            'Eat small, frequent meals.',
            'Stand up slowly to avoid dizziness.',
          ] : [
            'Kaa na maji mengi na unywe maji zaidi.',
            'Kula milo midogo, mara kwa mara.',
            'Simama polepole ili kuepuka kizunguzungu.',
          ];
        default:
          return language === "en-US" 
            ? ['No specific recommendations available.']
            : ['Hakuna mapendekezo maalum yanayopatikana.'];
      }
    })();

    const personalized: string[] = [];
    if (status === 'alert') {
      if (lifestyle.smoking) personalized.push(language === "en-US" 
        ? 'Alert: Quit smoking immediately to reduce hypertension risk.'
        : 'Tahadhari: Acha uvutaji sigara mara moja ili kupunguza hatari ya shinikizo la damu.'
      );
      if (lifestyle.alcohol) personalized.push(language === "en-US" 
        ? 'Alert: Avoid alcohol today to stabilize blood pressure.'
        : 'Tahadhari: Epuka pombe leo ili kudumisha shinikizo la damu.'
      );
      if (lifestyle.caffeine > 3) personalized.push(language === "en-US" 
        ? 'Alert: Reduce caffeine intake below 3 cups to avoid elevating heart rate.'
        : 'Tahadhari: Punguza ulaji wa kafeini chini ya vikombe 3 ili kuepuka kuongeza kasi ya moyo.'
      );
      if (lifestyle.exercise === 'none' || lifestyle.exercise === '') personalized.push(language === "en-US" 
        ? 'Alert: Start light exercise today, like walking, to improve circulation.'
        : 'Tahadhari: Anza mazoezi mwepesi leo, kama kutembea, ili kuboresha mzunguko wa damu.'
      );
    } else if (status === 'stable') {
      if (lifestyle.smoking) personalized.push(language === "en-US" 
        ? 'Good day: Consider reducing smoking for long-term heart health.'
        : 'Siku njema: Fikiria kupunguza uvutaji sigara kwa afya ya muda mrefu ya moyo.'
      );
      if (lifestyle.alcohol) personalized.push(language === "en-US" 
        ? 'Stable: Limit alcohol to moderate levels.'
        : 'Imara: Punguza pombe kwa viwango vya wastani.'
      );
      if (lifestyle.caffeine > 2) personalized.push(language === "en-US" 
        ? 'Stable: Keep caffeine to 2 cups or less for optimal BP.'
        : 'Imara: Weka kafeini kwa vikombe 2 au chini kwa shinikizo bora la damu.'
      );
      if (lifestyle.exercise === 'low') personalized.push(language === "en-US" 
        ? 'Stable: Aim to increase exercise to moderate frequency.'
        : 'Imara: Lengo kuongeza mazoezi kwa mzunguko wa wastani.'
      );
    }

    return [...baseRecs, ...personalized];
  }

  const getAlertDisplay = () => {
    if (!alertStatus || todayVitals.systolic === null) {
      return null;
    }

    const isAlert = alertStatus === 'alert';
    const Icon = isAlert ? TriangleAlert : CheckCircle;
    const color = isAlert ? 'text-red-600' : 'text-green-600';
    const bgColor = isAlert ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
    const title = isAlert ? t.alerts.alert : t.alerts.stable;

    return (
      <div data-content="lifestyle"  className={`border-l-4 ${bgColor} p-4 rounded-lg mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={color} size={20} />
          <h4 className={`font-semibold ${color}`}>{title}</h4>
        </div>
        <p className={`text-sm ${color}`}>
          {isAlert 
            ? (language === "en-US" 
                ? 'Monitor closely and adjust lifestyle factors.' 
                : 'Fuatilia kwa karibu na rekebisha mambo ya maisha.')
            : (language === "en-US"
                ? 'Vitals are stable today. Maintain good habits.'
                : 'Vitali ziko imara leo. Dumisha tabia nzuri.')
          }
        </p>
      </div>
    );
  };

  const recommendations = getRecommendations(bpLevel, alertStatus);

  const handleUpdateLifestyle = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    try {
      const payload = {
        smoking: lifestyle.smoking ? "Heavy" : "None",
        alcohol: lifestyle.alcohol ? "Frequently" : "None",
        exercise: lifestyle.exercise === "high" ? "Daily" : lifestyle.exercise === "moderate" ? "Few times/week" : lifestyle.exercise === "low" ? "Rarely" : "None",
        sleep: "7-8 hrs", // Default
        language: language // Add language to payload for AI response
      };
      const response = await axios.post(`${API_URL}/api/hypertension/lifestyle/update`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      
      if (response.data) {
        // Refresh AI by calling parent function or direct fetch
        const res = await axios.get(`${API_URL}/api/hypertension/lifestyle`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        // Assume parent updates via prop, or add callback prop
        console.log('Lifestyle updated, AI refreshed');
      }
    } catch (error: any) {
      console.error("Failed to update lifestyle:", error);
    }
  };

  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      {getAlertDisplay()}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {t.lifestyle.title}
        </h3>
      </div>

      {/* Lifestyle inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Substance Use */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {language === "en-US" ? "Substance Use" : "Matumizi ya Vitu"}
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={lifestyle.alcohol}
                onChange={(e) => onLifestyleChange(prev => ({ ...prev, alcohol: e.target.checked }))}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Wine className="text-purple-600" size={16} />
              <span className="text-sm text-gray-700">
                {language === "en-US" ? "Regular alcohol consumption" : "Kunywa pombe mara kwa mara"}
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={lifestyle.smoking}
                onChange={(e) => onLifestyleChange(prev => ({ ...prev, smoking: e.target.checked }))}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <Cigarette className="text-purple-600" size={16} />
              <span className="text-sm text-gray-700">
                {language === "en-US" ? "Smoking/tobacco use" : "Uvutaji sigara/matumizi ya tumbaku"}
              </span>
            </label>
          </div>
          <button 
            onClick={handleUpdateLifestyle}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            {language === "en-US" ? "Update Habits" : "Sasisha Tabia"}
          </button>
        </div>

        {/* Daily Habits */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {language === "en-US" ? "Daily Habits" : "Tabia za Kila Siku"}
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Coffee className="text-purple-600" size={16} />
              <label className="text-sm text-gray-700">
                {language === "en-US" ? "Caffeine intake (cups/day):" : "Kafeini iliyotumiwa (vikombe/siku):"}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={lifestyle.caffeine}
                onChange={(e) =>
                  onLifestyleChange(prev => ({ ...prev, caffeine: parseInt(e.target.value) || 0 }))
                }
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-2 block">
                {language === "en-US" ? "Exercise frequency:" : "Mara ya kufanya mazoezi:"}
              </label>
              <select
                value={lifestyle.exercise}
                onChange={(e) =>
                  onLifestyleChange(prev => ({ ...prev, exercise: e.target.value as LifestyleData["exercise"] }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
              >
                <option value="">{t.lifestyle.noneExercise}</option>
                <option value="low">{t.lifestyle.lowExercise}</option>
                <option value="moderate">{t.lifestyle.moderateExercise}</option>
                <option value="high">{t.lifestyle.highExercise}</option>
              </select>
            </div>
          </div>
          <button 
            onClick={handleUpdateLifestyle}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            {language === "en-US" ? "Update Habits" : "Sasisha Tabia"}
          </button>
        </div>
      </div>

      
      {/* AI Recommendations Header with Regenerate Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-bold text-xl text-gray-900">
            {language === "en-US" ? "AI Health Recommendations" : "Mapendekezo ya Afya ya AI"}
          </h3>
        </div>
        
        {(onRegenerateLifestyle && !loadingAI) && (
          <button
            onClick={onRegenerateLifestyle}
            disabled={loadingRegenerate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loadingRegenerate ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
      
      {loadingAI ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-blue-700 font-medium">
              {language === "en-US" ? "Loading AI recommendations..." : "Inapakia mapendekezo ya AI..."}
            </p>
          </div>
        </div>
      ) : aiRecommendations.advice ? (
        <div className="space-y-4 mb-6">
          {(() => {
            const parseAIAdvice = (advice: string) => {
              const sections = {
                keyInsights: '',
                actionPlan: '',
                lifestyleGoals: '',
                weatherTips: ''
              };

              // Parse sections based on headers (support both languages)
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
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-l-4 border-blue-500 shadow-sm">
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
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-500 shadow-sm">
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
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-l-4 border-purple-500 shadow-sm">
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
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border-l-4 border-amber-500 shadow-sm">
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
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-5 rounded-xl border-l-4 border-yellow-400 shadow-sm">
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
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-5 rounded-xl border-l-4 border-red-500 shadow-sm">
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

      {/* Dynamic recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">
            {language === "en-US" ? "Personalized Recommendations:" : "Mapendekezo Yanayolengwa:"}
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {recommendations.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LifestyleAssessment;