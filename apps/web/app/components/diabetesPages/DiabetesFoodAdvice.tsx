"use client";
import React, { useEffect, useState } from "react";
import { Coffee, Sun, Moon, Loader2, RefreshCw, LucideIcon } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MealCardProps {
  meal: { title: string; content: string };
  icon: LucideIcon;
  color: string;
  gradient: string;
  image: string;
}

interface Advice {
  breakfast?: string;
  lunch?: string;
  supper?: string;
  foods_to_avoid?: string;
  [key: string]: string | undefined;
}

interface ApiResponse {
  success: boolean;
  data: {
    glucose: number;
    context: string;
    advice: Advice;
    patient: { name: string; age: number; gender: string; weight?: number; height?: number; bloodPressure?: string };
  } | null;
  message?: string;
}

interface DiabeticFoodAdviceProps {
  vitalsId?: string;
  enabled: boolean;
  onComplete: () => void;
  language?: "en" | "sw";
}

const languageContent = {
  en: {
    title: "Your Personalized Meal Plan",
    subtitle: "Diabetes-friendly recommendations tailored just for you",
    refresh: "Refresh",
    loading: "Loading your personalized meal plan...",
    error: "AI temporarily unavailable",
    noRecommendations: "No food recommendations available",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    foodsToAvoid: "Foods to Avoid",
    continueButton: "Continue to Dashboard →",
  },
  sw: {
    title: "Mpango Wako wa Mlo",
    subtitle: "Mapendekezo ya chakula rafiki kwa kisukari yaliyoundwa mahususi kwako",
    refresh: "Onyesha Upya",
    loading: "Inapakia mpango wako wa mlo...",
    error: "AI haipatikani kwa sasa",
    noRecommendations: "Hakuna mapendekezo ya chakula",
    breakfast: "Kifungua Kinywa",
    lunch: "Chakula cha Mchana",
    dinner: "Chakula cha Jioni",
    foodsToAvoid: "Vyakula vya Kuepuka",
    continueButton: "Endelea kwa Dashibodi →",
  }
};

const MealCard: React.FC<MealCardProps> = ({ meal, icon: Icon, color, gradient, image }) => (
  <div className={`${gradient} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`${color} p-3 rounded-full bg-white bg-opacity-90`}>
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold text-gray-800">{meal.title}</h3>
    </div>
    <div className="bg-white rounded-xl overflow-hidden shadow-md mb-4">
      <img src={image} alt={meal.title} className="w-full h-48 object-cover" />
    </div>
    <div className="bg-white bg-opacity-90 p-4 rounded-xl">
      <p className="text-gray-700 leading-relaxed">{meal.content}</p>
    </div>
  </div>
);

const DiabeticFoodAdvice: React.FC<DiabeticFoodAdviceProps> = ({ 
  vitalsId, 
  enabled, 
  onComplete, 
  language = "en"
}) => {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currentLang = languageContent[language];

  const fetchAdvice = async () => {
    try {
      setLoading(true);
      setError(null);
      setAdvice(null); // ✅ Clear old advice when fetching new data

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      // ✅ Always include language parameter in the API call
      const response = await fetch(
        `${API_URL}/api/diabeticFood/latest?language=${language}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data: ApiResponse = await response.json();

      if (response.ok && data?.data?.advice) {
        setAdvice(data.data.advice);
      } else {
        setError(data.message || currentLang.noRecommendations);
      }
    } catch (err) {
      console.error("Error fetching food advice:", err);
      setError(currentLang.error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch advice when component mounts or language changes
  useEffect(() => {
    fetchAdvice();
  }, [language]); // Refetch when language changes

  const meals = [
    { 
      key: "breakfast" as keyof Advice, 
      title: currentLang.breakfast,
      icon: Coffee, 
      color: "text-amber-600", 
      gradient: "bg-gradient-to-br from-amber-100 to-orange-100", 
      image: "/images/breakfast.jpg" 
    },
    { 
      key: "lunch" as keyof Advice, 
      title: currentLang.lunch,
      icon: Sun, 
      color: "text-green-600", 
      gradient: "bg-gradient-to-br from-green-100 to-emerald-100", 
      image: "/images/lunch.jpg" 
    },
    { 
      key: "supper" as keyof Advice, 
      title: currentLang.dinner,
      icon: Moon, 
      color: "text-indigo-600", 
      gradient: "bg-gradient-to-br from-indigo-100 to-purple-100", 
      image: "/images/dinner.jpg" 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">{currentLang.title}</h1>
            <p className="text-gray-600 text-lg">{currentLang.subtitle}</p>
          </div>
          <button 
            onClick={fetchAdvice} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            {currentLang.refresh}
          </button>
        </div>

        <div className="shadow-2xl rounded-3xl bg-white bg-opacity-80 backdrop-blur-sm border border-gray-200">
          <div className="p-8">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <div className="text-gray-600 text-lg">{currentLang.loading}</div>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600 font-semibold text-lg">
                {error}
              </div>
            )}

            {!loading && !error && advice && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {meals.map(meal => advice[meal.key] && (
                    <MealCard 
                      key={meal.key} 
                      meal={{ title: meal.title, content: advice[meal.key]! }} 
                      icon={meal.icon} 
                      color={meal.color} 
                      gradient={meal.gradient} 
                      image={meal.image} 
                    />
                  ))}
                </div>

                {advice.foods_to_avoid && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <h3 className="text-red-700 font-bold text-lg mb-2">{currentLang.foodsToAvoid}</h3>
                    <p className="text-red-600">{advice.foods_to_avoid}</p>
                  </div>
                )}
              </>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={onComplete}
                disabled={!advice || loading}
                className={`px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 transform ${
                  advice && !loading
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105" 
                    : "bg-gray-300 cursor-not-allowed text-gray-500"
                }`}
              >
                {currentLang.continueButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiabeticFoodAdvice;