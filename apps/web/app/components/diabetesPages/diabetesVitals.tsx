// apps/web/app/components/diabetesPages/DiabetesVitalsForm.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { diabetesType } from "@/types/diabetes";
import VoiceControlPanel from "./components/VoiceControlPanel";
import SectionVoiceControl from "./components/SectionVoiceControl";
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
  pauseVoiceMode,
  resumeVoiceMode,
  speak
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
    paused: false,
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
  const pausedRef = useRef(false);

  // Debug useEffect
  useEffect(() => {
    console.log("=== VOICE MODE STATE UPDATE ===");
    console.log("Active:", voiceModeState.active);
    console.log("Listening:", voiceModeState.listening);
    console.log("Speaking:", voiceModeState.speaking);
    console.log("Paused:", voiceModeState.paused);
    console.log("Current Field:", voiceModeState.currentField);
    console.log("Status:", voiceModeState.status);
    console.log("pausedRef.current:", pausedRef.current);
    console.log("voiceModeActiveRef.current:", voiceModeActiveRef.current);
    console.log("=== END STATE UPDATE ===");
  }, [voiceModeState]);

  useEffect(() => {
    setValue("language", initialLanguage);
  }, [initialLanguage, setValue]);

  useEffect(() => {
    voiceModeActiveRef.current = voiceModeState.active;
    pausedRef.current = voiceModeState.paused;
  }, [voiceModeState.active, voiceModeState.paused]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.log("Cleanup error:", error);
        }
      }
      voiceModeActiveRef.current = false;
      pausedRef.current = false;
    };
  }, []);

  const handleSpeak = useCallback(async (text: string): Promise<void> => {
    console.log("Speaking:", text);
    return speak(text, languageValue, voiceModeState.muted, voiceModeActiveRef, pausedRef, (speaking: boolean, status: string) => {
      console.log("Speak callback:", { speaking, status });
      setVoiceModeState(prev => ({ ...prev, speaking, status }));
    });
  }, [languageValue, voiceModeState.muted]);

  const getFieldRequiredStatus = useCallback((fieldName: string): boolean => {
    const fieldRules = diabetesValidationRules[fieldName as keyof typeof diabetesValidationRules];
    
    if (fieldRules) {
      if ('required' in fieldRules && fieldRules.required) {
        return true;
      }
      
      if ('validate' in fieldRules && fieldRules.validate) {
        const validateStr = fieldRules.validate.toString();
        if (validateStr.includes('required') || validateStr.includes('Required')) {
          return true;
        }
      }
    }
    
    switch (fieldName) {
      case 'glucose':
      case 'context':
      case 'exerciseRecent':
      case 'exerciseIntensity':
        return true;
      case 'lastMealTime':
      case 'mealType':
        return contextValue === "Post-meal";
      case 'systolic':
      case 'diastolic':
      case 'heartRate':
        return false;
      default:
        return false;
    }
  }, [contextValue]);

  const handleStartVoiceMode = async () => {
    console.log("=== START VOICE MODE ===");
    try {
      await startVoiceMode({
        languageValue,
        currentLanguage,
        voiceModeActiveRef,
        pausedRef,
        voiceModeState,
        setVoiceModeState,
        setValue,
        getValues,
        toast,
        handleSpeak,
        isProcessingRef,
        mediaRecorderRef,
        API_URL,
        fieldRefs
      });
    } catch (error) {
      console.error("Error starting voice mode:", error);
      toast.error("Failed to start voice mode");
      setVoiceModeState(prev => ({ ...prev, active: false }));
      voiceModeActiveRef.current = false;
    }
  };

  const handleStopVoiceMode = () => {
    console.log("=== STOP VOICE MODE ===");
    stopVoiceMode({
      voiceModeActiveRef,
      pausedRef,
      mediaRecorderRef,
      currentLanguage,
      setVoiceModeState,
      handleSpeak,
      isMuted: voiceModeState.muted
    });
  };

  const handlePauseVoiceMode = useCallback(() => {
    console.log("=== PAUSE VOICE MODE ===");
    console.log("Before pause - pausedRef.current:", pausedRef.current);
    console.log("Before pause - voiceModeState.paused:", voiceModeState.paused);
    
    pauseVoiceMode({
      voiceModeActiveRef,
      pausedRef,
      mediaRecorderRef,
      setVoiceModeState,
      handleSpeak,
      languageValue,
      isMuted: voiceModeState.muted
    });
  }, [voiceModeActiveRef, pausedRef, mediaRecorderRef, setVoiceModeState, handleSpeak, languageValue, voiceModeState.muted]);

  const handleResumeVoiceMode = useCallback(async () => {
    console.log("=== RESUME VOICE MODE ===");
    console.log("Before resume - pausedRef.current:", pausedRef.current);
    console.log("Before resume - voiceModeState.paused:", voiceModeState.paused);
    
    await resumeVoiceMode({
      voiceModeActiveRef,
      pausedRef,
      setVoiceModeState,
      handleSpeak,
      languageValue,
      isMuted: voiceModeState.muted,
      currentField: voiceModeState.currentField
    });
  }, [voiceModeActiveRef, pausedRef, setVoiceModeState, handleSpeak, languageValue, voiceModeState.muted, voiceModeState.currentField]);

  // SIMPLIFIED PAUSE/RESUME HANDLER
  const handlePauseResume = useCallback(() => {
    console.log('=== Unified Pause/Resume Handler ===');
    console.log('Current voice mode state:', voiceModeState);
    console.log('pausedRef.current:', pausedRef.current);
    console.log('voiceModeActiveRef.current:', voiceModeActiveRef.current);
    
    // Don't do anything if voice mode is not active
    if (!voiceModeState.active) {
      console.log('Voice mode not active, ignoring pause/resume');
      toast.error("Voice mode is not active");
      return;
    }
    
    // If currently listening or speaking, we can still pause
    if (voiceModeState.paused) {
      console.log('>>> Calling Resume');
      handleResumeVoiceMode();
    } else {
      console.log('>>> Calling Pause');
      handlePauseVoiceMode();
    }
  }, [voiceModeState, handlePauseVoiceMode, handleResumeVoiceMode]);

  const handleToggleMute = () => {
    const newMutedState = !voiceModeState.muted;
    console.log("Toggling mute to:", newMutedState);
    setVoiceModeState(prev => ({ ...prev, muted: newMutedState }));
    
    if (!newMutedState && voiceModeState.active) {
      handleSpeak(
        languageValue === "sw" 
          ? "Sauti imewashwa" 
          : "Sound turned on"
      ).catch(error => console.error("Error speaking mute status:", error));
    }
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

  const setFieldRef = useCallback((fieldName: string) => (el: HTMLDivElement | null) => {
    fieldRefs.current[fieldName] = el;
  }, []);

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

      
        <VoiceControlPanel
          voiceModeState={voiceModeState}
          currentLanguage={currentLanguage}
          languageValue={languageValue}
          onToggleMute={handleToggleMute}
          onToggleVoiceMode={voiceModeState.active ? handleStopVoiceMode : handleStartVoiceMode}
          onPauseResume={handlePauseResume}
        />

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
          
          <div>
            <SectionVoiceControl
              sectionName="glucose"
              voiceModeState={voiceModeState}
              onPauseResume={handlePauseResume}
              languageValue={languageValue}
            />
            <GlucoseSection
              register={register}
              errors={formState.errors}
              currentLanguage={currentLanguage}
              validationRules={diabetesValidationRules}
              setFieldRef={setFieldRef}
              fieldStyle={getFieldStyle('glucose')}
            />
          </div>

          <div>
            <SectionVoiceControl
              sectionName="cardiovascular"
              voiceModeState={voiceModeState}
              onPauseResume={handlePauseResume}
              languageValue={languageValue}
            />
            <CardiovascularSection
              register={register}
              errors={formState.errors}
              currentLanguage={currentLanguage}
              validationRules={diabetesValidationRules}
              setFieldRef={setFieldRef}
              getFieldStyle={getFieldStyle}
            />
          </div>

          <div>
            <SectionVoiceControl
              sectionName="context"
              voiceModeState={voiceModeState}
              onPauseResume={handlePauseResume}
              languageValue={languageValue}
            />
            <ContextSection
              register={register}
              errors={formState.errors}
              currentLanguage={currentLanguage}
              validationRules={diabetesValidationRules}
              setFieldRef={setFieldRef}
              fieldStyle={getFieldStyle('context')}
            />
          </div>

          {contextValue === "Post-meal" && (
            <div>
              <SectionVoiceControl
                sectionName="meal"
                voiceModeState={voiceModeState}
                onPauseResume={handlePauseResume}
                languageValue={languageValue}
              />
              <MealSection
                register={register}
                errors={formState.errors}
                currentLanguage={currentLanguage}
                validationRules={diabetesValidationRules}
                setFieldRef={setFieldRef}
                getFieldStyle={getFieldStyle}
              />
            </div>
          )}

          <div>
            <SectionVoiceControl
              sectionName="exercise"
              voiceModeState={voiceModeState}
              onPauseResume={handlePauseResume}
              languageValue={languageValue}
            />
            <ExerciseSection
              register={register}
              errors={formState.errors}
              currentLanguage={currentLanguage}
              validationRules={diabetesValidationRules}
              setFieldRef={setFieldRef}
              getFieldStyle={getFieldStyle}
            />
          </div>

          <AISettingsSection
            requestAI={requestAI}
            onToggleAI={() => setRequestAI(!requestAI)}
            currentLanguage={currentLanguage}
          />

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