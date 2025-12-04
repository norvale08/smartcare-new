// apps/web/app/components/diabetesPages/DiabetesVitalsForm.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { diabetesType } from "@/types/diabetes";
import VoiceControlPanel from "./components/VoiceControlPanel";
import GlucoseSection from "./components/GlucoseSection";
import CardiovascularSection from "./components/CardiovascularSection";
import ContextSection from "./components/ContextSection";
import MealSection from "./components/MealSection";
import ExerciseSection from "./components/ExerciseSection";
import AISettingsSection from "./components/AISettingsSection";
import SubmitButton from "./components/SubmitButton";
import { 
  startVoiceMode, 
  stopVoiceMode, 
  speak, 
  listenForField 
} from "./utils/voiceUtils";
import { 
  languageContent, 
  VoiceModeState,
  diabetesValidationRules 
} from "./utils/formUtils";

interface Props {
  onVitalsSubmitted?: (id: string, requestAI: boolean) => void;
  initialLanguage?: "en" | "sw";
}

const DiabetesVitalsForm: React.FC<Props> = ({ onVitalsSubmitted, initialLanguage = "en" }) => {
  const { register, handleSubmit, formState, reset, setValue, control, getValues } = useForm<diabetesType>({
    defaultValues: { 
      language: initialLanguage,
      glucose: undefined,
      systolic: undefined,
      diastolic: undefined,
      heartRate: undefined,
      context: '',
      lastMealTime: '',
      mealType: '',
      exerciseRecent: '',
      exerciseIntensity: ''
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [requestAI, setRequestAI] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [voiceModeState, setVoiceModeState] = useState<VoiceModeState>({
    active: false,
    listening: false,
    speaking: false,
    currentField: null,
    muted: false,
    status: ""
  });

  const contextValue = useWatch({ control, name: "context" });
  const languageValue = (useWatch({ control, name: "language" }) as "en" | "sw") || initialLanguage;
  const currentLanguage = languageContent[languageValue];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  const isProcessingRef = useRef(false);
  const fieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceModeActiveRef = useRef(false);

  useEffect(() => {
    setValue("language", initialLanguage);
  }, [initialLanguage, setValue]);

  // Update voice mode ref when state changes
  useEffect(() => {
    voiceModeActiveRef.current = voiceModeState.active;
  }, [voiceModeState.active]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      voiceModeActiveRef.current = false;
    };
  }, []);

  // Text-to-Speech wrapper
  const handleSpeak = useCallback(async (text: string): Promise<void> => {
    return speak(text, languageValue, voiceModeState.muted, voiceModeActiveRef, (speaking, status) => {
      setVoiceModeState(prev => ({ ...prev, speaking, status }));
    });
  }, [languageValue, voiceModeState.muted]);

  // Define which fields are required based on validation rules
  const getFieldRequiredStatus = useCallback((fieldName: string): boolean => {
    const fieldRules = diabetesValidationRules[fieldName as keyof typeof diabetesValidationRules];
    
    // Check if field has a "required" validation rule
    if (fieldRules) {
      // Check if required rule exists
      if ('required' in fieldRules && fieldRules.required) {
        return true;
      }
      
      // Check for validate function that might enforce required
      if ('validate' in fieldRules && fieldRules.validate) {
        const validateStr = fieldRules.validate.toString();
        if (validateStr.includes('required') || validateStr.includes('Required')) {
          return true;
        }
      }
    }
    
    // Default required fields based on the form structure
    switch (fieldName) {
      case 'glucose':
      case 'context':
      case 'exerciseRecent':
      case 'exerciseIntensity':
        return true;
      case 'lastMealTime':
      case 'mealType':
        // These are only required if context is Post-meal
        return contextValue === "Post-meal";
      case 'systolic':
      case 'diastolic':
      case 'heartRate':
        return false; // These are optional
      default:
        return false;
    }
  }, [contextValue]);

  // Start voice mode
  const handleStartVoiceMode = async () => {
    await startVoiceMode({
      languageValue,
      currentLanguage,
      voiceModeActiveRef,
      voiceModeState,
      setVoiceModeState,
      setValue,
      getValues,
      toast,
      handleSpeak,
      listenForField: (
        fieldName: string,
        fieldLabel: string,
        fieldType: "number" | "select",
        min?: number,
        max?: number
      ) => {
        // Get the correct required status for this field
        const isRequired = getFieldRequiredStatus(fieldName);
        
        return listenForField({
          fieldName,
          fieldLabel,
          fieldType,
          min,
          max,
          languageValue,
          currentLanguage,
          voiceModeActiveRef,
          isProcessingRef,
          setVoiceModeState,
          mediaRecorderRef,
          API_URL,
          fieldRefs,
          handleSpeak,
          isRequired  // ← Now passing correct required status!
        });
      }
    });
  };

  // Stop voice mode
  const handleStopVoiceMode = () => {
    stopVoiceMode({
      voiceModeActiveRef,
      mediaRecorderRef,
      currentLanguage,
      setVoiceModeState,
      handleSpeak,
      isMuted: voiceModeState.muted
    });
  };

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
      // Ensure numbers are properly converted, handling undefined values
      const submitData = {
        ...data,
        glucose: data.glucose ? Number(data.glucose) : undefined,
        systolic: data.systolic ? Number(data.systolic) : undefined,
        diastolic: data.diastolic ? Number(data.diastolic) : undefined,
        heartRate: data.heartRate ? Number(data.heartRate) : undefined,
        requestAI,
      };

      const response = await fetch(`${API_URL}/api/diabetesVitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to add vitals");

      toast.success(languageValue === "sw" ? "Data imehifadhiwa kikamilifu" : "Data saved successfully");
      setSubmitSuccess(true);
      
      reset({
        language: languageValue,
        glucose: undefined as any,
        systolic: undefined as any,
        diastolic: undefined as any,
        heartRate: undefined as any,
        context: '',
        lastMealTime: '',
        mealType: '',
        exerciseRecent: '',
        exerciseIntensity: ''
      });
      
      setRequestAI(false);
      setTimeout(() => setSubmitSuccess(false), 3000);
      if (onVitalsSubmitted && result.id) onVitalsSubmitted(result.id, requestAI);
    } catch (error: any) {
      toast.error(error.message || (languageValue === "sw" ? "Hitilafu imetokea" : "An error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  // Set field ref
  const setFieldRef = useCallback((fieldName: string) => (el: HTMLDivElement | null) => {
    fieldRefs.current[fieldName] = el;
  }, []);

  // Get field style
  const getFieldStyle = (fieldName: string) => {
    const isActive = voiceModeState.currentField === fieldName;
    return {
      border: isActive ? '2px solid #3b82f6' : '2px solid #e5e7eb',
      boxShadow: isActive ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      transition: 'all 0.3s ease-in-out'
    };
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
              <div className="text-white text-xl">🏥</div>
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
                <div className="text-white text-sm">✓</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-green-800 text-sm sm:text-base">{currentLanguage.successTitle}</h3>
                <p className="text-xs sm:text-sm text-green-700">{currentLanguage.successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Voice Control Panel */}
        <VoiceControlPanel
          voiceModeState={voiceModeState}
          currentLanguage={currentLanguage}
          languageValue={languageValue}
          onToggleMute={() => setVoiceModeState(prev => ({ ...prev, muted: !prev.muted }))}
          onToggleVoiceMode={voiceModeState.active ? handleStopVoiceMode : handleStartVoiceMode}
        />

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
          
          {/* Glucose Level */}
          <GlucoseSection
            register={register}
            errors={formState.errors}
            currentLanguage={currentLanguage}
            validationRules={diabetesValidationRules}
            setFieldRef={setFieldRef}
            fieldStyle={getFieldStyle('glucose')}
          />

          {/* Cardiovascular Vitals */}
          <CardiovascularSection
            register={register}
            errors={formState.errors}
            currentLanguage={currentLanguage}
            validationRules={diabetesValidationRules}
            setFieldRef={setFieldRef}
            getFieldStyle={getFieldStyle}
          />

          {/* Context Section */}
          <ContextSection
            register={register}
            errors={formState.errors}
            currentLanguage={currentLanguage}
            validationRules={diabetesValidationRules}
            setFieldRef={setFieldRef}
            fieldStyle={getFieldStyle('context')}
          />

          {/* Meal Details - Conditional */}
          {contextValue === "Post-meal" && (
            <MealSection
              register={register}
              errors={formState.errors}
              currentLanguage={currentLanguage}
              validationRules={diabetesValidationRules}
              setFieldRef={setFieldRef}
              getFieldStyle={getFieldStyle}
            />
          )}

          {/* Exercise Section */}
          <ExerciseSection
            register={register}
            errors={formState.errors}
            currentLanguage={currentLanguage}
            validationRules={diabetesValidationRules}
            setFieldRef={setFieldRef}
            getFieldStyle={getFieldStyle}
          />

          {/* AI Settings */}
          <AISettingsSection
            requestAI={requestAI}
            onToggleAI={() => setRequestAI(!requestAI)}
            currentLanguage={currentLanguage}
          />

          {/* Submit Button */}
          <SubmitButton
            isLoading={isLoading}
            currentLanguage={currentLanguage}
          />
        </form>
      </div>
    </div>
  );
};

export default DiabetesVitalsForm;