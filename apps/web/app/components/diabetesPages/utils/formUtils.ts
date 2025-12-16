// apps/web/app/components/diabetesPages/utils/formUtils.ts
import { diabetesType } from "@/types/diabetes";
import { diabetesValidationRules as uiValidationRules } from "@repo/ui";

// Re-export validation rules
export const diabetesValidationRules = uiValidationRules;

// Language content
export const languageContent = {
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
      context: {
        fasting: ["fasting", "fast", "empty stomach", "morning", "before eating", "before food"],
        postMeal: ["post meal", "after eating", "after food", "after meal", "postprandial", "postmill", "just ate", "after lunch", "after dinner"],
        random: ["random", "anytime", "any time", "whenever", "casual", "no specific time"]
      },
      lastMealTime: {
        twoHours: ["two hours", "2 hours", "recently", "just ate", "2 hours ago", "two hours ago", "couple hours", "recent meal", "just now", "within two hours", "within 2 hours"],
        fourHours: ["four hours", "4 hours", "few hours", "4 hours ago", "four hours ago", "several hours", "some hours", "3-4 hours"],
        sixHours: ["six hours", "6 hours", "half day", "6 hours ago", "six hours ago", "half a day", "several hours ago", "5-6 hours"],
        moreThanSix: ["more than six", "more than 6", "long time", "many hours", "more than 6 hours", "over 6 hours", "earlier today", "this morning", "yesterday", "long ago", "hours ago"]
      },
      mealType: {
        carbs: ["carbohydrates", "carbs", "bread", "rice", "pasta", "potatoes", "grains", "cereal", "starch"],
        sugaryDrinks: ["sugary drinks", "soda", "juice", "sweet drinks", "soft drinks", "sugary beverages", "cola", "pop", "sweetened beverage"],
        proteins: ["proteins", "meat", "chicken", "fish", "eggs", "beef", "pork", "turkey", "protein meal", "animal protein"],
        vegetables: ["vegetables", "salad", "greens", "veggies", "leafy greens", "broccoli", "carrots", "vegetable meal", "plant-based"],
        mixed: ["mixed", "combination", "everything", "balanced", "mixed meal", "variety", "complete meal", "full meal"]
      },
      exerciseRecent: {
        none: ["none", "no", "didn't exercise", "no exercise", "no recent exercise", "haven't exercised", "not exercised", "no workout"],
        within2Hours: ["within two hours", "within 2 hours", "recent exercise", "just exercised", "just now", "recently", "within the last two hours", "recent workout"],
        twoToSixHours: ["two to six hours", "2 to 6 hours", "few hours ago", "earlier today", "2-6 hours", "2 to 6", "several hours ago", "today"],
        sixTo24Hours: ["six to twenty four", "6 to 24", "yesterday", "day before", "6-24 hours", "6 to 24 hours", "six to 24 hours", "within 24 hours", "last day"]
      },
      exerciseIntensity: {
        light: ["light", "walking", "stretching", "gentle", "easy", "light exercise", "leisurely", "slow", "casual"],
        moderate: ["moderate", "brisk", "cycling", "medium", "moderate exercise", "brisk walking", "steady", "medium intensity"],
        vigorous: ["vigorous", "running", "sports", "intense", "hard", "vigorous exercise", "high intensity", "heavy", "strenuous"]
      }
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
      context: {
        fasting: ["kifunga", "tumbo tupu", "asubuhi", "bila chakula", "kabla ya chakula", "kabla ya kula", "chini ya kifunga"],
        postMeal: ["baada ya chakula", "baada ya kula", "chakula", "kisha chakula", "baada ya mlo", "nilikula", "baada ya breakfast"],
        random: ["ovyo ovyo", "wakati wowote", "muda wowote", "bila mpangilio", "sio maalum", "kwa bahati nasibu"]
      },
      lastMealTime: {
        twoHours: ["masaa mawili", "masaa 2", "hivi karibuni", "karibu", "masaa mawili zilizopita", "2 masaa", "dakika mia mbili", "saa mbili", "ndani ya masaa mawili", "hivi punde"],
        fourHours: ["masaa manne", "masaa 4", "muda mfupi", "masaa manne zilizopita", "4 masaa", "saa nne", "masaa kadhaa", "masaa 3-4"],
        sixHours: ["masaa sita", "masaa 6", "nusu siku", "masaa sita zilizopita", "6 masaa", "saa sita", "masaa kadhaa zilizopita", "masaa 5-6"],
        moreThanSix: ["zaidi ya masaa sita", "zaidi ya 6", "muda mrefu", "masaa mengi", "zaidi ya masaa 6", "zaidi ya sita", "siku", "muda mrefu sana", "asubuhi", "jana", "zamani"]
      },
      mealType: {
        carbs: ["wanga", "carbohydrates", "mkate", "wali", "ugali", "ndizi", "viazi", "nafaka", "starch"],
        sugaryDrinks: ["vinywaji vya sukari", "soda", "juisi", "vinywaji tamu", "soda tamu", "maji ya matunda", "cola", "vinywaji vilivyo na sukari nyingi"],
        proteins: ["protini", "nyama", "kuku", "samaki", "mayai", "nyama ya ng'ombe", "nyama ya mbuzi", "nyama ya nguruwe", "protini za wanyama"],
        vegetables: ["mboga mboga", "saladi", "majani", "mboga", "majani ya kijani", "broccoli", "karoti", "chakula cha mimea", "mboga za majani"],
        mixed: ["mchanganyiko", "changanya", "kila kitu", "usawa", "chakula mchanganyiko", "mchanganyiko wa chakula", "chakula kamili", "chakula cha aina mbalimbali"]
      },
      exerciseRecent: {
        none: ["hakuna", "hapana", "sikufanya mazoezi", "hakuna mazoezi", "sijafanya mazoezi", "bila mazoezi", "sio mazoezi", "bila workout"],
        within2Hours: ["ndani ya masaa mawili", "ndani ya masaa 2", "mazoezi ya hivi karibuni", "hivi karibuni", "sasa hivi", "karibuni sana", "ndani ya masaa mawili yaliyopita", "workout ya hivi karibuni"],
        twoToSixHours: ["masaa mawili hadi sita", "masaa 2 hadi 6", "muda mfupi uliopita", "mapema leo", "2 hadi 6 masaa", "2-6 masaa", "masaa kadhaa uliyopita", "leo"],
        sixTo24Hours: ["masaa sita hadi ishirini na nne", "masaa 6 hadi 24", "jana", "siku mbili zilizopita", "6 hadi 24 masaa", "6-24 masaa", "ndani ya masaa 24", "siku iliyopita"]
      },
      exerciseIntensity: {
        light: ["mwepesi", "kutembea", "kunyoosha", "taratibu", "rahisi", "mazoezi mwepesi", "polepole", "kwa urahisi"],
        moderate: ["wastani", "kasi", "baiskeli", "wastani", "mazoezi wastani", "kutembea kwa kasi", "kwa kasi ya wastani", "mazoezi ya kiwango cha wastani"],
        vigorous: ["mizito", "kukimbia", "michezo", "ngumu", "kali", "mazoezi mizito", "ukali", "mazoezi magumu", "mazoezi ya kiwango cha juu"]
      }
    }
  }
};

// Types
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

// UPDATED: Make paused property required
export interface VoiceModeState {
  active: boolean;
  listening: boolean;
  speaking: boolean;
  currentField: string | null;
  muted: boolean;
  paused: boolean;  // ✅ Changed from `paused?: boolean` to `paused: boolean`
  status: string;
}

// Helper functions
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