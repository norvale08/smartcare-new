"use client";
import React, { useState, useEffect } from "react";
import { Input, Label, Button } from "@repo/ui";
import { useForm, useWatch } from "react-hook-form";
import { diabetesValidationRules } from "@repo/ui";
import { diabetesType } from "@/types/diabetes";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { wordsToNumbers } from "words-to-numbers";
import { swahiliToNumber } from "../utils/swahiliParser";
import { Heart, Activity, Droplet, CheckCircle2, Utensils, Dumbbell, Clock, Zap } from "lucide-react";

// Groq voice components
import GroqVoiceInput from "../ui/GroqVoiceInput";
import GroqTextToSpeech from "../ui/GroqTextToSpeech";

interface Props {
  onVitalsSubmitted?: (id: string, requestAI: boolean) => void;
  initialLanguage?: "en" | "sw";
}

// Language content
const languageContent = {
  en: {
    title: "Health Vitals Tracker",
    subtitle: "Monitor your glucose levels and vital signs with precision",
    successTitle: "Data Saved Successfully!",
    successMessage: "Your vitals have been securely recorded.",
    
    // Glucose Section
    glucoseTitle: "Glucose Level",
    glucoseSubtitle: "Primary diabetes indicator",
    glucoseLabel: "Blood Glucose (mg/dL)",
    glucosePlaceholder: "e.g., 120",
    
    // Cardiovascular Section
    cardioTitle: "Cardiovascular Vitals",
    cardioSubtitle: "Heart and circulation metrics",
    proTip: "Pro Tip: Regular monitoring helps protect your heart and kidneys.",
    systolicLabel: "Systolic Blood Pressure",
    systolicPlaceholder: "120",
    diastolicLabel: "Diastolic Blood Pressure",
    diastolicPlaceholder: "80",
    heartRateLabel: "Heart Rate (bpm)",
    heartRatePlaceholder: "72",
    
    // Context Section
    contextTitle: "Measurement Context",
    contextSubtitle: "When did you measure?",
    contextLabel: "Measurement Context",
    contextOptions: {
      empty: "Select measurement context",
      fasting: "Fasting (8+ hours without food)",
      postMeal: "Post-Meal (after eating)",
      random: "Random (any time)"
    },
    
    // Meal Details Section
    mealTitle: "Meal Details",
    mealSubtitle: "What did you eat?",
    lastMealLabel: "When did you last eat?",
    mealTypeLabel: "Meal Type",
    lastMealOptions: {
      empty: "Select time",
      twoHours: "Last 2 hours",
      fourHours: "Last 4 hours",
      sixHours: "Last 6 hours",
      moreThanSix: "More than 6 hours"
    },
    mealTypeOptions: {
      empty: "Select type",
      carbs: "🍞 Carbohydrates",
      sugaryDrinks: "🥤 Sugary Drinks",
      proteins: "🍖 Proteins",
      vegetables: "🥗 Vegetables",
      mixed: "🍱 Mixed Meal"
    },
    
    // Exercise Section
    exerciseTitle: "Physical Activity",
    exerciseSubtitle: "Recent exercise impacts glucose",
    exerciseImportant: "Important: Exercise can lower blood glucose levels.",
    exerciseRecentLabel: "Recent Exercise?",
    exerciseIntensityLabel: "Exercise Intensity",
    exerciseOptions: {
      empty: "Select option",
      none: "❌ No recent exercise",
      within2Hours: "⏱️ Within last 2 hours",
      twoToSixHours: "🕐 2-6 hours ago",
      sixTo24Hours: "📅 6-24 hours ago"
    },
    intensityOptions: {
      empty: "Select intensity",
      light: "🚶 Light (Walking, stretching)",
      moderate: "🚴 Moderate (Brisk walk, cycling)",
      vigorous: "🏃 Vigorous (Running, sports)"
    },
    
    // Settings
    aiInsights: "Get AI Health Insights",
    
    // Submit Button
    submitting: "Submitting...",
    submit: "Submit Vitals",
    
    // Voice Messages
    glucoseSet: "Glucose level is set to",
    glucoseNotSet: "Glucose level is not set",
    systolicSet: "Systolic blood pressure is set to",
    systolicNotSet: "Systolic blood pressure is not set",
    diastolicSet: "Diastolic blood pressure is set to",
    diastolicNotSet: "Diastolic blood pressure is not set",
    heartRateSet: "Heart rate is set to",
    heartRateNotSet: "Heart rate is not set",
    
    // Voice Input Messages
    voiceSuccess: "Set to:",
    voiceError: "Please speak a number value"
  },
  sw: {
    title: "Kifaa cha Kufuatilia Viwango vya Afya",
    subtitle: "Fuatilia viwango vya sukari damu na ishara muhimu za kiafya kwa usahihi",
    successTitle: "Data Imehifadhiwa Kikamilifu!",
    successMessage: "Viwango vyako vya kiafya vimeandikwa kwa usalama.",
    
    // Glucose Section
    glucoseTitle: "Kiwango cha Sukari Damu",
    glucoseSubtitle: "Kionyeshi kikuu cha kisukari",
    glucoseLabel: "Sukari Damu (mg/dL)",
    glucosePlaceholder: "mfano, 120",
    
    // Cardiovascular Section
    cardioTitle: "Viwango vya Mfumo wa Moyo na Mishipa",
    cardioSubtitle: "Vipimo vya moyo na mzunguko wa damu",
    proTip: "Ushauri: Ufuatiliaji wa mara kwa mara husaidia kulinda moyo na figo zako.",
    systolicLabel: "Shinikizo la Damu la Sistolic",
    systolicPlaceholder: "120",
    diastolicLabel: "Shinikizo la Damu la Diastolic",
    diastolicPlaceholder: "80",
    heartRateLabel: "Kiwango cha Mapigo ya Moyo (bpm)",
    heartRatePlaceholder: "72",
    
    // Context Section
    contextTitle: "Muktadha wa Kipimo",
    contextSubtitle: "Ulipima lini?",
    contextLabel: "Muktadha wa Kipimo",
    contextOptions: {
      empty: "Chagua muktadha wa kipimo",
      fasting: "Kifunga (saa 8+ bila chakula)",
      postMeal: "Baada ya chakula",
      random: "Ovyo ovyo (wakati wowote)"
    },
    
    // Meal Details Section
    mealTitle: "Maelezo ya Chakula",
    mealSubtitle: "Ulikula nini?",
    lastMealLabel: "Ulimaliza kula lini?",
    mealTypeLabel: "Aina ya Chakula",
    lastMealOptions: {
      empty: "Chagua muda",
      twoHours: "Masha 2 zilizopita",
      fourHours: "Masha 4 zilizopita",
      sixHours: "Masha 6 zilizopita",
      moreThanSix: "Zaidi ya masaa 6"
    },
    mealTypeOptions: {
      empty: "Chagua aina",
      carbs: "🍞 Wanga",
      sugaryDrinks: "🥤 Vinywaji vilivyo na sukari",
      proteins: "🍖 Protini",
      vegetables: "🥗 Mboga mboga",
      mixed: "🍱 Chakula mchanganyiko"
    },
    
    // Exercise Section
    exerciseTitle: "Shughuli za Mwili",
    exerciseSubtitle: "Mazoezi ya hivi karibuni yanaathiri sukari damu",
    exerciseImportant: "Muhimu: Mazoezi yanaweza kupunguza kiwango cha sukari damu.",
    exerciseRecentLabel: "Mazoezi ya Hivi Karibuni?",
    exerciseIntensityLabel: "Ukali wa Mazoezi",
    exerciseOptions: {
      empty: "Chagua chaguo",
      none: "❌ Hakuna mazoezi ya hivi karibuni",
      within2Hours: "⏱️ Ndani ya masaa 2 yaliyopita",
      twoToSixHours: "🕐 Masha 2-6 yaliyopita",
      sixTo24Hours: "📅 Masha 6-24 yaliyopita"
    },
    intensityOptions: {
      empty: "Chagua ukali",
      light: "🚶 Mwepesi (Kutembea, kunyoosha)",
      moderate: "🚴 Wastani (Kutembea kwa kasi, baiskeli)",
      vigorous: "🏃 Mizito (Kukimbia, michezo)"
    },
    
    // Settings
    aiInsights: "Pata Uchambuzi wa Afya kutoka kwa AI",
    
    // Submit Button
    submitting: "Inatumwa...",
    submit: "Wasilisha Viwango vya Kiafya",
    
    // Voice Messages
    glucoseSet: "Kiwango cha sukari kimewekwa",
    glucoseNotSet: "Kiwango cha sukari haijawekwa",
    systolicSet: "Shinikizo la damu la systolic limewekwa",
    systolicNotSet: "Shinikizo la damu la systolic haijawekwa",
    diastolicSet: "Shinikizo la damu la diastolic limewekwa",
    diastolicNotSet: "Shinikizo la damu la diastolic haijawekwa",
    heartRateSet: "Kiwango cha mapigo ya moyo kimewekwa",
    heartRateNotSet: "Kiwango cha mapigo ya moyo haijawekwa",
    
    // Voice Input Messages
    voiceSuccess: "Imewekwa:",
    voiceError: "Tafadhali sema nambari tu"
  }
};

// Enhanced number validation function
function normalizeNumber(text: string): number | null {
  const cleanedText = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log("Cleaned text:", cleanedText);
  
  const directNumber = Number(cleanedText.replace(/[^\d]/g, ''));
  if (!isNaN(directNumber) && directNumber > 0) return directNumber;
  
  const eng = wordsToNumbers(cleanedText);
  if (typeof eng === "number" && !isNaN(eng) && eng > 0) {
    console.log("Converted from English:", eng);
    return eng;
  }
  
  const swa = swahiliToNumber(cleanedText);
  if (swa !== null && swa > 0) {
    console.log("Converted from Swahili:", swa);
    return swa;
  }
  
  console.log("No valid number found in:", text);
  return null;
}

const DiabetesVitalsForm: React.FC<Props> = ({ onVitalsSubmitted, initialLanguage = "en" }) => {
  const { register, handleSubmit, formState, reset, setValue, control } =
    useForm<diabetesType>({
      defaultValues: {
        language: initialLanguage
      }
    });
  const [isLoading, setIsLoading] = useState(false);
  const [requestAI, setRequestAI] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const contextValue = useWatch({ control, name: "context" });
  const languageValue = useWatch({ control, name: "language" }) as "en" | "sw" || initialLanguage;

  const currentLanguage = languageContent[languageValue];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Sync the form language when initialLanguage changes
  useEffect(() => {
    setValue("language", initialLanguage);
  }, [initialLanguage, setValue]);

  const handleFormSubmit = async (data: diabetesType) => {
    setIsLoading(true);
    setSubmitSuccess(false);

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error(languageValue === "sw" ? "Lazima uwe umeingia kwenye mfumo" : "You must be logged in");
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

      toast.success(languageValue === "sw" ? "Data imehifadhiwa kikamilifu" : "Data saved successfully");
      setSubmitSuccess(true);
      reset();
      setRequestAI(false);
      setTimeout(() => setSubmitSuccess(false), 3000);

      if (onVitalsSubmitted) onVitalsSubmitted(result.id, requestAI);
    } catch (error: any) {
      toast.error(error.message || (languageValue === "sw" ? "Hitilafu imetokea" : "An error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (field: keyof diabetesType, value: string) => {
    console.log("Voice input received:", value);
    const normalizedValue = normalizeNumber(value);
    
    if (normalizedValue !== null && normalizedValue > 0) {
      setValue(field, normalizedValue.toString());
      
      const successMessage = `${currentLanguage.voiceSuccess} ${normalizedValue}`;
      toast.success(successMessage);
    } else {
      toast.error(currentLanguage.voiceError);
    }
  };

  const getFieldValue = (fieldName: keyof diabetesType): string => {
    return control._formValues[fieldName] || '';
  };

  // Fixed getVoiceMessage function
  const getVoiceMessage = (field: keyof diabetesType, value: string): string => {
    if (field === 'glucose') {
      return value ? `${currentLanguage.glucoseSet} ${value}` : currentLanguage.glucoseNotSet;
    } else if (field === 'systolic') {
      return value ? `${currentLanguage.systolicSet} ${value}` : currentLanguage.systolicNotSet;
    } else if (field === 'diastolic') {
      return value ? `${currentLanguage.diastolicSet} ${value}` : currentLanguage.diastolicNotSet;
    } else if (field === 'heartRate') {
      return value ? `${currentLanguage.heartRateSet} ${value}` : currentLanguage.heartRateNotSet;
    }
    return value ? `${value}` : '';
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
              {currentLanguage.title}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2">{currentLanguage.subtitle}</p>
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
                <h3 className="font-bold text-green-800 text-sm sm:text-base">{currentLanguage.successTitle}</h3>
                <p className="text-xs sm:text-sm text-green-700">{currentLanguage.successMessage}</p>
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
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentLanguage.glucoseTitle}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{currentLanguage.glucoseSubtitle}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-blue-100">
              <Label htmlFor="glucose" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                {currentLanguage.glucoseLabel} <span className="text-red-500">*</span>
              </Label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    id="glucose"
                    placeholder={currentLanguage.glucosePlaceholder}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    {...register("glucose", diabetesValidationRules.glucose)}
                  />
                  {formState.errors.glucose && (
                    <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{formState.errors.glucose.message}</p>
                  )}
                </div>
                <div className="sm:w-auto w-full flex gap-2">
                  <GroqVoiceInput
                    onResult={(result) => handleVoiceInput("glucose", result)}
                    language={languageValue}
                    size="sm"
                  />
                  <GroqTextToSpeech
                    text={getVoiceMessage("glucose", getFieldValue("glucose"))}
                    voice={languageValue === "sw" ? "nova" : "alloy"}
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
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentLanguage.cardioTitle}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{currentLanguage.cardioSubtitle}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-red-100 mb-3 sm:mb-4">
              <div className="flex items-start gap-2 mb-3 sm:mb-4">
                <Clock className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                <p className="text-xs sm:text-sm text-gray-700 flex-1">
                  {currentLanguage.proTip}
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Systolic */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    {currentLanguage.systolicLabel}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        placeholder={currentLanguage.systolicPlaceholder}
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                        {...register("systolic", diabetesValidationRules.systolic)} 
                      />
                      {formState.errors.systolic && (
                        <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.systolic.message}</p>
                      )}
                    </div>
                    <div className="sm:w-auto w-full flex gap-2">
                      <GroqVoiceInput
                        onResult={(result) => handleVoiceInput("systolic", result)}
                        language={languageValue}
                        size="sm"
                      />
                      <GroqTextToSpeech
                        text={getVoiceMessage("systolic", getFieldValue("systolic"))}
                        voice={languageValue === "sw" ? "nova" : "alloy"}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Diastolic */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    {currentLanguage.diastolicLabel}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        placeholder={currentLanguage.diastolicPlaceholder}
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                        {...register("diastolic", diabetesValidationRules.diastolic)} 
                      />
                      {formState.errors.diastolic && (
                        <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.diastolic.message}</p>
                      )}
                    </div>
                    <div className="sm:w-auto w-full flex gap-2">
                      <GroqVoiceInput
                        onResult={(result) => handleVoiceInput("diastolic", result)}
                        language={languageValue}
                        size="sm"
                      />
                      <GroqTextToSpeech
                        text={getVoiceMessage("diastolic", getFieldValue("diastolic"))}
                        voice={languageValue === "sw" ? "nova" : "alloy"}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    {currentLanguage.heartRateLabel}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input 
                        type="number" 
                        placeholder={currentLanguage.heartRatePlaceholder}
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                        {...register("heartRate", diabetesValidationRules.heartRate)} 
                      />
                      {formState.errors.heartRate && (
                        <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.heartRate.message}</p>
                      )}
                    </div>
                    <div className="sm:w-auto w-full flex gap-2">
                      <GroqVoiceInput
                        onResult={(result) => handleVoiceInput("heartRate", result)}
                        language={languageValue}
                        size="sm"
                      />
                      <GroqTextToSpeech
                        text={getVoiceMessage("heartRate", getFieldValue("heartRate"))}
                        voice={languageValue === "sw" ? "nova" : "alloy"}
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
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentLanguage.contextTitle}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{currentLanguage.contextSubtitle}</p>
              </div>
            </div>

            <Label htmlFor="context" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
              {currentLanguage.contextLabel} <span className="text-red-500">*</span>
            </Label>
            <select
              id="context"
              {...register("context", diabetesValidationRules.context)}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            >
              <option value="">{currentLanguage.contextOptions.empty}</option>
              <option value="Fasting">{currentLanguage.contextOptions.fasting}</option>
              <option value="Post-meal">{currentLanguage.contextOptions.postMeal}</option>
              <option value="Random">{currentLanguage.contextOptions.random}</option>
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
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentLanguage.mealTitle}</h2>
                  <p className="text-xs sm:text-sm text-gray-500">{currentLanguage.mealSubtitle}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-orange-100">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="lastMealTime" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                      {currentLanguage.lastMealLabel} <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      {...register("lastMealTime", diabetesValidationRules.lastMealTime)} 
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    >
                      <option value="">{currentLanguage.lastMealOptions.empty}</option>
                      <option value="2_hours">{currentLanguage.lastMealOptions.twoHours}</option>
                      <option value="4_hours">{currentLanguage.lastMealOptions.fourHours}</option>
                      <option value="6_hours">{currentLanguage.lastMealOptions.sixHours}</option>
                      <option value="more_than_6_hours">{currentLanguage.lastMealOptions.moreThanSix}</option>
                    </select>
                    {formState.errors.lastMealTime && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.lastMealTime.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="mealType" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                      {currentLanguage.mealTypeLabel} <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      {...register("mealType", diabetesValidationRules.mealType)} 
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    >
                      <option value="">{currentLanguage.mealTypeOptions.empty}</option>
                      <option value="carbohydrates">{currentLanguage.mealTypeOptions.carbs}</option>
                      <option value="sugary_drinks">{currentLanguage.mealTypeOptions.sugaryDrinks}</option>
                      <option value="proteins">{currentLanguage.mealTypeOptions.proteins}</option>
                      <option value="vegetables">{currentLanguage.mealTypeOptions.vegetables}</option>
                      <option value="mixed_meal">{currentLanguage.mealTypeOptions.mixed}</option>
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
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{currentLanguage.exerciseTitle}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{currentLanguage.exerciseSubtitle}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-green-100">
              <div className="flex items-start gap-2 mb-3 sm:mb-4">
                <Zap className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                <p className="text-xs sm:text-sm text-gray-700 flex-1">
                  {currentLanguage.exerciseImportant}
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="exerciseRecent" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                    {currentLanguage.exerciseRecentLabel} <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("exerciseRecent", diabetesValidationRules.exerciseRecent)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  >
                    <option value="">{currentLanguage.exerciseOptions.empty}</option>
                    <option value="none">{currentLanguage.exerciseOptions.none}</option>
                    <option value="within_2_hours">{currentLanguage.exerciseOptions.within2Hours}</option>
                    <option value="2_to_6_hours">{currentLanguage.exerciseOptions.twoToSixHours}</option>
                    <option value="6_to_24_hours">{currentLanguage.exerciseOptions.sixTo24Hours}</option>
                  </select>
                  {formState.errors.exerciseRecent && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.exerciseRecent.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="exerciseIntensity" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                    {currentLanguage.exerciseIntensityLabel} <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("exerciseIntensity", diabetesValidationRules.exerciseIntensity)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  >
                    <option value="">{currentLanguage.intensityOptions.empty}</option>
                    <option value="light">{currentLanguage.intensityOptions.light}</option>
                    <option value="moderate">{currentLanguage.intensityOptions.moderate}</option>
                    <option value="vigorous">{currentLanguage.intensityOptions.vigorous}</option>
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
              {/* Language selector removed from here - now in header */}

              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-lg border-2 border-purple-100 hover:border-purple-300 transition-all">
                <input
                  type="checkbox"
                  checked={requestAI}
                  onChange={(e) => setRequestAI(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-gray-700">
                  {currentLanguage.aiInsights}
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
                <span>{currentLanguage.submitting}</span>
              </span>
            ) : (
              currentLanguage.submit
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DiabetesVitalsForm;