"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Wine, Cigarette, Coffee, TriangleAlert, CheckCircle } from "lucide-react";

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

interface LifestyleAssessmentProps {
  lifestyle: LifestyleData;
  onLifestyleChange: Dispatch<SetStateAction<LifestyleData>>;
  bpLevel?: string;
  alertStatus?: "alert" | "stable" | null;
  todayVitals: TodayVitals;
}

function LifestyleAssessment({ lifestyle, onLifestyleChange, bpLevel, alertStatus, todayVitals }: LifestyleAssessmentProps) {
  function getRecommendations(level?: string, status?: "alert" | "stable" | null): string[] {
    const baseRecs = (() => {
      switch (level) {
        case 'Normal':
          return [
            'Maintain a balanced diet rich in fruits and vegetables.',
            'Continue regular physical activity.',
            'Keep stress levels in check.',
          ];
        case 'Elevated':
          return [
            'Reduce salt intake in your meals.',
            'Engage in at least 30 minutes of exercise daily.',
            'Limit alcohol and caffeine consumption.',
          ];
        case 'Stage 1 Hypertension':
          return [
            'Lower sodium intake significantly.',
            'Exercise 30–60 minutes, 5 days a week.',
            'Maintain a healthy body weight.',
            'Manage stress through relaxation or meditation.',
          ];
        case 'Stage 2 Hypertension':
          return [
            'Consult a doctor for medical evaluation.',
            'Take medication as prescribed.',
            'Adopt a DASH diet (fruits, vegetables, whole grains).',
            'Quit smoking and avoid alcohol.',
          ];
        case 'Hypertensive Crisis':
          return [
            'Seek immediate medical attention!',
            'Follow emergency medical guidance.',
            'Strictly adhere to doctor’s advice afterward.',
          ];
        case 'Low Blood Pressure':
          return [
            'Stay hydrated and drink more fluids.',
            'Eat small, frequent meals.',
            'Stand up slowly to avoid dizziness.',
          ];
        default:
          return ['No specific recommendations available.'];
      }
    })();

    const personalized: string[] = [];
    if (status === 'alert') {
      if (lifestyle.smoking) personalized.push('🚨 Alert: Quit smoking immediately to reduce hypertension risk.');
      if (lifestyle.alcohol) personalized.push('🚨 Alert: Avoid alcohol today to stabilize blood pressure.');
      if (lifestyle.caffeine > 3) personalized.push('🚨 Alert: Reduce caffeine intake below 3 cups to avoid elevating heart rate.');
      if (lifestyle.exercise === 'none' || lifestyle.exercise === '') personalized.push('🚨 Alert: Start light exercise today, like walking, to improve circulation.');
    } else if (status === 'stable') {
      if (lifestyle.smoking) personalized.push('✅ Good day: Consider reducing smoking for long-term heart health.');
      if (lifestyle.alcohol) personalized.push('✅ Stable: Limit alcohol to moderate levels.');
      if (lifestyle.caffeine > 2) personalized.push('✅ Stable: Keep caffeine to 2 cups or less for optimal BP.');
      if (lifestyle.exercise === 'low') personalized.push('✅ Stable: Aim to increase exercise to moderate frequency.');
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
    const title = isAlert ? 'Daily Alert Status' : 'Daily Stable Status';

    return (
      <div className={`border-l-4 ${bgColor} p-4 rounded-lg mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className={color} size={20} />
          <h4 className={`font-semibold ${color}`}>{title}</h4>
        </div>
        <div className="text-sm text-gray-700 mb-2">
          <p><strong>Systolic:</strong> {todayVitals.systolic} mmHg</p>
          <p><strong>Diastolic:</strong> {todayVitals.diastolic} mmHg</p>
          <p><strong>Heart Rate:</strong> {todayVitals.heartRate} bpm</p>
        </div>
        <p className={`text-sm ${color}`}>
          {isAlert ? 'Monitor closely and adjust lifestyle factors.' : 'Vitals are stable today. Maintain good habits.'}
        </p>
      </div>
    );
  };

  const recommendations = getRecommendations(bpLevel, alertStatus);

  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      {getAlertDisplay()}
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Lifestyle Assessment
        </h3>
      </div>

      {/* Lifestyle inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Substance Use */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Substance Use
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
                Regular alcohol consumption
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
              <span className="text-sm text-gray-700">Smoking/tobacco use</span>
            </label>
          </div>
        </div>

        {/* Daily Habits */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Daily Habits
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Coffee className="text-purple-600" size={16} />
              <label className="text-sm text-gray-700">
                Caffeine intake (cups/day):
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
                Exercise frequency:
              </label>
              <select
                value={lifestyle.exercise}
                onChange={(e) =>
                  onLifestyleChange(prev => ({ ...prev, exercise: e.target.value as LifestyleData["exercise"] }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
              >
                <option value="">Select frequency</option>
                <option value="none">No exercise</option>
                <option value="low">1-2 times per week</option>
                <option value="moderate">3-4 times per week</option>
                <option value="high">5+ times per week</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Personalized Recommendations:</h3>
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
