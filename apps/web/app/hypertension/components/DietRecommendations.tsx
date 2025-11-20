"use client";

import React, { useState } from "react";
import { Utensils } from "lucide-react";

interface DietRecommendationsData {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  generalAdvice: string;
  calorieTarget?: number;
}

interface DietRecommendationsProps {
  dietData: DietRecommendationsData | null;
  loading: boolean;
  onRegenerate?: () => void;
  patient?: {
    age?: number;
    weight?: number | string;
    gender?: string;
  };
}

const DietRecommendations: React.FC<DietRecommendationsProps> = ({ dietData, loading, onRegenerate, patient }) => {
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
    <div className="space-y-4">
      {/* Header with regenerate button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="text-green-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">AI Diet Recommendations</h3>
        </div>
        
        {(onRegenerate && !loading) && (
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isRegenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Regenerating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate Diet
              </>
            )}
          </button>
        )}
      </div>
      
      {loading && !isRegenerating ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Generating your personalized Kenyan diet recommendations...</p>
          </div>
        </div>
      ) : dietData ? (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              <strong>🤖 AI Analysis:</strong> Based on your health profile, vitals, and today's alerts, here's your personalized Kenyan diet plan to support heart health:
            </p>
            {patient && (
              <div className="mt-2 text-xs text-green-600">
                Personalized for: {patient.age ? `${patient.age} years old, ` : ''} 
                {patient.gender ? `${patient.gender}, ` : ''}
                {patient.weight ? `${patient.weight} kg` : 'weight not specified'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Breakfast</h4>
              <p className="text-sm text-blue-700">{dietData.breakfast}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Lunch</h4>
              <p className="text-sm text-yellow-700">{dietData.lunch}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Dinner</h4>
              <p className="text-sm text-orange-700">{dietData.dinner}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Snacks</h4>
              <p className="text-sm text-purple-700">{dietData.snacks}</p>
            </div>
          </div>

          {dietData.generalAdvice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">💡 Dietary Advice</h4>
              <p className="text-sm text-blue-700">{dietData.generalAdvice}</p>
            </div>
          )}

          {dietData.calorieTarget && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Daily Calorie Target</h4>
              <p className="text-sm text-green-700">{dietData.calorieTarget} calories per day</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">Unable to load diet recommendations at this time.</p>
        </div>
      )}
    </div>
  );
};

export default DietRecommendations;
