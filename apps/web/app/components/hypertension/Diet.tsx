"use client"
import React from "react";
import { Utensils } from "lucide-react";

export default function Diet({ dietGenerated, onGenerate, lifestyle, recommendations }: any) {
  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Utensils className="text-green-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-800">AI Diet Recommendations</h3>
        </div>
        <button onClick={onGenerate} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Generate Diet Plan
        </button>
      </div>

      {dietGenerated && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-700">
              <strong>AI Analysis:</strong> Based on your lifestyle assessment {lifestyle.alcohol && "(alcohol use noted)"}
              {lifestyle.smoking && "(smoking detected)"} and health data, here's your personalized diet plan:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🌅 Breakfast</h4>
              <p className="text-sm text-blue-700">{recommendations.breakfast}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">🌞 Lunch</h4>
              <p className="text-sm text-yellow-700">{recommendations.lunch}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">🌙 Dinner</h4>
              <p className="text-sm text-orange-700">{recommendations.dinner}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">🍎 Snacks</h4>
              <p className="text-sm text-purple-700">{recommendations.snacks}</p>
            </div>
          </div>
          {(lifestyle.alcohol || lifestyle.smoking) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">⚠️ Lifestyle Recommendations</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {lifestyle.alcohol && <li>• Limit alcohol consumption to support cardiovascular health</li>}
                {lifestyle.smoking && <li>• Consider smoking cessation programs for better heart health</li>}
                {lifestyle.caffeine > 4 && <li>• Reduce caffeine intake to help manage blood pressure</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


