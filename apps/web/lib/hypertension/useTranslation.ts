"use client"

import { useState, useEffect, useCallback } from "react";

export interface Translations {
  language: string;
  // Common
  common: {
    dashboard: string;
    vitals: string;
    doctor: string;
    medicine: string;
    lifestyleAndDiet: string;
    maps: string;
  };
  
  // Vitals
  vitals: {
    title: string;
    systolic: string;
    diastolic: string;
    heartRate: string;
    saveButton: string;
    allFieldsRequired: string;
    savedSuccessfully: string;
    failedToSave: string;
  };
  
  // Doctor
  doctor: {
    title: string;
    searchDoctor: string;
    assignedDoctors: string;
    noDoctorsAssigned: string;
  };
  
  // Medicine
  medicine: {
    medicationAnalysis: string;
    medicationReminders: string;
    addReminder: string;
    noReminders: string;
  };
  
  // Lifestyle & Diet
  lifestyle: {
    title: string;
    smoking: string;
    alcohol: string;
    caffeine: string;
    exercise: string;
    hoursOfSleep: string;
    submitButton: string;
    regenerateButton: string;
    lowExercise: string;
    moderateExercise: string;
    highExercise: string;
    noneExercise: string;
    neverExercise: string;
    rarelyExercise: string;
    fewTimesWeek: string;
    dailyExercise: string;
    dietRecommendations: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
    generalAdvice: string;
    calorieTarget: string;
  };
  
  // Alert messages
  alerts: {
    lowBloodPressure: string;
    normalBloodPressure: string;
    elevatedBloodPressure: string;
    stage1Hypertension: string;
    stage2Hypertension: string;
    hypertensiveCrisis: string;
    stable: string;
    alert: string;
  };
}

type LangKey = "en-US" | "sw-TZ";

const translations: Record<LangKey, Translations> = {
  "en-US": {
    language: "en-US",
    common: {
      dashboard: "SmartCare Dashboard",
      vitals: "Vitals",
      doctor: "Doctor",
      medicine: "Medicine",
      lifestyleAndDiet: "Lifestyle & Diet",
      maps: "Maps",
    },
    vitals: {
      title: "Record Your Vitals",
      systolic: "Systolic",
      diastolic: "Diastolic",
      heartRate: "Heart Rate",
      saveButton: "Save Vitals",
      allFieldsRequired: "Please enter all vitals.",
      savedSuccessfully: "Vitals saved successfully",
      failedToSave: "Failed to save vitals",
    },
    doctor: {
      title: "Doctor Management",
      searchDoctor: "Search Doctor",
      assignedDoctors: "Assigned Doctors",
      noDoctorsAssigned: "No doctors assigned yet",
    },
    medicine: {
      medicationAnalysis: "Medication Analysis",
      medicationReminders: "Medication Reminders",
      addReminder: "Add Reminder",
      noReminders: "No reminders set yet",
    },
    lifestyle: {
      title: "Lifestyle Assessment",
      smoking: "Do you smoke?",
      alcohol: "Do you consume alcohol?",
      caffeine: "Cups of coffee/tea per day",
      exercise: "Exercise frequency",
      hoursOfSleep: "Hours of sleep",
      submitButton: "Submit Assessment",
      regenerateButton: "Regenerate Recommendations",
      lowExercise: "Low",
      moderateExercise: "Moderate",
      highExercise: "High",
      noneExercise: "None",
      neverExercise: "Never",
      rarelyExercise: "Rarely",
      fewTimesWeek: "Few times/week",
      dailyExercise: "Daily",
      dietRecommendations: "Diet Recommendations",
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      snacks: "Snacks",
      generalAdvice: "General Advice",
      calorieTarget: "Daily Calorie Target",
    },
    alerts: {
      lowBloodPressure: "Low Blood Pressure",
      normalBloodPressure: "Normal",
      elevatedBloodPressure: "Elevated",
      stage1Hypertension: "Stage 1 Hypertension",
      stage2Hypertension: "Stage 2 Hypertension",
      hypertensiveCrisis: "Hypertensive Crisis",
      stable: "Stable",
      alert: "Alert",
    },
  },
  "sw-TZ": {
    language: "sw-TZ",
    common: {
      dashboard: "Lango la SmartCare",
      vitals: "Vitali",
      doctor: "Daktari",
      medicine: "Dawa",
      lifestyleAndDiet: "Maisha na Chakula",
      maps: "Ramani",
    },
    vitals: {
      title: "Rekodi Vitali Zako",
      systolic: "Sistolic",
      diastolic: "Diastolic",
      heartRate: "Kasi ya moyo",
      saveButton: "Hifadhi Vitali",
      allFieldsRequired: "Tafadhali ingiza vitali zote.",
      savedSuccessfully: "Vitali zimeshindishwa kwa mafanikio",
      failedToSave: "Imeshindik kuhifadhi vitali",
    },
    doctor: {
      title: "Usimamizi wa Daktari",
      searchDoctor: "Tafuta Daktari",
      assignedDoctors: "Wadaktari Waliowekewa",
      noDoctorsAssigned: "Hakuna daktari aliyeowekewe bado",
    },
    medicine: {
      medicationAnalysis: "Uchambuzi wa Dawa",
      medicationReminders: "Kumbusho za Dawa",
      addReminder: "Ongeza Kumbusho",
      noReminders: "Hakuna kumbusho zimeweka bado",
    },
    lifestyle: {
      title: "Tathmini ya Maisha",
      smoking: "Una sigara?",
      alcohol: "Unywai pombe?",
      caffeine: "Copi za kahawa/tea kwa siku",
      exercise: "Mara unywa mazoezi",
      hoursOfSleep: "Masaa ya usingizi",
      submitButton: "Wasilisha Tathmini",
      regenerateButton: "Unda Upya Mapendekezo",
      lowExercise: "Chini",
      moderateExercise: "Wastani",
      highExercise: "Juu",
      noneExercise: "Hakuna",
      neverExercise: " kamwe",
      rarelyExercise: "Mara kwa mara",
      fewTimesWeek: "Marachache kwa wiki",
      dailyExercise: "Kila siku",
      dietRecommendations: "Mapendekezo ya Chakula",
      breakfast: "Chakula cha asubuhi",
      lunch: "Chakula cha mchana",
      dinner: "Chakula cha jioni",
      snacks: "Chakula cha kati ya chakula",
      generalAdvice: "Maelekezo ya Jumla",
      calorieTarget: "Lengo la Kalori kwa Siku",
    },
    alerts: {
      lowBloodPressure: "Shinikizo la Chini la Damu",
      normalBloodPressure: "Kawaida",
      elevatedBloodPressure: "Kiwango Cha Juu",
      stage1Hypertension: "Hatua ya 1 ya Shinikizo la Juu la Damu",
      stage2Hypertension: "Hatua ya 2 ya Shinikizo la Juu la Damu",
      hypertensiveCrisis: "Mgongano wa Shinikizo la Juu la Damu",
      stable: "Imekuwa Imara",
      alert: "Tangazo",
    }
  }
};

interface UseTranslationReturn {
  language: string;
  setLanguage: (lang: string) => void;
  t: Translations;
  availableLanguages: { code: string; name: string; nativeName: string }[];
}

export const useTranslation = (): UseTranslationReturn => {
  const [language, setLanguageInternal] = useState<LangKey>("en-US");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && translations[savedLanguage as LangKey]) {
      setLanguageInternal(savedLanguage as LangKey);
    }
  }, []);

  const handleSetLanguage = useCallback((lang: string) => {
    const langKey = lang as LangKey;
    if (translations[langKey]) {
      setLanguageInternal(langKey);
      localStorage.setItem("language", lang);
      window.dispatchEvent(new CustomEvent('languagechange', { detail: langKey }));
    }
  }, []);

  const availableLanguages = [
    { code: "en-US", name: "English", nativeName: "English" },
    { code: "sw-TZ", name: "Swahili", nativeName: "Kiswahili" },
  ];

  useEffect(() => {
    const handleLanguageChange = (e: CustomEvent) => {
      const lang = e.detail as LangKey;
      if (translations[lang]) {
        setLanguageInternal(lang);
      }
    };

    window.addEventListener('languagechange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange as EventListener);
    };
  }, []);

  const currentTranslations = translations[language] || translations["en-US"];

  return {
    language,
    setLanguage: handleSetLanguage,
    t: currentTranslations,
    availableLanguages,
  };
};
