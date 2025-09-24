"use client";
import React, { useEffect, useState } from "react";

interface Props {
  vitalsId?: string;
  enabled: boolean;
  onComplete?: () => void; // ✅ updated prop name
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DiabetesFoodAdvice: React.FC<Props> = ({ vitalsId, enabled, onComplete }) => {
  const [foodAdvice, setFoodAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !vitalsId) return;
    setLoading(true);

    fetch(`${API_URL}/api/diabetesVitals/food/${vitalsId}`)
      .then(res => res.json())
      .then(data => {
        setFoodAdvice(data.foodAdvice);
        setLoading(false);
        onComplete?.(); // ✅ call onComplete after fetching
      })
      .catch(err => {
        console.error(err);
        setFoodAdvice("Failed to load food advice.");
        setLoading(false);
      });
  }, [vitalsId, enabled, onComplete]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-lg font-semibold text-green-600">🍎 Food Recommendations</h3>
      {loading ? (
        <p className="text-gray-500">Fetching food advice...</p>
      ) : foodAdvice ? (
        <div className="bg-gray-50 border-l-4 border-green-500 p-3 rounded mt-2">
          {foodAdvice}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Submit vitals and request AI to get food advice.
        </p>
      )}
    </div>
  );
};

export default DiabetesFoodAdvice;
