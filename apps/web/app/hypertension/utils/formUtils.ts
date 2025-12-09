// apps/web/app/hypertension/utils/formUtils.ts
import { useTranslation } from "../../../lib/hypertension/useTranslation";

// Language content for hypertension form
export const languageContent = {
  en: {
    title: "Blood Pressure Tracker",
    subtitle: "Monitor your blood pressure and heart rate with precision",
    successTitle: "Data Saved Successfully!",
    successMessage: "Your vitals have been securely recorded.",
    systolicLabel: "Systolic Blood Pressure",
    systolicPlaceholder: "120",
    diastolicLabel: "Diastolic Blood Pressure",
    diastolicPlaceholder: "80",
    heartRateLabel: "Heart Rate (bpm)",
    heartRatePlaceholder: "72",
    activityTypeLabel: "Activity Type",
    activityTypePlaceholder: "Select activity",
    durationLabel: "Duration (minutes)",
    durationPlaceholder: "0",
    intensityLabel: "Intensity",
    timeSinceActivityLabel: "Time Since Activity (minutes)",
    timeSinceActivityPlaceholder: "0",
    notesLabel: "Notes (optional)",
    notesPlaceholder: "E.g., Just finished a walk, or feeling stressed out this morning...",
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
      systolic: "Please say your systolic blood pressure. This is the top number. For example, say 'one twenty' for 120. Say 'skip' if you don't have this measurement.",
      diastolic: "Please say your diastolic blood pressure. This is the bottom number. For example, say 'eighty' for 80. Say 'skip' if you don't have this measurement.",
      heartRate: "Please say your heart rate in beats per minute. For example, say 'seventy two' for 72. Say 'skip' if you don't have this measurement.",
      activityType: "Please say your recent activity. Options are: 'none', 'exercise', 'walking', 'eating', 'stress', 'sleep', 'caffeine', 'medication', 'illness'. Say 'skip' if you don't know.",
      duration: "Please say the duration of your activity in minutes. For example, say 'thirty' for 30. Say 'zero' if unsure. Say 'skip' to skip.",
      intensity: "Please say your activity intensity. Options are: 'light', 'moderate', or 'vigorous'. Say 'skip' if you don't know.",
      timeSinceActivity: "Please say how many minutes ago you finished the activity. For example, say 'fifteen' for 15. Say 'zero' if unsure. Say 'skip' to skip."
    },
    optionKeywords: {
      activityType: {
        none: ["none", "no", "nothing", "no activity", "rest", "inactive"],
        exercise: ["exercise", "workout", "gym", "fitness", "training", "work out", "workout"],
        walking: ["walking", "walk", "stroll", "strolling", "on foot", "walking around"],
        eating: ["eating", "meal", "food", "just ate", "breakfast", "lunch", "dinner", "snack"],
        stress: ["stress", "stressed", "anxiety", "worried", "tense", "pressure", "nervous"],
        sleep: ["sleep", "sleepy", "tired", "rest", "rested", "nap", "slept", "sleeping"],
        caffeine: ["caffeine", "coffee", "tea", "energy drink", "soda", "cola", "caffeinated"],
        medication: ["medication", "medicine", "pills", "drugs", "tablet", "capsule", "pill"],
        illness: ["illness", "sick", "fever", "cold", "flu", "unwell", "not feeling well", "disease"]
      },
      intensity: {
        light: ["light", "easy", "gentle", "low", "minimal", "casual", "slow", "relaxed"],
        moderate: ["moderate", "medium", "normal", "regular", "standard", "average", "moderate level"],
        vigorous: ["vigorous", "intense", "hard", "strenuous", "heavy", "strong", "high", "maximum"]
      }
    }
  },
  sw: {
    title: "Kifaa cha Kufuatilia Shinikizo la Damu",
    subtitle: "Fuatilia shinikizo lako la damu na mapigo ya moyo kwa usahihi",
    successTitle: "Data Imehifadhiwa Kikamilifu!",
    successMessage: "Vipimo vyako vimehifadhiwa kwa usalama.",
    systolicLabel: "Shinikizo la Damu la Sistolic",
    systolicPlaceholder: "120",
    diastolicLabel: "Shinikizo la Damu la Diastolic",
    diastolicPlaceholder: "80",
    heartRateLabel: "Mapigo ya Moyo (bpm)",
    heartRatePlaceholder: "72",
    activityTypeLabel: "Aina ya Shughuli",
    activityTypePlaceholder: "Chagua shughuli",
    durationLabel: "Muda (dakika)",
    durationPlaceholder: "0",
    intensityLabel: "Ukali",
    timeSinceActivityLabel: "Muda Uliopita (dakika)",
    timeSinceActivityPlaceholder: "0",
    notesLabel: "Maelezo (hiari)",
    notesPlaceholder: "Mf., Nimeimaliza matembezi, au nahisi mkazo asubuhi hii...",
    aiInsights: "Pata Uchambuzi wa Afya kutoka kwa AI",
    submitting: "Inatumwa...",
    submit: "Wasilisha Vipimo",
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
      systolic: "Tafadhali sema shinikizo lako la damu sistolic. Hii ni nambari ya juu. Kwa mfano, sema 'mia moja ishirini' kwa 120. Sema 'ruka' kama huna kipimo hiki.",
      diastolic: "Tafadhali sema shinikizo lako la damu diastolic. Hii ni nambari ya chini. Kwa mfano, sema 'themanini' kwa 80. Sema 'ruka' kama huna kipimo hiki.",
      heartRate: "Tafadhali sema mapigo ya moyo yako kwa dakika. Kwa mfano, sema 'sabini na mbili' kwa 72. Sema 'ruka' kama huna kipimo hiki.",
      activityType: "Tafadhali sema shughuli yako ya hivi karibuni. Chaguo ni: 'hapuna', 'zoezi', 'kutembea', 'kula', 'mkazo', 'usingizi', 'kafeini', 'dawa', 'ugonjwa'. Sema 'ruka' kama hujui.",
      duration: "Tafadhali sema muda wa shughuli yako kwa dakika. Kwa mfano, sema 'thelathini' kwa 30. Sema 'sifuri' usijui. Sema 'ruka' kuruka.",
      intensity: "Tafadhali sema ukali wa shughuli yako. Chaguo ni: 'nyepesi', 'wastani', au 'kali'. Sema 'ruka' kama hujui.",
      timeSinceActivity: "Tafadhali sema dakika ngapi ulizokamilisha shughuli. Kwa mfano, sema 'kumi na tano' kwa 15. Sema 'sifuri' usijui. Sema 'ruka' kuruka."
    },
    optionKeywords: {
      activityType: {
        none: ["hapuna", "sio", "chacho", "hakuna shughuli", "starehe", "haiwezi kufanya", "wazi"],
        exercise: ["zoezi", "mazoezi", "chumba cha mazoezi", "afya", "mazoezi", "kufanya mazoezi", "mazoezi ya mwili"],
        walking: ["kutembea", "tembea", "kuzunguka", "kutembea polepole", "kwa miguu", "kutembea karibu"],
        eating: ["kula", "chakula", "chakula", "hivi karibuni nilikula", "chakula cha asubuhi", "chakula cha mchana", "chakula jioni", "chakula cha jioni"],
        stress: ["mkazo", "mkazo", "wasiwasi", "wazi", "mtego", "shinikizo", "wasiwasi", "kujisikia dhati"],
        sleep: ["usingizi", "usingi", "chumbani", "kulia", "kulala", "kulala mapumziko", "kulala", "kulala"],
        caffeine: ["kafeini", "kahawa", "chai", "vinywaji vya nishati", "soda", "cola", "na kafeini"],
        medication: ["dawa", "dawa", "vidonge", "dawa", "tableti", "kapsuli", "kula dawa"],
        illness: ["ugonjwa", "sick", "homaa", "baridi", "mafua", "sio vizuri", "sijisikie vizuri", "magonjwa"]
      },
      intensity: {
        light: ["nyepesi", "rahisi", "taratibu", "chini", "kidogo", "kawaida", "polepole", "relaxed"],
        moderate: ["wastani", "wastani", "kawaida", "kawaida", "kawaida", "kawaida", "kiwango cha wastani"],
        vigorous: ["kali", "ngumu", "ngumu", "ngumu", "nzito", "nguvu", "juu", "juu zaidi"]
      }
    }
  }
};

// Types
export interface FieldConfig {
  name: string;
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
  status: string;
}

// Helper functions
export const getDisplayValue = (fieldName: string, value: string, currentLanguage: any): string => {
  const lang = currentLanguage;
  
  switch (fieldName) {
    case 'activityType':
      if (value === 'none') return lang.activityTypeOptions.none;
      if (value === 'exercise') return lang.activityTypeOptions.exercise;
      if (value === 'walking') return lang.activityTypeOptions.walking;
      if (value === 'eating') return lang.activityTypeOptions.eating;
      if (value === 'stress') return lang.activityTypeOptions.stress;
      if (value === 'sleep') return lang.activityTypeOptions.sleep;
      if (value === 'caffeine') return lang.activityTypeOptions.caffeine;
      if (value === 'medication') return lang.activityTypeOptions.medication;
      if (value === 'illness') return lang.activityTypeOptions.illness;
      break;
    case 'intensity':
      if (value === 'light') return lang.intensityOptions.light;
      if (value === 'moderate') return lang.intensityOptions.moderate;
      if (value === 'vigorous') return lang.intensityOptions.vigorous;
      break;
  }
  
  return value;
};

// Get language content
export const getLanguageContent = (language: string) => {
  return languageContent[language as keyof typeof languageContent] || languageContent.en;
};
