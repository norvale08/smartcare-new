// apps/web/app/components/diabetesPages/DiabetesVitalsForm.tsx - COMPLETE WITH VALIDATION RULES
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input, Label, Button } from "@repo/ui";
import { useForm, useWatch } from "react-hook-form";
import { diabetesValidationRules } from "@repo/ui";
import { diabetesType } from "@/types/diabetes";
import { toast } from "react-hot-toast";
import CustomToaster from "../ui/CustomToaster";
import { Heart, Activity, Droplet, CheckCircle2, Utensils, Dumbbell, Clock, Zap, Mic, Volume2, VolumeX, Play, Pause, SkipForward } from "lucide-react";

interface Props {
  onVitalsSubmitted?: (id: string, requestAI: boolean) => void;
  initialLanguage?: "en" | "sw";
}

const languageContent = {
  en: {
    title: "Health Vitals Tracker",
    subtitle: "Monitor your glucose levels and vital signs with precision",
    successTitle: "Data Saved Successfully!",
    successMessage: "Your vitals have been securely recorded.",
    glucoseTitle: "Glucose Level",
    glucoseSubtitle: "Primary diabetes indicator",
    glucoseLabel: "Blood Glucose (mg/dL)",
    glucosePlaceholder: "e.g., 120",
    cardioTitle: "Cardiovascular Vitals",
    cardioSubtitle: "Heart and circulation metrics",
    proTip: "Pro Tip: Regular monitoring helps protect your heart and kidneys.",
    systolicLabel: "Systolic Blood Pressure",
    systolicPlaceholder: "120",
    diastolicLabel: "Diastolic Blood Pressure",
    diastolicPlaceholder: "80",
    heartRateLabel: "Heart Rate (bpm)",
    heartRatePlaceholder: "72",
    contextTitle: "Measurement Context",
    contextSubtitle: "When did you measure?",
    contextLabel: "Measurement Context",
    contextOptions: {
      empty: "Select measurement context",
      fasting: "Fasting (8+ hours without food)",
      postMeal: "Post-Meal (after eating)",
      random: "Random (any time)"
    },
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
    aiInsights: "Get AI Health Insights",
    submitting: "Submitting...",
    submit: "Submit Vitals",
    voiceMode: "Voice Assistant Mode",
    startVoice: "Start Voice Input",
    stopVoice: "Stop Voice Input",
    listening: "Listening...",
    currentlyReading: "Currently reading",
    speakNow: "Speak now",
    voiceComplete: "Voice input complete! Please continue with the form.",
    voiceCancelled: "Voice input cancelled.",
    skipField: "Skip this measurement",
    confirmQuestion: "Did you say",
    yes: "Yes",
    no: "No, try again",
    skip: "Skip this measurement",
    fieldInstructions: {
      glucose: "Please say your blood glucose level in milligrams per deciliter. For example, say 'one twenty' for 120. Say 'skip' if you don't have this measurement.",
      systolic: "Please say your systolic blood pressure. This is the top number. For example, say 'one twenty' for 120. Say 'skip' if you don't have this measurement.",
      diastolic: "Please say your diastolic blood pressure. This is the bottom number. For example, say 'eighty' for 80. Say 'skip' if you don't have this measurement.",
      heartRate: "Please say your heart rate in beats per minute. For example, say 'seventy two' for 72. Say 'skip' if you don't have this measurement.",
      context: "Please say your measurement context. Options are: 'fasting', 'post meal', or 'random'. Say 'skip' if you don't know.",
      lastMealTime: "Please say when you last ate. Options are: 'two hours', 'four hours', 'six hours', or 'more than six hours'. Say 'skip' if you don't know.",
      mealType: "Please say your meal type. Options are: 'carbohydrates', 'sugary drinks', 'proteins', 'vegetables', or 'mixed meal'. Say 'skip' if you don't know.",
      exerciseRecent: "Please say if you had recent exercise. Options are: 'none', 'within two hours', 'two to six hours', or 'six to twenty four hours'. Say 'skip' if you don't know.",
      exerciseIntensity: "Please say your exercise intensity. Options are: 'light', 'moderate', or 'vigorous'. Say 'skip' if you don't know."
    },
    optionKeywords: {
      fasting: ["fasting", "fast", "empty stomach", "morning"],
      postMeal: ["post meal", "after eating", "after food", "after meal", "postprandial"],
      random: ["random", "anytime", "any time", "whenever"],
      twoHours: ["two hours", "2 hours", "recently", "just ate"],
      fourHours: ["four hours", "4 hours", "few hours"],
      sixHours: ["six hours", "6 hours", "half day"],
      moreThanSix: ["more than six", "more than 6", "long time", "many hours"],
      carbs: ["carbohydrates", "carbs", "bread", "rice", "pasta"],
      sugaryDrinks: ["sugary drinks", "soda", "juice", "sweet drinks"],
      proteins: ["proteins", "meat", "chicken", "fish", "eggs"],
      vegetables: ["vegetables", "salad", "greens", "veggies"],
      mixed: ["mixed", "combination", "everything", "balanced"],
      none: ["none", "no", "didn't exercise", "no exercise"],
      within2Hours: ["within two hours", "within 2 hours", "recent exercise", "just exercised"],
      twoToSixHours: ["two to six hours", "2 to 6 hours", "few hours ago", "earlier today"],
      sixTo24Hours: ["six to twenty four", "6 to 24", "yesterday", "day before"],
      light: ["light", "walking", "stretching", "gentle", "easy"],
      moderate: ["moderate", "brisk", "cycling", "medium", "moderate exercise"],
      vigorous: ["vigorous", "running", "sports", "intense", "hard"]
    }
  },
  sw: {
    title: "Kifaa cha Kufuatilia Viwango vya Afya",
    subtitle: "Fuatilia viwango vya sukari damu na ishara muhimu za kiafya kwa usahihi",
    successTitle: "Data Imehifadhiwa Kikamilifu!",
    successMessage: "Viwango vyako vya kiafya vimeandikwa kwa usalama.",
    glucoseTitle: "Kiwango cha Sukari Damu",
    glucoseSubtitle: "Kionyeshi kikuu cha kisukari",
    glucoseLabel: "Sukari Damu (mg/dL)",
    glucosePlaceholder: "mfano, 120",
    cardioTitle: "Viwango vya Mfumo wa Moyo na Mishipa",
    cardioSubtitle: "Vipimo vya moyo na mzunguko wa damu",
    proTip: "Ushauri: Ufuatiliaji wa mara kwa mara husaidia kulinda moyo na figo zako.",
    systolicLabel: "Shinikizo la Damu la Sistolic",
    systolicPlaceholder: "120",
    diastolicLabel: "Shinikizo la Damu la Diastolic",
    diastolicPlaceholder: "80",
    heartRateLabel: "Kiwango cha Mapigo ya Moyo (bpm)",
    heartRatePlaceholder: "72",
    contextTitle: "Muktadha wa Kipimo",
    contextSubtitle: "Ulipima lini?",
    contextLabel: "Muktadha wa Kipimo",
    contextOptions: {
      empty: "Chagua muktadha wa kipimo",
      fasting: "Kifunga (saa 8+ bila chakula)",
      postMeal: "Baada ya chakula",
      random: "Ovyo ovyo (wakati wowote)"
    },
    mealTitle: "Maelezo ya Chakula",
    mealSubtitle: "Ulikula nini?",
    lastMealLabel: "Ulimaliza kula lini?",
    mealTypeLabel: "Aina ya Chakula",
    lastMealOptions: {
      empty: "Chagua muda",
      twoHours: "Masaa 2 zilizopita",
      fourHours: "Masaa 4 zilizopita",
      sixHours: "Masaa 6 zilizopita",
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
    exerciseTitle: "Shughuli za Mwili",
    exerciseSubtitle: "Mazoezi ya hivi karibuni yanaathiri sukari damu",
    exerciseImportant: "Muhimu: Mazoezi yanaweza kupunguza kiwango cha sukari damu.",
    exerciseRecentLabel: "Mazoezi ya Hivi Karibuni?",
    exerciseIntensityLabel: "Ukali wa Mazoezi",
    exerciseOptions: {
      empty: "Chagua chaguo",
      none: "❌ Hakuna mazoezi ya hivi karibuni",
      within2Hours: "⏱️ Ndani ya masaa 2 yaliyopita",
      twoToSixHours: "🕐 Masaa 2-6 yaliyopita",
      sixTo24Hours: "📅 Masaa 6-24 yaliyopita"
    },
    intensityOptions: {
      empty: "Chagua ukali",
      light: "🚶 Mwepesi (Kutembea, kunyoosha)",
      moderate: "🚴 Wastani (Kutembea kwa kasi, baiskeli)",
      vigorous: "🏃 Mizito (Kukimbia, michezo)"
    },
    aiInsights: "Pata Uchambuzi wa Afya kutoka kwa AI",
    submitting: "Inatumwa...",
    submit: "Wasilisha Viwango vya Kiafya",
    voiceMode: "Hali ya Msaidizi wa Sauti",
    startVoice: "Anza Kuingiza kwa Sauti",
    stopVoice: "Acha Kuingiza kwa Sauti",
    listening: "Ninasikiliza...",
    currentlyReading: "Ninasoma sasa",
    speakNow: "Zungumza sasa",
    voiceComplete: "Kuingiza kwa sauti kumekamilika! Tafadhali endelea na fomu.",
    voiceCancelled: "Kuingiza kwa sauti kumesitishwa.",
    skipField: "Ruka kipimo hiki",
    confirmQuestion: "Ulisema",
    yes: "Ndio",
    no: "Hapana, jaribu tena",
    skip: "Ruka kipimo hiki",
    fieldInstructions: {
      glucose: "Tafadhali sema kiwango chako cha sukari damu kwenye miligramu kwa desilita. Kwa mfano, sema 'mia moja ishirini' kwa 120. Sema 'ruka' kama huna kipimo hiki.",
      systolic: "Tafadhali sema shinikizo lako la damu la systolic. Hii ni nambari ya juu. Kwa mfano, sema 'mia moja ishirini' kwa 120. Sema 'ruka' kama huna kipimo hiki.",
      diastolic: "Tafadhali sema shinikizo lako la damu la diastolic. Hii ni nambari ya chini. Kwa mfano, sema 'themanini' kwa 80. Sema 'ruka' kama huna kipimo hiki.",
      heartRate: "Tafadhali sema kiwango chako cha mapigo ya moyo kwa dakika. Kwa mfano, sema 'sabini na mbili' kwa 72. Sema 'ruka' kama huna kipimo hiki.",
      context: "Tafadhali sema muktadha wa kipimo chako. Chaguo ni: 'kifunga', 'baada ya chakula', au 'ovyo ovyo'. Sema 'ruka' kama hujui.",
      lastMealTime: "Tafadhali sema ulimaliza kula lini. Chaguo ni: 'masaa mawili', 'masaa manne', 'masaa sita', au 'zaidi ya masaa sita'. Sema 'ruka' kama hujui.",
      mealType: "Tafadhali sema aina ya chakula chako. Chaguo ni: 'wanga', 'vinywaji vya sukari', 'protini', 'mboga mboga', au 'chakula mchanganyiko'. Sema 'ruka' kama hujui.",
      exerciseRecent: "Tafadhali sema kama umefanya mazoezi ya hivi karibuni. Chaguo ni: 'hakuna', 'ndani ya masaa mawili', 'masaa mawili hadi sita', au 'masaa sita hadi ishirini na nne'. Sema 'ruka' kama hujui.",
      exerciseIntensity: "Tafadhali sema ukali wa mazoezi yako. Chaguo ni: 'mwepesi', 'wastani', au 'mizito'. Sema 'ruka' kama hujui."
    },
    optionKeywords: {
      fasting: ["kifunga", "tumbo tupu", "asubuhi", "bila chakula"],
      postMeal: ["baada ya chakula", "baada ya kula", "chakula", "kisha chakula"],
      random: ["ovyo ovyo", "wakati wowote", "muda wowote"],
      twoHours: ["masaa mawili", "masaa 2", "hivi karibuni", "karibu"],
      fourHours: ["masaa manne", "masaa 4", "muda mfupi"],
      sixHours: ["masaa sita", "masaa 6", "nusu siku"],
      moreThanSix: ["zaidi ya masaa sita", "zaidi ya 6", "muda mrefu", "masaa mengi"],
      carbs: ["wanga", "carbohydrates", "mkate", "wali", "ugali"],
      sugaryDrinks: ["vinywaji vya sukari", "soda", "juisi", "vinywaji tamu"],
      proteins: ["protini", "nyama", "kuku", "samaki", "mayai"],
      vegetables: ["mboga mboga", "saladi", "majani", "mboga"],
      mixed: ["mchanganyiko", "changanya", "kila kitu", "usawa"],
      none: ["hakuna", "hapana", "sikufanya mazoezi", "hakuna mazoezi"],
      within2Hours: ["ndani ya masaa mawili", "ndani ya masaa 2", "mazoezi ya hivi karibuni", "hivi karibuni"],
      twoToSixHours: ["masaa mawili hadi sita", "masaa 2 hadi 6", "muda mfupi uliopita", "mapema leo"],
      sixTo24Hours: ["masaa sita hadi ishirini na nne", "masaa 6 hadi 24", "jana", "siku mbili zilizopita"],
      light: ["mwepesi", "kutembea", "kunyoosha", "taratibu", "rahisi"],
      moderate: ["wastani", "kasi", "baiskeli", "wastani", "mazoezi wastani"],
      vigorous: ["mizito", "kukimbia", "michezo", "ngumu", "kali"]
    }
  }
};

// Define field sequence with proper types
interface FieldConfig {
  name: keyof diabetesType;
  label: string;
  type: 'number' | 'select';
  min?: number;
  max?: number;
  options?: { [key: string]: string };
  dependsOn?: string;
  dependsValue?: string;
  optional?: boolean;
}

const DiabetesVitalsForm: React.FC<Props> = ({ onVitalsSubmitted, initialLanguage = "en" }) => {
  const { register, handleSubmit, formState, reset, setValue, control, getValues, watch } = useForm<diabetesType>({
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
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>("");

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

  // Sync ref with state
  useEffect(() => {
    voiceModeActiveRef.current = voiceMode;
  }, [voiceMode]);

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

  // Text-to-Speech
  const speak = useCallback(async (text: string): Promise<void> => {
    if (isMuted || !voiceModeActiveRef.current) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        setIsSpeaking(true);
        setVoiceStatus(languageValue === "sw" ? "Ninazungumza..." : "Speaking...");
        window.speechSynthesis?.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageValue === "sw" ? "sw-KE" : "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          setIsSpeaking(false);
          setVoiceStatus("");
          resolve();
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setVoiceStatus("");
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        setIsSpeaking(false);
        setVoiceStatus("");
        resolve();
      }
    });
  }, [languageValue, isMuted]);

  // Convert WebM to WAV
  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const numberOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const length = audioBuffer.length * numberOfChannels * 2;
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);
      
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numberOfChannels * 2, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length, true);
      
      let offset = 44;
      for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          const rawSample = channelData?.[i] ?? 0;
          const sample = Math.max(-1, Math.min(1, rawSample));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      return new Blob([buffer], { type: 'audio/wav' });
    } catch (error) {
      console.error("Error converting to WAV:", error);
      return webmBlob;
    }
  };

  // Parse spoken numbers and commands
  const parseSpokenInput = (text: string): { type: 'number' | 'text' | 'skip' | 'unknown'; value?: number; textValue?: string } => {
    const lowerText = text.toLowerCase().trim();
    
    // Check for skip commands
    const skipWords = languageValue === "sw" 
      ? ['ruka', 'pass', 'next', 'none', 'sina', 'hapana']
      : ['skip', 'pass', 'next', 'none', "don't know", 'not sure'];
    
    if (skipWords.some(word => lowerText.includes(word))) {
      return { type: 'skip' };
    }
    
    // Check for yes/no confirmation
    const yesWords = languageValue === "sw" 
      ? ['ndio', 'yes', 'correct', 'right', 'true', 'sawa']
      : ['yes', 'correct', 'right', 'true', 'yeah', 'yep'];
    
    const noWords = languageValue === "sw"
      ? ['hapana', 'no', 'wrong', 'incorrect', 'false', 'jaribu tena']
      : ['no', 'wrong', 'incorrect', 'false', 'nope', 'try again'];
    
    if (yesWords.some(word => lowerText.includes(word))) {
      return { type: 'number', value: 1 }; // Use 1 for yes confirmation
    }
    if (noWords.some(word => lowerText.includes(word))) {
      return { type: 'number', value: 0 }; // Use 0 for no confirmation
    }

    // Parse numbers first
    const numbers = lowerText.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const number = parseInt(numbers[0], 10);
      if (!isNaN(number) && number > 0) {
        return { type: 'number', value: number };
      }
    }

    // For text inputs (select fields), return the text
    if (lowerText.length > 0) {
      return { type: 'text', textValue: lowerText };
    }

    return { type: 'unknown' };
  };

  // Map spoken text to form values
  const mapSpokenToOption = (spokenText: string, fieldName: string): string | null => {
    const keywords = currentLanguage.optionKeywords as any;
    
    // Get all possible options for this field
    let options: string[] = [];
    let valueMapping: { [key: string]: string } = {};
    
    switch (fieldName) {
      case 'context':
        options = ['fasting', 'postMeal', 'random'];
        valueMapping = {
          fasting: 'Fasting',
          postMeal: 'Post-meal',
          random: 'Random'
        };
        break;
      case 'lastMealTime':
        options = ['twoHours', 'fourHours', 'sixHours', 'moreThanSix'];
        valueMapping = {
          twoHours: '2_hours',
          fourHours: '4_hours',
          sixHours: '6_hours',
          moreThanSix: 'more_than_6_hours'
        };
        break;
      case 'mealType':
        options = ['carbs', 'sugaryDrinks', 'proteins', 'vegetables', 'mixed'];
        valueMapping = {
          carbs: 'carbohydrates',
          sugaryDrinks: 'sugary_drinks',
          proteins: 'proteins',
          vegetables: 'vegetables',
          mixed: 'mixed_meal'
        };
        break;
      case 'exerciseRecent':
        options = ['none', 'within2Hours', 'twoToSixHours', 'sixTo24Hours'];
        valueMapping = {
          none: 'none',
          within2Hours: 'within_2_hours',
          twoToSixHours: '2_to_6_hours',
          sixTo24Hours: '6_to_24_hours'
        };
        break;
      case 'exerciseIntensity':
        options = ['light', 'moderate', 'vigorous'];
        valueMapping = {
          light: 'light',
          moderate: 'moderate',
          vigorous: 'vigorous'
        };
        break;
      default:
        return null;
    }
    
    // Check each option's keywords
    for (const option of options) {
      if (keywords[option]) {
        for (const keyword of keywords[option]) {
          if (spokenText.includes(keyword)) {
            return valueMapping[option] || null;
          }
        }
      }
    }
    
    return null;
  };

  // Ask for confirmation
  const askConfirmation = async (value: string | number, fieldName: string, fieldLabel: string): Promise<boolean> => {
    const question = languageValue === "sw" 
      ? `${currentLanguage.confirmQuestion} ${value}? Sema 'ndio' au 'hapana'`
      : `${currentLanguage.confirmQuestion} ${value}? Say 'yes' or 'no'`;
    
    await speak(question);
    
    return new Promise(async (resolve) => {
      try {
        setIsListening(true);
        setVoiceStatus(languageValue === "sw" ? "Ninasikiliza uthibitisho..." : "Listening for confirmation...");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            sampleRate: 16000, 
            channelCount: 1 
          }
        });

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          
          if (audioChunks.length === 0 || !voiceModeActiveRef.current) {
            setIsListening(false);
            setVoiceStatus("");
            resolve(false);
            return;
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

          try {
            const wavBlob = await convertWebmToWav(audioBlob);
            
            const formData = new FormData();
            formData.append("audio", wavBlob, "recording.wav");
            formData.append("language", languageValue);

            const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
              method: "POST",
              body: formData
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            
            setIsListening(false);
            setVoiceStatus("");

            if (data.success && data.text) {
              const parsed = parseSpokenInput(data.text);
              if (parsed.type === 'number') {
                resolve(parsed.value === 1); // 1 means yes, 0 means no
              } else {
                // Default to no if unclear
                resolve(false);
              }
            } else {
              resolve(false);
            }
          } catch (error) {
            console.error("Confirmation error:", error);
            setIsListening(false);
            setVoiceStatus("");
            resolve(false);
          }
        };

        mediaRecorder.start();
        
        setTimeout(() => {
          if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
            mediaRecorder.stop();
          }
        }, 5000);

      } catch (error) {
        console.error("Confirmation setup error:", error);
        setIsListening(false);
        setVoiceStatus("");
        resolve(false);
      }
    });
  };

  // Speech-to-Text with improved error handling
  const listenForField = async (fieldName: keyof diabetesType, fieldLabel: string, fieldType: 'number' | 'select' = 'number', min?: number, max?: number): Promise<string | number | 'skip' | null> => {
    if (isProcessingRef.current || !voiceModeActiveRef.current) return null;

    // Scroll to field and highlight
    if (fieldRefs.current[fieldName]) {
      fieldRefs.current[fieldName]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setCurrentField(fieldName);

    // Announce field with instructions
    const fieldInstructionKey = fieldName as keyof typeof currentLanguage.fieldInstructions;
    const instruction = currentLanguage.fieldInstructions[fieldInstructionKey];
    const announcement = `${fieldLabel}. ${instruction}`;
    await speak(announcement);

    // Check if voice mode is still active after speaking
    if (!voiceModeActiveRef.current) return null;

    return new Promise(async (resolve) => {
      try {
        isProcessingRef.current = true;
        setIsListening(true);
        setVoiceStatus(languageValue === "sw" ? "Ninasikiliza sasa... Tafadhali zungumza." : "Listening now... Please speak.");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            sampleRate: 16000, 
            channelCount: 1 
          }
        });

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          
          if (audioChunks.length === 0 || !voiceModeActiveRef.current) {
            setIsListening(false);
            setCurrentField(null);
            setVoiceStatus("");
            isProcessingRef.current = false;
            resolve(null);
            return;
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

          try {
            const wavBlob = await convertWebmToWav(audioBlob);
            
            const formData = new FormData();
            formData.append("audio", wavBlob, "recording.wav");
            formData.append("language", languageValue);

            console.log("Sending audio to server for transcription...");
            const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
              method: "POST",
              body: formData
            });

            if (!response.ok) {
              console.error("Server response not OK:", response.status);
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log("Transcription response:", data);
            
            setIsListening(false);
            setCurrentField(null);
            setVoiceStatus("");
            isProcessingRef.current = false;

            if (data.success && data.text) {
              const parsed = parseSpokenInput(data.text);
              
              if (parsed.type === 'skip') {
                console.log("User chose to skip field:", fieldName);
                resolve('skip');
              } else if (parsed.type === 'number' && parsed.value !== undefined) {
                console.log("Parsed number:", parsed.value);
                
                if (fieldType === 'number' && min !== undefined && max !== undefined) {
                  if (parsed.value >= min && parsed.value <= max) {
                    // Ask for confirmation for numbers
                    const confirmed = await askConfirmation(parsed.value, fieldName, fieldLabel);
                    if (confirmed) {
                      resolve(parsed.value);
                    } else {
                      resolve(null); // User said no, try again
                    }
                  } else {
                    console.log("Number out of range:", parsed.value);
                    const rangeMsg = languageValue === "sw"
                      ? `Thamani ${parsed.value} iko nje ya anuwai. Inapaswa kuwa kati ya ${min} na ${max}. Jaribu tena.`
                      : `Value ${parsed.value} is out of range. Should be between ${min} and ${max}. Please try again.`;
                    await speak(rangeMsg);
                    resolve(null);
                  }
                } else {
                  // For non-number fields that got a number (unlikely but handle it)
                  resolve(null);
                }
              } else if (parsed.type === 'text' && parsed.textValue && fieldType === 'select') {
                console.log("Parsed text for select field:", parsed.textValue);
                const mappedValue = mapSpokenToOption(parsed.textValue, fieldName);
                
                if (mappedValue) {
                  // Ask for confirmation for select values
                  const displayValue = getDisplayValue(fieldName, mappedValue);
                  const confirmed = await askConfirmation(displayValue, fieldName, fieldLabel);
                  if (confirmed) {
                    resolve(mappedValue);
                  } else {
                    resolve(null); // User said no, try again
                  }
                } else {
                  console.log("Could not map spoken text to option:", parsed.textValue);
                  const optionsMsg = languageValue === "sw"
                    ? "Sikuelewa. Tafadhali jaribu tena au sema 'ruka'."
                    : "I didn't understand. Please try again or say 'skip'.";
                  await speak(optionsMsg);
                  resolve(null);
                }
              } else {
                console.log("No valid input found");
                const retryMsg = languageValue === "sw"
                  ? "Sikukusikia vizuri. Tafadhali jaribu tena au sema 'ruka'."
                  : "I didn't hear you clearly. Please try again or say 'skip'.";
                await speak(retryMsg);
                resolve(null);
              }
            } else {
              console.log("Transcription failed or no text returned");
              const errorMsg = languageValue === "sw"
                ? "Kumetokea hitilafu. Tafadhali jaribu tena."
                : "An error occurred. Please try again.";
              await speak(errorMsg);
              resolve(null);
            }
          } catch (error) {
            console.error("STT Error:", error);
            setIsListening(false);
            setCurrentField(null);
            setVoiceStatus("");
            isProcessingRef.current = false;
            const errorMsg = languageValue === "sw"
              ? "Hitilafu ya kiufundi. Tafadhali jaribu tena."
              : "Technical error. Please try again.";
            await speak(errorMsg);
            resolve(null);
          }
        };

        mediaRecorder.start();
        console.log("Recording started for field:", fieldName);
        
        // Auto-stop after 7 seconds
        setTimeout(() => {
          if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
            console.log("Auto-stopping recording after 7 seconds");
            mediaRecorder.stop();
          }
        }, 7000);

      } catch (error) {
        console.error("Listen Error:", error);
        setIsListening(false);
        setCurrentField(null);
        setVoiceStatus("");
        isProcessingRef.current = false;
        resolve(null);
      }
    });
  };

  // Helper to get display value for confirmation
  const getDisplayValue = (fieldName: string, value: string): string => {
    const lang = currentLanguage;
    
    switch (fieldName) {
      case 'context':
        if (value === 'Fasting') return lang.contextOptions.fasting;
        if (value === 'Post-meal') return lang.contextOptions.postMeal;
        if (value === 'Random') return lang.contextOptions.random;
        break;
      case 'lastMealTime':
        if (value === '2_hours') return lang.lastMealOptions.twoHours;
        if (value === '4_hours') return lang.lastMealOptions.fourHours;
        if (value === '6_hours') return lang.lastMealOptions.sixHours;
        if (value === 'more_than_6_hours') return lang.lastMealOptions.moreThanSix;
        break;
      case 'mealType':
        if (value === 'carbohydrates') return lang.mealTypeOptions.carbs;
        if (value === 'sugary_drinks') return lang.mealTypeOptions.sugaryDrinks;
        if (value === 'proteins') return lang.mealTypeOptions.proteins;
        if (value === 'vegetables') return lang.mealTypeOptions.vegetables;
        if (value === 'mixed_meal') return lang.mealTypeOptions.mixed;
        break;
      case 'exerciseRecent':
        if (value === 'none') return lang.exerciseOptions.none;
        if (value === 'within_2_hours') return lang.exerciseOptions.within2Hours;
        if (value === '2_to_6_hours') return lang.exerciseOptions.twoToSixHours;
        if (value === '6_to_24_hours') return lang.exerciseOptions.sixTo24Hours;
        break;
      case 'exerciseIntensity':
        if (value === 'light') return lang.intensityOptions.light;
        if (value === 'moderate') return lang.intensityOptions.moderate;
        if (value === 'vigorous') return lang.intensityOptions.vigorous;
        break;
    }
    
    return value;
  };

  // Stop voice mode
  const stopVoiceMode = () => {
    console.log("Stopping voice mode");
    setVoiceMode(false);
    voiceModeActiveRef.current = false;
    setIsListening(false);
    setCurrentField(null);
    setVoiceStatus("");
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    if (!isMuted) {
      speak(currentLanguage.voiceCancelled);
    }
  };

  // Start voice mode with complete form flow
  const startVoiceMode = async () => {
    console.log("Starting voice mode");
    setVoiceMode(true);
    voiceModeActiveRef.current = true;
    
    const welcome = languageValue === "sw"
      ? "Karibu. Nitakusaidia kuweka vipimo vyako vya kiafya. Kila kipimo unaweza kuruka kwa kusema 'ruka'. Tutaanza na sukari ya damu."
      : "Welcome. I will help you enter your health measurements. You can skip any measurement by saying 'skip'. Let's start with blood glucose.";
    
    await speak(welcome);
    
    // Define complete field sequence
    const fieldSequence: FieldConfig[] = [
      { 
        name: "glucose", 
        label: currentLanguage.glucoseLabel,
        type: "number",
        min: 20, 
        max: 600,
        optional: true
      },
      { 
        name: "systolic", 
        label: currentLanguage.systolicLabel,
        type: "number",
        min: 70, 
        max: 250,
        optional: true
      },
      { 
        name: "diastolic", 
        label: currentLanguage.diastolicLabel,
        type: "number",
        min: 40, 
        max: 150,
        optional: true
      },
      { 
        name: "heartRate", 
        label: currentLanguage.heartRateLabel,
        type: "number",
        min: 40, 
        max: 200,
        optional: true
      },
      { 
        name: "context", 
        label: currentLanguage.contextLabel,
        type: "select",
        optional: false
      },
    ];

    // Conditional fields based on context
    const conditionalFields: FieldConfig[] = [
      { 
        name: "lastMealTime", 
        label: currentLanguage.lastMealLabel,
        type: "select",
        dependsOn: "context",
        dependsValue: "Post-meal",
        optional: false
      },
      { 
        name: "mealType", 
        label: currentLanguage.mealTypeLabel,
        type: "select",
        dependsOn: "context",
        dependsValue: "Post-meal",
        optional: false
      },
      { 
        name: "exerciseRecent", 
        label: currentLanguage.exerciseRecentLabel,
        type: "select",
        optional: false
      },
      { 
        name: "exerciseIntensity", 
        label: currentLanguage.exerciseIntensityLabel,
        type: "select",
        optional: false
      }
    ];

    // Process mandatory fields first
    for (const field of fieldSequence) {
      // Check if voice mode is still active
      if (!voiceModeActiveRef.current) {
        console.log("Voice mode cancelled, breaking loop");
        break;
      }

      let validInput = false;
      let attempts = 0;
      
      while (!validInput && attempts < 2 && voiceModeActiveRef.current) {
        console.log(`Listening for ${field.name}, attempt ${attempts + 1}`);
        const result = await listenForField(
          field.name, 
          field.label, 
          field.type,
          field.min,
          field.max
        );
        
        // Check if voice mode was cancelled during listening
        if (!voiceModeActiveRef.current) {
          console.log("Voice mode cancelled during listening");
          break;
        }
        
        if (result === null) {
          // No input received
          console.log("No input received");
          if (!isMuted && voiceModeActiveRef.current) {
            await speak(languageValue === "sw" 
              ? "Sikukusikia. Tafadhali jaribu tena au sema 'ruka'." 
              : "I didn't hear you. Please try again or say 'skip'."
            );
          }
          attempts++;
          continue;
        }

        if (result === 'skip') {
          // User chose to skip this field (only allowed for optional fields)
          if (field.optional) {
            console.log(`User skipped optional field: ${field.name}`);
            const skipMsg = languageValue === "sw"
              ? "Umekwisha ruka kipimo hiki."
              : "You have skipped this measurement.";
            
            toast.success(`⏭️ ${field.label}: ${currentLanguage.skip}`, { duration: 3000 });
            
            if (!isMuted && voiceModeActiveRef.current) {
              await speak(skipMsg);
            }
            
            validInput = true; // Mark as valid to move to next field
            break;
          } else {
            // Required field, can't skip
            console.log(`Required field can't be skipped: ${field.name}`);
            const requiredMsg = languageValue === "sw"
              ? "Sehemu hii ni muhimu. Haiwezi kurukwa. Tafadhali jaribu tena."
              : "This field is required and cannot be skipped. Please try again.";
            
            toast.error(`❌ ${requiredMsg}`, { duration: 4000 });
            
            if (!isMuted && voiceModeActiveRef.current) {
              await speak(requiredMsg);
            }
            attempts++;
            continue;
          }
        }

        // Handle valid input
        console.log(`Valid input for ${field.name}: ${result}`);
        setValue(field.name, result as any);
        
        const successMsg = languageValue === "sw"
          ? `Imewekwa ${typeof result === 'string' ? getDisplayValue(field.name, result) : result}`
          : `Set to ${typeof result === 'string' ? getDisplayValue(field.name, result) : result}`;
        
        toast.success(`✅ ${field.label}: ${typeof result === 'string' ? getDisplayValue(field.name, result) : result}`, { duration: 3000 });
        
        if (!isMuted && voiceModeActiveRef.current) {
          await speak(successMsg);
        }
        
        validInput = true;
      }
      
      if (!validInput && voiceModeActiveRef.current) {
        console.log(`Failed to get input for ${field.name} after attempts`);
        if (field.optional) {
          const moveOnMsg = languageValue === "sw"
            ? "Tutaenda kwenye kipimo kifuatacho."
            : "Let's move to the next measurement.";
          
          if (!isMuted) {
            await speak(moveOnMsg);
          }
        } else {
          // For required fields, use default value
          const defaultValue = field.name === "context" ? "Random" : "";
          setValue(field.name, defaultValue as any);
          const defaultMsg = languageValue === "sw"
            ? `Nitaweka thamani ya chaguomsingi: ${getDisplayValue(field.name, defaultValue)}`
            : `I will set default value: ${getDisplayValue(field.name, defaultValue)}`;
          
          toast(`ℹ️ ${field.label}: ${getDisplayValue(field.name, defaultValue)}`, { duration: 3000 });
          
          if (!isMuted) {
            await speak(defaultMsg);
          }
        }
      }

      // Small delay between fields if voice mode is still active
      if (voiceModeActiveRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Now process conditional fields based on context
    const currentContext = getValues("context");
    console.log("Current context:", currentContext);
    
    for (const field of conditionalFields) {
      // Check if field should be shown based on dependencies
      if (field.dependsOn && field.dependsValue) {
        if (currentContext !== field.dependsValue) {
          console.log(`Skipping ${field.name} because context is ${currentContext}`);
          continue;
        }
      }

      // Check if voice mode is still active
      if (!voiceModeActiveRef.current) {
        console.log("Voice mode cancelled, breaking loop");
        break;
      }

      let validInput = false;
      let attempts = 0;
      
      while (!validInput && attempts < 2 && voiceModeActiveRef.current) {
        console.log(`Listening for ${field.name}, attempt ${attempts + 1}`);
        const result = await listenForField(
          field.name, 
          field.label, 
          field.type
        );
        
        // Check if voice mode was cancelled during listening
        if (!voiceModeActiveRef.current) {
          console.log("Voice mode cancelled during listening");
          break;
        }
        
        if (result === null) {
          // No input received
          console.log("No input received");
          if (!isMuted && voiceModeActiveRef.current) {
            await speak(languageValue === "sw" 
              ? "Sikukusikia. Tafadhali jaribu tena au sema 'ruka'." 
              : "I didn't hear you. Please try again or say 'skip'."
            );
          }
          attempts++;
          continue;
        }

        if (result === 'skip') {
          // User chose to skip this field
          console.log(`User skipped field: ${field.name}`);
          const skipMsg = languageValue === "sw"
            ? "Umekwisha ruka kipimo hiki."
            : "You have skipped this measurement.";
          
          toast.success(`⏭️ ${field.label}: ${currentLanguage.skip}`, { duration: 3000 });
          
          if (!isMuted && voiceModeActiveRef.current) {
            await speak(skipMsg);
          }
          
          // Set default value for skipped required fields
          if (!field.optional) {
            let defaultValue = "";
            if (field.name === "exerciseRecent") defaultValue = "none";
            if (field.name === "exerciseIntensity") defaultValue = "light";
            setValue(field.name, defaultValue as any);
          }
          
          validInput = true;
          break;
        }

        // Handle valid input
        console.log(`Valid input for ${field.name}: ${result}`);
        setValue(field.name, result as any);
        
        const successMsg = languageValue === "sw"
          ? `Imewekwa ${getDisplayValue(field.name, result as string)}`
          : `Set to ${getDisplayValue(field.name, result as string)}`;
        
        toast.success(`✅ ${field.label}: ${getDisplayValue(field.name, result as string)}`, { duration: 3000 });
        
        if (!isMuted && voiceModeActiveRef.current) {
          await speak(successMsg);
        }
        
        validInput = true;
      }
      
      if (!validInput && voiceModeActiveRef.current) {
        console.log(`Failed to get input for ${field.name} after attempts`);
        if (!field.optional) {
          // Set default value for required fields
          let defaultValue = "";
          if (field.name === "exerciseRecent") defaultValue = "none";
          if (field.name === "exerciseIntensity") defaultValue = "light";
          setValue(field.name, defaultValue as any);
          
          const defaultMsg = languageValue === "sw"
            ? `Nitaweka thamani ya chaguomsingi: ${getDisplayValue(field.name, defaultValue)}`
            : `I will set default value: ${getDisplayValue(field.name, defaultValue)}`;
          
          toast(`ℹ️ ${field.label}: ${getDisplayValue(field.name, defaultValue)}`, { duration: 3000 });
          
          if (!isMuted) {
            await speak(defaultMsg);
          }
        }
      }

      // Small delay between fields if voice mode is still active
      if (voiceModeActiveRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (voiceModeActiveRef.current) {
      console.log("Voice mode completed successfully");
      const complete = languageValue === "sw"
        ? "Asante! Vipimo vyote vimekamilika. Tafadhali endelea na fomu."
        : "Thank you! All measurements complete. Please continue with the form.";
      
      await speak(complete);
      toast.success(currentLanguage.voiceComplete, { duration: 5000 });
    }
    
    // Reset voice mode state
    setVoiceMode(false);
    voiceModeActiveRef.current = false;
    setCurrentField(null);
    setVoiceStatus("");
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

  // Field highlighting style
  const getFieldStyle = (fieldName: string) => {
    const isActive = currentField === fieldName;
    return {
      border: isActive ? '2px solid #3b82f6' : '2px solid #e5e7eb',
      boxShadow: isActive ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      transition: 'all 0.3s ease-in-out'
    };
  };

  // Fixed ref callback - returns void instead of element
  const setFieldRef = useCallback((fieldName: string) => (el: HTMLDivElement | null) => {
    fieldRefs.current[fieldName] = el;
  }, []);

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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2">{currentLanguage.title}</h1>
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

        {/* Voice Control Panel */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0 relative">
                {(isListening || voiceMode) && (
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                )}
                <Mic className="text-white relative z-10" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base sm:text-lg">{currentLanguage.voiceMode}</h3>
                {currentField && (
                  <p className="text-white/90 text-xs sm:text-sm">
                    {currentLanguage.currentlyReading}: <span className="font-bold">{currentField}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="text-white" size={20} /> : <Volume2 className="text-white" size={20} />}
            </button>
          </div>
          
          {/* Enhanced Voice Status Display */}
          {(isListening || isSpeaking || voiceStatus) && (
            <div className="bg-white/20 backdrop-blur rounded-lg p-4 mb-3">
              <div className="flex items-center justify-center gap-3">
                {isSpeaking ? (
                  <>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-white rounded-full animate-bounce" />
                      <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <div className="text-center">
                      <span className="text-white font-bold text-sm block">
                        {languageValue === "sw" ? "NASEMA SASA" : "SPEAKING NOW"}
                      </span>
                      <span className="text-white/80 text-xs">
                        {voiceStatus || (languageValue === "sw" ? "Ninazungumza..." : "Speaking...")}
                      </span>
                    </div>
                  </>
                ) : isListening ? (
                  <>
                    <div className="relative">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping" />
                    </div>
                    <div className="text-center">
                      <span className="text-white font-bold text-sm block">
                        {languageValue === "sw" ? "ZUNGUMZA SASA" : "SPEAK NOW"}
                      </span>
                      <span className="text-white/80 text-xs">
                        {voiceStatus || (languageValue === "sw" ? "Ninasikiliza..." : "Listening...")}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                      <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                      <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-white font-semibold text-sm">{voiceStatus}</span>
                  </>
                )}
              </div>
              
              {/* Progress indicator for current field */}
              {currentField && (
                <div className="mt-3">
                  <div className="flex justify-between text-white/80 text-xs mb-1">
                    <span>{languageValue === "sw" ? "Sehemu ya sasa" : "Current Field"}</span>
                    <span className="font-bold">{currentField}</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: isListening ? '100%' : '0%',
                        animation: isListening ? 'pulse 2s infinite' : 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            type="button"
            onClick={voiceMode ? stopVoiceMode : startVoiceMode}
            disabled={isListening || isSpeaking}
            className="w-full bg-white text-purple-600 font-bold py-3 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {voiceMode ? (
              <>
                <Pause size={20} />
                {currentLanguage.stopVoice}
              </>
            ) : (
              <>
                <Play size={20} />
                {currentLanguage.startVoice}
              </>
            )}
          </button>

          {/* Skip Instructions */}
          <div className="mt-3 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <SkipForward size={14} />
              <span>
                {languageValue === "sw" 
                  ? "Sema 'ruka' kwa Kiswahili au 'skip' kwa Kiingereza kuruka kipimo" 
                  : "Say 'skip' in English or 'ruka' in Swahili to skip a measurement"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
          
          {/* Glucose Level */}
          <div 
            ref={setFieldRef('glucose')}
            style={getFieldStyle('glucose')}
            className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-all"
          >
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
                {currentLanguage.glucoseLabel} <span className="text-gray-400 text-xs">(Optional)</span>
              </Label>
              <Input 
                type="number" 
                id="glucose" 
                placeholder={currentLanguage.glucosePlaceholder} 
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 md:p-3.5 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                {...register("glucose", diabetesValidationRules.glucose)} 
              />
              {formState.errors.glucose && <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{formState.errors.glucose.message}</p>}
            </div>
          </div>

          {/* Cardiovascular Vitals */}
          <div 
            ref={setFieldRef('systolic')}
            style={getFieldStyle('systolic')}
            className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-all"
          >
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
                <p className="text-xs sm:text-sm text-gray-700 flex-1">{currentLanguage.proTip}</p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {/* Systolic */}
                <div>
                  <Label htmlFor="systolic" className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    {currentLanguage.systolicLabel} <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Input 
                    type="number" 
                    id="systolic"
                    placeholder={currentLanguage.systolicPlaceholder}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                    {...register("systolic", diabetesValidationRules.systolic)} 
                  />
                  {formState.errors.systolic && <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.systolic.message}</p>}
                </div>
                {/* Diastolic */}
                <div>
                  <Label htmlFor="diastolic" className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    {currentLanguage.diastolicLabel} <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Input 
                    type="number" 
                    id="diastolic"
                    placeholder={currentLanguage.diastolicPlaceholder}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                    {...register("diastolic", diabetesValidationRules.diastolic)} 
                  />
                  {formState.errors.diastolic && <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.diastolic.message}</p>}
                </div>
                {/* Heart Rate */}
                <div>
                  <Label htmlFor="heartRate" className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2">
                    {currentLanguage.heartRateLabel} <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Input 
                    type="number" 
                    id="heartRate"
                    placeholder={currentLanguage.heartRatePlaceholder}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                    {...register("heartRate", diabetesValidationRules.heartRate)} 
                  />
                  {formState.errors.heartRate && <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.heartRate.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Context Section */}
          <div 
            ref={setFieldRef('context')}
            style={getFieldStyle('context')}
            className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow"
          >
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
            {formState.errors.context && <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{formState.errors.context.message}</p>}
          </div>

          {/* Meal Details - Conditional */}
          {contextValue === "Post-meal" && (
            <>
              <div 
                ref={setFieldRef('lastMealTime')}
                style={getFieldStyle('lastMealTime')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-top-2 duration-300"
              >
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
                  <div>
                    <Label htmlFor="lastMealTime" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                      {currentLanguage.lastMealLabel} <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      id="lastMealTime"
                      {...register("lastMealTime", diabetesValidationRules.lastMealTime)} 
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                    >
                      <option value="">{currentLanguage.lastMealOptions.empty}</option>
                      <option value="2_hours">{currentLanguage.lastMealOptions.twoHours}</option>
                      <option value="4_hours">{currentLanguage.lastMealOptions.fourHours}</option>
                      <option value="6_hours">{currentLanguage.lastMealOptions.sixHours}</option>
                      <option value="more_than_6_hours">{currentLanguage.lastMealOptions.moreThanSix}</option>
                    </select>
                    {formState.errors.lastMealTime && <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.lastMealTime.message}</p>}
                  </div>
                </div>
              </div>
              
              <div 
                ref={setFieldRef('mealType')}
                style={getFieldStyle('mealType')}
                className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-orange-100">
                  <div>
                    <Label htmlFor="mealType" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                      {currentLanguage.mealTypeLabel} <span className="text-red-500">*</span>
                    </Label>
                    <select 
                      id="mealType"
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
                    {formState.errors.mealType && <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.mealType.message}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Exercise Section */}
          <>
            <div 
              ref={setFieldRef('exerciseRecent')}
              style={getFieldStyle('exerciseRecent')}
              className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow"
            >
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
                  <p className="text-xs sm:text-sm text-gray-700 flex-1">{currentLanguage.exerciseImportant}</p>
                </div>
                <div>
                  <Label htmlFor="exerciseRecent" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                    {currentLanguage.exerciseRecentLabel} <span className="text-red-500">*</span>
                  </Label>
                  <select 
                    id="exerciseRecent"
                    {...register("exerciseRecent", diabetesValidationRules.exerciseRecent)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  >
                    <option value="">{currentLanguage.exerciseOptions.empty}</option>
                    <option value="none">{currentLanguage.exerciseOptions.none}</option>
                    <option value="within_2_hours">{currentLanguage.exerciseOptions.within2Hours}</option>
                    <option value="2_to_6_hours">{currentLanguage.exerciseOptions.twoToSixHours}</option>
                    <option value="6_to_24_hours">{currentLanguage.exerciseOptions.sixTo24Hours}</option>
                  </select>
                  {formState.errors.exerciseRecent && <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.exerciseRecent.message}</p>}
                </div>
              </div>
            </div>

            <div 
              ref={setFieldRef('exerciseIntensity')}
              style={getFieldStyle('exerciseIntensity')}
              className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 md:p-5 border-2 border-green-100">
                <div>
                  <Label htmlFor="exerciseIntensity" className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                    {currentLanguage.exerciseIntensityLabel} <span className="text-red-500">*</span>
                  </Label>
                  <select 
                    id="exerciseIntensity"
                    {...register("exerciseIntensity", diabetesValidationRules.exerciseIntensity)}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  >
                    <option value="">{currentLanguage.intensityOptions.empty}</option>
                    <option value="light">{currentLanguage.intensityOptions.light}</option>
                    <option value="moderate">{currentLanguage.intensityOptions.moderate}</option>
                    <option value="vigorous">{currentLanguage.intensityOptions.vigorous}</option>
                  </select>
                  {formState.errors.exerciseIntensity && <p className="text-red-600 text-xs mt-1 font-medium">{formState.errors.exerciseIntensity.message}</p>}
                </div>
              </div>
            </div>
          </>

          {/* AI Settings */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-xl transition-shadow">
            <div className="space-y-3 sm:space-y-4">
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-lg border-2 border-purple-100 hover:border-purple-300 transition-all">
                <input 
                  type="checkbox" 
                  checked={requestAI} 
                  onChange={(e) => setRequestAI(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500" 
                />
                <span className="text-xs sm:text-sm font-semibold text-gray-700">{currentLanguage.aiInsights}</span>
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