"use client";

import React from "react";
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
  dietData: DietRecommendationsData;
  loading: boolean;
}

const DietRecommendations: React.FC<DietRecommendationsProps> = ({ dietData, loading }) => {
  return (
    <div className="space-y-4">
      {loading ? (
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
              <strong>🤖 AI Analysis:</strong> Based on your health profile and vitals, here's your personalized Kenyan diet plan to support heart health:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🌅 Breakfast</h4>
              <p className="text-sm text-blue-700">{dietData.breakfast}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">🌞 Lunch</h4>
              <p className="text-sm text-yellow-700">{dietData.lunch}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">🌙 Dinner</h4>
              <p className="text-sm text-orange-700">{dietData.dinner}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">🍎 Snacks</h4>
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
              <h4 className="font-medium text-green-800 mb-2">🎯 Daily Calorie Target</h4>
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
