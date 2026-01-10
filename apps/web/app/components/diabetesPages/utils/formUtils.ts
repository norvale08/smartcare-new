// apps/web/app/components/diabetesPages/utils/formUtils.ts
import { diabetesType } from "@/types/diabetes";
import { diabetesValidationRules as uiValidationRules } from "@repo/ui";

export const diabetesValidationRules = uiValidationRules;

// ✅ UPDATED: Shorter prompts with reordered flow matching voiceUtils
export const languageContent = {
  en: {
    title: "Health Vitals Tracker",
    subtitle: "Monitor your glucose levels and vital signs with precision",
    successTitle: "Data Saved Successfully!",
    successMessage: "Your vitals have been securely recorded.",
    glucoseTitle: "Glucose Level",
    glucoseSubtitle: "Primary diabetes indicator",
    glucoseLabel: "Blood Glucose",
    glucosePlaceholder: "e.g., 120",
    contextTitle: "Measurement Context",
    contextSubtitle: "When did you measure?",
    contextLabel: "Context",
    contextOptions: {
      empty: "Select context",
      fasting: "Fasting",
      postMeal: "Post-Meal",
      random: "Random"
    },
    mealTitle: "Meal Details",
    mealSubtitle: "What did you eat?",
    lastMealLabel: "Last Meal",
    mealTypeLabel: "Meal Type",
    lastMealOptions: {
      empty: "Select time",
      twoHours: "2 hours",
      fourHours: "4 hours",
      sixHours: "6 hours",
      moreThanSix: "6+ hours"
    },
    mealTypeOptions: {
      empty: "Select type",
      carbs: "Carbs",
      sugaryDrinks: "Sugary Drinks",
      proteins: "Proteins",
      vegetables: "Vegetables",
      mixed: "Mixed"
    },
    cardioTitle: "Cardiovascular Vitals",
    cardioSubtitle: "Heart and circulation metrics",
    proTip: "Pro Tip: Regular monitoring helps protect your heart and kidneys.",
    systolicLabel: "Systolic BP",
    systolicPlaceholder: "120",
    diastolicLabel: "Diastolic BP",
    diastolicPlaceholder: "80",
    heartRateLabel: "Heart Rate",
    heartRatePlaceholder: "72",
    exerciseTitle: "Physical Activity",
    exerciseSubtitle: "Recent exercise impacts glucose",
    exerciseImportant: "Important: Exercise can lower blood glucose levels.",
    exerciseRecentLabel: "Recent Exercise",
    exerciseIntensityLabel: "Intensity",
    exerciseOptions: {
      empty: "Select option",
      none: "None",
      within2Hours: "Within 2 hours",
      twoToSixHours: "2-6 hours",
      sixTo24Hours: "6-24 hours"
    },
    intensityOptions: {
      empty: "Select intensity",
      light: "Light",
      moderate: "Moderate",
      vigorous: "Vigorous"
    },
    aiInsights: "Get AI Health Insights",
    submitting: "Submitting...",
    submit: "Submit Vitals",
    voiceMode: "Voice Mode",
    startVoice: "Start Voice",
    stopVoice: "Stop Voice",
    listening: "Listening...",
    currentlyReading: "Reading",
    speakNow: "Speak",
    voiceComplete: "Voice complete!",
    voiceCancelled: "Cancelled",
    skipField: "Skip",
    confirmQuestion: "Confirm",
    yes: "Yes",
    no: "No",
    skip: "Skip",
    // ✅ MUCH SHORTER field instructions - just the field name
    fieldInstructions: {
      glucose: "Glucose",
      context: "Context",
      systolic: "Systolic",
      diastolic: "Diastolic",
      heartRate: "Heart rate",
      lastMealTime: "Last meal time",
      mealType: "Meal type",
      exerciseRecent: "Exercise recent",
      exerciseIntensity: "Intensity"
    },
    optionKeywords: {
      context: {
        fasting: ["fasting", "fast", "empty stomach", "morning", "before eating"],
        postMeal: ["post meal", "after eating", "after food", "after meal"],
        random: ["random", "anytime", "any time"]
      },
      lastMealTime: {
        twoHours: ["two hours", "2 hours", "recently", "2"],
        fourHours: ["four hours", "4 hours", "4"],
        sixHours: ["six hours", "6 hours", "6"],
        moreThanSix: ["more than six", "more than 6", "6 plus", "6+", "6 +", "over 6", "longer than 6", "+ hours"]
      },
      mealType: {
        carbs: ["carbohydrates", "carbs", "bread", "rice", "pasta"],
        sugaryDrinks: ["sugary drinks", "soda", "juice", "sweet drinks"],
        proteins: ["proteins", "meat", "chicken", "fish", "eggs"],
        vegetables: ["vegetables", "salad", "greens", "veggies"],
        mixed: ["mixed", "combination", "everything", "balanced"]
      },
      exerciseRecent: {
        none: ["none", "non", "known", "nun", "no exercise", "did not exercise", "didn't exercise", "haven't exercised", "no workout", "not exercised", "i did not", "i have not"],
    within2Hours: ["within two hours", "within 2 hours", "recent", "2 hours", "two hours"],
    twoToSixHours: ["two to six hours", "2 to 6 hours", "2 to 6", "few hours"],
    sixTo24Hours: ["six to twenty four", "6 to 24", "yesterday", "6 to 24 hours", "24 hours"]
      },
      exerciseIntensity: {
        light: ["light", "walking", "easy", "gentle"],
        moderate: ["moderate", "brisk", "cycling", "medium"],
        vigorous: ["vigorous", "running", "sports", "intense"]
      }
    }
  },
  sw: {
    title: "Kifaa cha Kufuatilia Viwango vya Afya",
    subtitle: "Fuatilia viwango vya sukari damu na ishara muhimu za kiafya kwa usahihi",
    successTitle: "Data Imehifadhiwa!",
    successMessage: "Viwango vyako vya kiafya vimeandikwa kwa usalama.",
    glucoseTitle: "Kiwango cha Sukari Damu",
    glucoseSubtitle: "Kionyeshi kikuu cha kisukari",
    glucoseLabel: "Sukari Damu",
    glucosePlaceholder: "mfano, 120",
    contextTitle: "Muktadha",
    contextSubtitle: "Ulipima lini?",
    contextLabel: "Muktadha",
    contextOptions: {
      empty: "Chagua muktadha",
      fasting: "Kifunga",
      postMeal: "Baada ya chakula",
      random: "Ovyo ovyo"
    },
    mealTitle: "Maelezo ya Chakula",
    mealSubtitle: "Ulikula nini?",
    lastMealLabel: "Chakula cha Mwisho",
    mealTypeLabel: "Aina ya Chakula",
    lastMealOptions: {
      empty: "Chagua muda",
      twoHours: "Masaa 2",
      fourHours: "Masaa 4",
      sixHours: "Masaa 6",
      moreThanSix: "Zaidi ya 6"
    },
    mealTypeOptions: {
      empty: "Chagua aina",
      carbs: "Wanga",
      sugaryDrinks: "Vinywaji tamu",
      proteins: "Protini",
      vegetables: "Mboga",
      mixed: "Mchanganyiko"
    },
    cardioTitle: "Viwango vya Mfumo wa Moyo",
    cardioSubtitle: "Vipimo vya moyo na mzunguko wa damu",
    proTip: "Ushauri: Ufuatiliaji wa mara kwa mara husaidia kulinda moyo na figo zako.",
    systolicLabel: "Systolic",
    systolicPlaceholder: "120",
    diastolicLabel: "Diastolic",
    diastolicPlaceholder: "80",
    heartRateLabel: "Mapigo ya Moyo",
    heartRatePlaceholder: "72",
    exerciseTitle: "Shughuli za Mwili",
    exerciseSubtitle: "Mazoezi ya hivi karibuni yanaathiri sukari damu",
    exerciseImportant: "Muhimu: Mazoezi yanaweza kupunguza sukari damu.",
    exerciseRecentLabel: "Mazoezi ya Karibuni",
    exerciseIntensityLabel: "Ukali",
    exerciseOptions: {
      empty: "Chagua chaguo",
      none: "Hakuna",
      within2Hours: "Masaa 2",
      twoToSixHours: "Masaa 2-6",
      sixTo24Hours: "Masaa 6-24"
    },
    intensityOptions: {
      empty: "Chagua ukali",
      light: "Mwepesi",
      moderate: "Wastani",
      vigorous: "Mizito"
    },
    aiInsights: "Pata Uchambuzi wa AI",
    submitting: "Inatumwa...",
    submit: "Wasilisha",
    voiceMode: "Hali ya Sauti",
    startVoice: "Anza Sauti",
    stopVoice: "Acha Sauti",
    listening: "Ninasikiliza...",
    currentlyReading: "Ninasoma",
    speakNow: "Zungumza",
    voiceComplete: "Imekamilika!",
    voiceCancelled: "Imesitishwa",
    skipField: "Ruka",
    confirmQuestion: "Thibitisha",
    yes: "Ndio",
    no: "Hapana",
    skip: "Ruka",
    // ✅ SHORTER Swahili instructions
    fieldInstructions: {
      glucose: "Sukari",
      systolic: "Systolic",
      diastolic: "Diastolic",
      heartRate: "Mapigo",
      context: "Muktadha",
      lastMealTime: "Muda wa chakula",
      mealType: "Aina ya chakula",
      exerciseRecent: "Mazoezi",
      exerciseIntensity: "Ukali"
    },
    optionKeywords: {
      context: {
        fasting: ["kifunga", "tumbo tupu", "asubuhi"],
        postMeal: ["baada ya chakula", "baada ya kula", "chakula"],
        random: ["ovyo ovyo", "wakati wowote", "muda wowote"]
      },
      lastMealTime: {
        twoHours: ["masaa mawili", "masaa 2", "2"],
        fourHours: ["masaa manne", "masaa 4", "4"],
        sixHours: ["masaa sita", "masaa 6", "6"],
        moreThanSix: ["zaidi ya masaa sita", "zaidi ya 6", "zaidi", "6 plus", "6 +", "+ masaa"]
      },
      mealType: {
        carbs: ["wanga", "mkate", "wali", "ugali"],
        sugaryDrinks: ["vinywaji vya sukari", "soda", "juisi"],
        proteins: ["protini", "nyama", "kuku", "samaki"],
        vegetables: ["mboga mboga", "saladi", "majani"],
        mixed: ["mchanganyiko", "changanya", "kila kitu"]
      },
      exerciseRecent: {
        none: ["hakuna", "hapana", "hakuna mazoezi", "sijafanya mazoezi", "la", "hapana mazoezi"],
        within2Hours: ["ndani ya masaa mawili", "masaa 2", "2"],
        twoToSixHours: ["masaa mawili hadi sita", "masaa 2 hadi 6", "2 hadi 6"],
        sixTo24Hours: ["masaa sita hadi ishirini na nne", "masaa 6 hadi 24", "6 hadi 24"]
      },
      exerciseIntensity: {
        light: ["mwepesi", "kutembea", "rahisi"],
        moderate: ["wastani", "kasi", "baiskeli"],
        vigorous: ["mizito", "kukimbia", "michezo"]
      }
    }
  }
};

export interface FieldConfig {
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

export interface VoiceModeState {
  active: boolean;
  listening: boolean;
  speaking: boolean;
  currentField: string | null;
  muted: boolean;
  paused: boolean;
  status: string;
}

export const getDisplayValue = (fieldName: string, value: string, currentLanguage: any): string => {
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