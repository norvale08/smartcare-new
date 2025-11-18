"use client";
import React, { useState } from "react";
import { Input, Label, Button } from "@repo/ui";
import { useForm, useWatch } from "react-hook-form";
import { diabetesValidationRules } from "@repo/ui";
import { diabetesType } from "@/types/diabetes";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import VoiceInput from "../ui/VoiceInput";
import { wordsToNumbers } from "words-to-numbers";
import { swahiliToNumber } from "../utils/swahiliParser";
import { Heart, Activity, Droplet, MessageSquare, CheckCircle2, Utensils, Dumbbell, Clock, Zap, Menu, X } from "lucide-react";

interface Props {
  onVitalsSubmitted?: (id: string, requestAI: boolean) => void;
}

function normalizeNumber(text: string): number | null {
  text = text.toLowerCase().trim();
  if (!isNaN(Number(text))) return Number(text);
  const eng = wordsToNumbers(text);
  if (typeof eng === "number" && !isNaN(eng)) return eng;
  const swa = swahiliToNumber(text);
  if (swa !== null) return swa;
  return null;
}

const DiabetesVitalsForm: React.FC<Props> = ({ onVitalsSubmitted }) => {
  const { register, handleSubmit, formState, reset, setValue, control } =
    useForm<diabetesType>();
  const [isLoading, setIsLoading] = useState(false);
  const [requestAI, setRequestAI] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const contextValue = useWatch({ control, name: "context" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleFormSubmit = async (data: diabetesType) => {
    setIsLoading(true);
    setSubmitSuccess(false);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/diabetesVitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          glucose: Number(data.glucose),
          systolic: Number(data.systolic),
          diastolic: Number(data.diastolic),
          heartRate: Number(data.heartRate),
          requestAI,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to add vitals");

      toast.success("Data saved successfully");
      setSubmitSuccess(true);
      reset();
      setRequestAI(false);
      setTimeout(() => setSubmitSuccess(false), 3000);

      if (onVitalsSubmitted) onVitalsSubmitted(result.id, requestAI);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (field: keyof diabetesType, value: string) => {
    const normalizedValue = normalizeNumber(value);
    if (normalizedValue !== null) {
      setValue(field, normalizedValue.toString());
    } else {
      setValue(field, value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <CustomToaster />
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -mr-12 -mt-12 sm:-mr-20 sm:-mt-20 md:-mr-24 md:-mt-24"></div>
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl mb-2 sm:mb-3 shadow-md">
              <Activity className="text-white" size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              Health Vitals Tracker
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">Monitor your glucose levels and vital signs with precision</p>
          </div>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="text-white" size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-green-800 text-sm sm:text-base">Data Saved Successfully!</h3>
                <p className="text-xs sm:text-sm text-green-700">Your vitals have been securely recorded.</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
          
          {/* Glucose Level */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Droplet className="text-white" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Glucose Level</h2>
                <p className="text-xs sm:text-sm text-gray-500">Primary diabetes indicator</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-blue-100">
              <Label htmlFor="glucose" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                Blood Glucose (mg/dL) <span className="text-red-500">*</span>
              </Label>
              
              {/* Updated layout for responsive voice input */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    id="glucose"
                    placeholder="e.g., 120"
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    {...register("glucose", diabetesValidationRules.glucose)}
                  />
                  {formState.errors.glucose && (
                    <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{formState.errors.glucose.message}</p>
                  )}
                </div>
                <div className="sm:w-auto w-full">
                  <VoiceInput
                    onResult={(result) => handleVoiceInput("glucose", result)}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cardiovascular Vitals */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Heart className="text-white" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Cardiovascular Vitals</h2>
                <p className="text-xs sm:text-sm text-gray-500">Heart and circulation metrics</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-red-100 mb-3 sm:mb-4">
              <div className="flex items-start gap-2 mb-3 sm:mb-4">
                <Clock className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                <p className="text-xs sm:text-sm text-gray-700 flex-1">
                  <strong>Pro Tip:</strong> Regular monitoring helps protect your heart and kidneys.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Systolic */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    Systolic Blood Pressure
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        placeholder="120" 
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                        {...register("systolic", diabetesValidationRules.systolic)} 
                      />
                      {formState.errors.systolic && (
                        <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.systolic.message}</p>
                      )}
                    </div>
                    <div className="sm:w-auto w-full">
                      <VoiceInput
                        onResult={(result) => handleVoiceInput("systolic", result)}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Diastolic */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    Diastolic Blood Pressure
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        placeholder="80" 
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                        {...register("diastolic", diabetesValidationRules.diastolic)} 
                      />
                      {formState.errors.diastolic && (
                        <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.diastolic.message}</p>
                      )}
                    </div>
                    <div className="sm:w-auto w-full">
                      <VoiceInput
                        onResult={(result) => handleVoiceInput("diastolic", result)}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    Heart Rate (bpm)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        placeholder="72" 
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                        {...register("heartRate", diabetesValidationRules.heartRate)} 
                      />
                      {formState.errors.heartRate && (
                        <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.heartRate.message}</p>
                      )}
                    </div>
                    <div className="sm:w-auto w-full">
                      <VoiceInput
                        onResult={(result) => handleVoiceInput("heartRate", result)}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Measurement Context */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Clock className="text-white" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Measurement Context</h2>
                <p className="text-xs sm:text-sm text-gray-500">When did you measure?</p>
              </div>
            </div>

            <Label htmlFor="context" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
              Measurement Context <span className="text-red-500">*</span>
            </Label>
            <select
              id="context"
              {...register("context", diabetesValidationRules.context)}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="">Select measurement context</option>
              <option value="Fasting">Fasting (8+ hours without food)</option>
              <option value="Post-meal">Post-Meal (after eating)</option>
              <option value="Random">Random (any time)</option>
            </select>
            {formState.errors.context && (
              <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{formState.errors.context.message}</p>
            )}
          </div>

          {/* Meal Details - Conditional */}
          {contextValue === "Post-meal" && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <Utensils className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Meal Details</h2>
                  <p className="text-xs sm:text-sm text-gray-500">What did you eat?</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-orange-100">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="lastMealTime" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                      When did you last eat? <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      {...register("lastMealTime", diabetesValidationRules.lastMealTime)} 
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    >
                      <option value="">Select time</option>
                      <option value="2_hours">Last 2 hours</option>
                      <option value="4_hours">Last 4 hours</option>
                      <option value="6_hours">Last 6 hours</option>
                      <option value="more_than_6_hours">More than 6 hours</option>
                    </select>
                    {formState.errors.lastMealTime && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.lastMealTime.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="mealType" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                      Meal Type <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      {...register("mealType", diabetesValidationRules.mealType)} 
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    >
                      <option value="">Select type</option>
                      <option value="carbohydrates">🍞 Carbohydrates</option>
                      <option value="sugary_drinks">🥤 Sugary Drinks</option>
                      <option value="proteins">🍖 Proteins</option>
                      <option value="vegetables">🥗 Vegetables</option>
                      <option value="mixed_meal">🍱 Mixed Meal</option>
                    </select>
                    {formState.errors.mealType && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.mealType.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Exercise Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Dumbbell className="text-white" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">Physical Activity</h2>
                <p className="text-xs sm:text-sm text-gray-500">Recent exercise impacts glucose</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-green-100">
              <div className="flex items-start gap-2 mb-3 sm:mb-4">
                <Zap className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                <p className="text-xs sm:text-sm text-gray-700 flex-1">
                  <strong>Important:</strong> Exercise can lower blood glucose levels.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="exerciseRecent" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                    Recent Exercise? <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("exerciseRecent", diabetesValidationRules.exerciseRecent)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  >
                    <option value="">Select option</option>
                    <option value="none">❌ No recent exercise</option>
                    <option value="within_2_hours">⏱️ Within last 2 hours</option>
                    <option value="2_to_6_hours">🕐 2-6 hours ago</option>
                    <option value="6_to_24_hours">📅 6-24 hours ago</option>
                  </select>
                  {formState.errors.exerciseRecent && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.exerciseRecent.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="exerciseIntensity" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                    Exercise Intensity <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("exerciseIntensity", diabetesValidationRules.exerciseIntensity)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  >
                    <option value="">Select intensity</option>
                    <option value="light">🚶 Light (Walking, stretching)</option>
                    <option value="moderate">🚴 Moderate (Brisk walk, cycling)</option>
                    <option value="vigorous">🏃 Vigorous (Running, sports)</option>
                  </select>
                  {formState.errors.exerciseIntensity && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.exerciseIntensity.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="language" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                  Language Preference
                </Label>
                <select 
                  {...register("language")} 
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="sw">🇰🇪 Kiswahili</option>
                </select>
              </div>

              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-lg border-2 border-purple-100 hover:border-purple-300 transition-all">
                <input
                  type="checkbox"
                  checked={requestAI}
                  onChange={(e) => setRequestAI(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-gray-700">
                  🤖 Get AI Health Insights
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm sm:text-base md:text-lg font-bold py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </span>
            ) : (
              "Submit Vitals"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 bg-white rounded-xl p-4 sm:p-6 shadow-md">
          <p className="text-gray-600 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base">
            <span className="text-lg sm:text-xl md:text-2xl">🔒</span>
            <span className="font-semibold">Your health data is private and secure</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiabetesVitalsForm;