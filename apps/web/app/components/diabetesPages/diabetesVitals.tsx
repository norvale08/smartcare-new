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
import { Heart, Activity, Droplet, MessageSquare, CheckCircle2, Utensils, Dumbbell, Clock, Zap } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      <CustomToaster />
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
              <Activity className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              Health Vitals Tracker
            </h1>
            <p className="text-gray-600 text-lg">Monitor your glucose levels and vital signs with precision</p>
          </div>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-5 mb-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-white" size={28} />
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-lg">Data Saved Successfully!</h3>
                <p className="text-sm text-green-700">Your vitals have been securely recorded.</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          
          {/* Glucose Level */}
          <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Droplet className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Glucose Level</h2>
                <p className="text-sm text-gray-500">Primary diabetes indicator</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-100">
              <Label htmlFor="glucose" className="text-sm font-semibold text-gray-700 mb-2">
                Blood Glucose (mg/dL) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                id="glucose"
                placeholder="e.g., 120"
                className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                {...register("glucose", diabetesValidationRules.glucose)}
              />
              {formState.errors.glucose && (
                <p className="text-red-600 text-sm mt-2 font-medium">{formState.errors.glucose.message}</p>
              )}
              
            </div>
          </div>

          {/* Cardiovascular Vitals */}
          <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Cardiovascular Vitals</h2>
                <p className="text-sm text-gray-500">Heart and circulation metrics</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-100 mb-4">
              <div className="flex items-start gap-3 mb-4">
                <Clock className="text-red-500 mt-1 flex-shrink-0" size={20} />
                <p className="text-sm text-gray-700">
                  <strong>Pro Tip:</strong> Regular monitoring (weekly or monthly) helps protect your heart and kidneys from diabetes complications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Systolic 
                  </label>
                  <Input 
                    type="number" 
                    placeholder="120" 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                    {...register("systolic", diabetesValidationRules.systolic)} 
                  />
                  {formState.errors.systolic && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.systolic.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Diastolic 
                  </label>
                  <Input 
                    type="number" 
                    placeholder="80" 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                    {...register("diastolic", diabetesValidationRules.diastolic)} 
                  />
                  {formState.errors.diastolic && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.diastolic.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Heart Rate (bpm) 
                  </label>
                  <Input 
                    type="number" 
                    placeholder="72" 
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                    {...register("heartRate", diabetesValidationRules.heartRate)} 
                  />
                  {formState.errors.heartRate && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.heartRate.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Measurement Context */}
          <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Measurement Context</h2>
                <p className="text-sm text-gray-500">When did you measure?</p>
              </div>
            </div>

            <Label htmlFor="context" className="text-sm font-semibold text-gray-700 mb-2">
              Measurement Context <span className="text-red-500">*</span>
            </Label>
            <select
              id="context"
              {...register("context", diabetesValidationRules.context)}
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="">Select measurement context</option>
              <option value="Fasting"> Fasting (8+ hours without food)</option>
              <option value="Post-meal">Post-Meal (after eating)</option>
              <option value="Random">Random (any time)</option>
            </select>
            {formState.errors.context && (
              <p className="text-red-600 text-sm mt-2 font-medium">{formState.errors.context.message}</p>
            )}
          </div>

          {/* Meal Details - Conditional */}
          {contextValue === "Post-meal" && (
            <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Utensils className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Meal Details</h2>
                  <p className="text-sm text-gray-500">What did you eat?</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastMealTime" className="text-sm font-semibold text-gray-700 mb-2">
                      When did you last eat? <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      {...register("lastMealTime", diabetesValidationRules.lastMealTime)} 
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
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
                    <Label htmlFor="mealType" className="text-sm font-semibold text-gray-700 mb-2">
                      Meal Type <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      {...register("mealType", diabetesValidationRules.mealType)} 
                      className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
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
          <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Dumbbell className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Physical Activity</h2>
                <p className="text-sm text-gray-500">Recent exercise impacts glucose</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100">
              <div className="flex items-start gap-3 mb-4">
                <Zap className="text-green-500 mt-1 flex-shrink-0" size={20} />
                <p className="text-sm text-gray-700">
                  <strong>Important:</strong> Exercise can lower blood glucose levels for up to 24 hours after activity. Track it for accurate readings!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exerciseRecent" className="text-sm font-semibold text-gray-700 mb-2">
                    Recent Exercise? <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("exerciseRecent", diabetesValidationRules.exerciseRecent)}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
                  <Label htmlFor="exerciseIntensity" className="text-sm font-semibold text-gray-700 mb-2">
                    Exercise Intensity <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("exerciseIntensity", diabetesValidationRules.exerciseIntensity)}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
          <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="language" className="text-sm font-semibold text-gray-700 mb-2">
                  Language Preference
                </Label>
                <select 
                  {...register("language")} 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="sw">🇰🇪 Kiswahili</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-all w-full">
                  <input
                    type="checkbox"
                    checked={requestAI}
                    onChange={(e) => setRequestAI(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    🤖 Get AI Health Insights
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-bold py-5 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </span>
            ) : (
              "Submit Vitals"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 bg-white rounded-2xl p-6 shadow-lg">
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <span className="text-2xl">🔒</span>
            <span className="font-semibold">Your health data is private and secure</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiabetesVitalsForm;