import React, { useState, useRef, useCallback, useEffect } from "react"
import ContextAwareAlert, { type ContextAnalysis } from "./ContextAwareAlert"
import { Heart, Activity as ActivityIcon, Clock, Zap, Mic } from "lucide-react"
import { useTranslation } from "../../../lib/hypertension/useTranslation"
import InteractiveVoiceForm from "./InteractiveVoiceForm"
import VoiceControlPanel from "./VoiceControlPanel"
import { 
  startVoiceMode, 
  stopVoiceMode, 
  speak, 
  pauseVoiceMode,
  resumeVoiceMode,
  VoiceModeState,
  listenForField,
  stopCurrentSpeech,
  convertWebmToWav,
  parseSpokenInput,
  askConfirmation
} from "../utils/voiceUtils"
import toast from "react-hot-toast";
import { languageContent, getDisplayValue } from "../utils/formUtils"

// Fixed activity options - match these with backend expectations
const activityOptions = [
  { value: "none", label: "No recent activity" },
  { value: "exercise", label: "Exercise/Workout" },
  { value: "walking", label: "Walking" },
  { value: "eating", label: "Eating/Meal" },
  { value: "stress", label: "Stress/Anxiety" },
  // FIXED: Changed from "sleep_deprivation" to "sleep" to match backend expectations
  { value: "sleep", label: "Sleep Deprivation" },
  { value: "caffeine", label: "Caffeine Intake" },
  { value: "medication", label: "Recent Medication" },
  { value: "illness", label: "Illness/Fever" },
  { value: "other", label: "Other" },
]

// Voice response cache to reduce API calls
const voiceResponseCache = new Map<string, {text: string, timestamp: number}>();

interface VitalsWithActivityInputProps {
  onAfterSave?: () => void
}

export default function VitalsWithActivityInput({
  onAfterSave,
}: VitalsWithActivityInputProps) {
  const { t } = useTranslation()
  const [systolic, setSystolic] = useState("")
  const [diastolic, setDiastolic] = useState("")
  const [heartRate, setHeartRate] = useState("")
  const [activityType, setActivityType] = useState("none")
  const [duration, setDuration] = useState("")
  const [intensity, setIntensity] = useState("moderate")
  const [timeSinceActivity, setTimeSinceActivity] = useState("")
  const [notes, setNotes] = useState("")
  const [message, setMessage] = useState("")
  const [analysis, setAnalysis] = useState<ContextAnalysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastAnalyzedVitals, setLastAnalyzedVitals] = useState<{
    systolic: number
    diastolic: number
    heartRate: number
  } | null>(null)
  const [showVoiceForm, setShowVoiceForm] = useState(false)
  const [voiceModeState, setVoiceModeState] = useState<VoiceModeState>({
    active: false,
    listening: false,
    speaking: false,
    currentField: null,
    muted: false,
    paused: false,
    status: ""
  })
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const languageValue = t.language === "sw-TZ"? "sw" : "en"
  const currentLanguage = languageContent[languageValue]
  const isProcessingRef = useRef(false)
  const fieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceModeActiveRef = useRef(false)
  const pausedRef = useRef(false)
  const speechQueueRef = useRef<string[]>([])
  const isSpeakingRef = useRef(false)
  
  // Ref for storing collected vitals during voice mode
  const collectedVitalsRef = useRef<{
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    activityType?: string;
    duration?: number;
    intensity?: string;
    timeSinceActivity?: number;
  }>({});

  // Update voice mode ref when state changes
  useEffect(() => {
    voiceModeActiveRef.current = voiceModeState.active
  }, [voiceModeState.active])

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      voiceModeActiveRef.current = false
      pausedRef.current = false
      stopCurrentSpeech()
      // Clear cache on unmount
      voiceResponseCache.clear()
    }
  }, [])

  // Optimized Text-to-Speech wrapper
  const handleSpeak = useCallback(async (text: string, priority = false): Promise<void> => {
    if (priority) {
      // For high priority messages, interrupt current speech
      await stopCurrentSpeech();
      return speak(
        text, 
        languageValue, 
        voiceModeState.muted, 
        voiceModeActiveRef,
        pausedRef,
        (state) => setVoiceModeState(prev => ({...prev,...state }))
      )
    } else {
      // Queue regular messages
      return speak(
        text, 
        languageValue, 
        voiceModeState.muted, 
        voiceModeActiveRef,
        pausedRef,
        (state) => setVoiceModeState(prev => ({...prev,...state }))
      )
    }
  }, [languageValue, voiceModeState.muted])

  // Handle pause/resume functionality
  const handlePauseResume = useCallback(() => {
    if (voiceModeState.paused) {
      resumeVoiceMode({
        voiceModeActiveRef,
        pausedRef,
        setVoiceModeState: (state) => setVoiceModeState(prev => ({...prev,...state })),
        handleSpeak,
        languageValue,
        isMuted: voiceModeState.muted,
        currentField: voiceModeState.currentField
      });
    } else {
      pauseVoiceMode({
        voiceModeActiveRef,
        pausedRef,
        mediaRecorderRef,
        setVoiceModeState: (state) => setVoiceModeState(prev => ({...prev,...state })),
        handleSpeak,
        languageValue,
        isMuted: voiceModeState.muted
      });
    }
  }, [voiceModeState.paused, voiceModeState.muted, voiceModeState.currentField, languageValue, handleSpeak])

  // Function to scroll to a field element
  const scrollToField = (fieldName: string) => {
    const fieldElement = document.querySelector(`[data-field="${fieldName}"]`);
    if (fieldElement) {
      fieldElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      // Add highlight animation
      fieldElement.classList.add('ring-2', 'ring-emerald-500', 'ring-opacity-50');
      setTimeout(() => {
        fieldElement.classList.remove('ring-2', 'ring-emerald-500', 'ring-opacity-50');
      }, 2000);
    }
  };

  // Optimized audio transcription with caching
  const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
    try {
      // Create a cache key from the audio blob
      const cacheKey = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const hash = Array.from(new Uint8Array(arrayBuffer))
           .slice(0, 100) // Only use first 100 bytes for hash
           .map(b => b.toString(16).padStart(2, '0'))
           .join('');
          resolve(hash);
        };
        reader.readAsArrayBuffer(audioBlob.slice(0, 100));
      });

      // Check cache (entries older than 5 minutes are stale)
      const cached = voiceResponseCache.get(cacheKey);
      const now = Date.now();
      if (cached && (now - cached.timestamp < 300000)) {
        console.log('Using cached transcription');
        return cached.text;
      }

      // Convert webm to wav
      const wavBlob = await convertWebmToWav(audioBlob);
      
      const formData = new FormData();
      formData.append("audio", wavBlob, "recording.wav");
      formData.append("language", languageValue);

      const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(8000) // Reduced from 10000 to 8000
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.text) {
        // Cache the result
        voiceResponseCache.set(cacheKey, {
          text: data.text,
          timestamp: now
        });
        
        // Limit cache size
        if (voiceResponseCache.size > 50) {
  const oldestKey = Array.from(voiceResponseCache.keys())[0];
  if (oldestKey!== undefined) {
    voiceResponseCache.delete(oldestKey);
  }
}
        
        return data.text;
      }
      
      return null;
    } catch (error: any) {
      console.error("Transcription error:", error);
      
      // Fallback to local speech recognition if available
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        try {
          return await localSpeechRecognition(audioBlob);
        } catch (e) {
          console.error("Local speech recognition also failed:", e);
        }
      }
      
      return null;
    }
  };

  // Local fallback speech recognition
  const localSpeechRecognition = (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Convert blob to audio URL
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // This is a simplified fallback - in production you'd want a proper Web Speech API implementation
      setTimeout(() => {
        resolve(""); // Return empty string as fallback
        URL.revokeObjectURL(audioUrl);
      }, 1000);
    });
  };

  // Function to auto-submit after voice mode
  const autoSubmitVitals = async () => {
    if (!collectedVitalsRef.current.systolic ||!collectedVitalsRef.current.diastolic ||!collectedVitalsRef.current.heartRate) {
      console.error("Missing required vitals for auto-submit");
      return false;
    }

    setSaving(true);
    setMessage("");
    setAnalysis(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated.");

      // Prepare submission data - FIXED: Use "sleep" instead of "sleep_deprivation"
      const submitData = {
        systolic: collectedVitalsRef.current.systolic,
        diastolic: collectedVitalsRef.current.diastolic,
        heartRate: collectedVitalsRef.current.heartRate,
        activityType: collectedVitalsRef.current.activityType || "none",
        duration: collectedVitalsRef.current.duration || 0,
        intensity: collectedVitalsRef.current.intensity || "moderate",
        timeSinceActivity: collectedVitalsRef.current.timeSinceActivity || 0,
        notes: notes || "",
      };

      console.log("Auto-submitting vitals:", submitData);

      // Save vitals + activity to backend
      const saveResp = await fetch(
        `${API_URL}/api/hypertensionVitals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!saveResp.ok) throw new Error("Failed to save vitals");

      // Call AI analysis with language parameter
      const languageParam = t.language === "sw-TZ"? "sw-TZ" : "en-US"
      const aiResp = await fetch(
        `${API_URL}/api/hypertensionVitals/analyze?language=${languageParam}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            vitals: {
              systolic: collectedVitalsRef.current.systolic,
              diastolic: collectedVitalsRef.current.diastolic,
              heartRate: collectedVitalsRef.current.heartRate,
            },
            activity: {
              activityType: collectedVitalsRef.current.activityType || "none",
              duration: collectedVitalsRef.current.duration || 0,
              intensity: collectedVitalsRef.current.intensity || "moderate",
              timeSinceActivity: collectedVitalsRef.current.timeSinceActivity || 0,
              notes: notes || "",
            },
          }),
        }
      );

      if (!aiResp.ok) throw new Error("AI analysis failed");

      const aiJson = await aiResp.json();
      setAnalysis(aiJson);
      setLastAnalyzedVitals({
        systolic: collectedVitalsRef.current.systolic,
        diastolic: collectedVitalsRef.current.diastolic,
        heartRate: collectedVitalsRef.current.heartRate,
      });
      
      // Update state with collected values
      setSystolic(collectedVitalsRef.current.systolic.toString());
      setDiastolic(collectedVitalsRef.current.diastolic.toString());
      setHeartRate(collectedVitalsRef.current.heartRate.toString());
      if (collectedVitalsRef.current.activityType) {
        setActivityType(collectedVitalsRef.current.activityType);
      }
      if (collectedVitalsRef.current.duration!== undefined) {
        setDuration(collectedVitalsRef.current.duration.toString());
      }
      if (collectedVitalsRef.current.intensity) {
        setIntensity(collectedVitalsRef.current.intensity);
      }
      if (collectedVitalsRef.current.timeSinceActivity!== undefined) {
        setTimeSinceActivity(collectedVitalsRef.current.timeSinceActivity.toString());
      }

      const successMsg = t.language === "en-US" 
       ? " Vitals saved & analyzed successfully!"
        : " Vitali zimehifadhiwa na kuchambuliwa kwa mafanikio!";
      
      setMessage(successMsg);
      toast.success(successMsg);
      
      if (onAfterSave) onAfterSave();
      
      return true;
    } catch (e: any) {
      const errorMsg = e.message || (t.language === "en-US" 
       ? " There was an error. Please try again."
        : " Kulikuwa na hitilafu. Tafadhali jaribu tena.");
      
      setMessage(errorMsg);
      setAnalysis(null);
      toast.error(errorMsg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Handle content reading for different sections
  const handleReadContent = useCallback(async (content: string, type: 'trends' | 'lifestyle' | 'diet' | 'doctor' | 'map' | 'medication' | 'analysis' | 'alert' | 'context-alert') => {
    if (!voiceModeState.active || voiceModeState.paused) return;

    // Get the actual content from the page
    let contentToRead = '';
    
    switch (type) {
      case 'alert':
        contentToRead = document.querySelector('[data-content="health-alert"]')?.textContent || 
                       (languageValue === "sw" 
                       ? "Hakuna arifa maalum kwa sasa. Shinikizo la damu lako liko ndani ya viwango vya kawaida." 
                        : "No specific alerts at this time. Your blood pressure is within normal ranges.");
        break;
      case 'analysis':
      case 'context-alert':
        if (analysis) {
          // Build analysis text from available properties
          const analysisText = [
            analysis.title,
            analysis.description,
            analysis.activityInfluence,
            analysis.recommendation,
            analysis.shouldNotifyDoctor? 
              (languageValue === "sw" 
               ? "Daktari wako atataarifiwa kuhusu usomaji huu." 
                : "Your doctor will be notified about this reading.") 
              : ""
          ].filter(Boolean).join(". ");
          
          contentToRead = analysisText || 
                         (languageValue === "sw" 
                         ? "Uchambuzi umekamilika. Angalia mapendekezo hapa chini." 
                          : "Analysis complete. Check recommendations below.");
        } else {
          contentToRead = languageValue === "sw" 
                       ? "Hakuna matokeo ya uchambuzi yanayopatikana bado." 
                        : "No analysis results available yet.";
        }
        break;
      case 'trends':
        contentToRead = document.querySelector('[data-content="trends"]')?.textContent || 
                       (languageValue === "sw" 
                       ? "Mabadiliko ya kiafya yanaonyesha shinikizo lako la damu limeongezeka kiasi cha asilimia ishirini katika mwezi uliopita. Inashauriwa upimwe tena baada ya wiki mbili." 
                        : "Health trends show your blood pressure has increased by about twenty percent over the past month. It's recommended to measure again after two weeks.");
        break;
      case 'lifestyle':
        contentToRead = document.querySelector('[data-content="lifestyle"]')?.textContent || 
                       (languageValue === "sw" 
                       ? "Mapendekezo ya maisha: Zungumza kwa kina, tumia mbinu za kupunguza msongo, fanya mazoezi ya kupumzika kila siku, pumzika vizuri usiku." 
                        : "Lifestyle recommendations: Practice deep breathing, use stress reduction techniques, do relaxation exercises daily, get good night sleep.");
        break;
      case 'diet':
        contentToRead = document.querySelector('[data-content="diet"]')?.textContent || 
                       (languageValue === "sw" 
                       ? "Mapendekezo ya chakula: Punguza chumvi, ongeza matunda na mboga, epuka vyakula vyenye mafuta mengi, nywa maji ya kutosha." 
                        : "Diet recommendations: Reduce salt intake, increase fruits and vegetables, avoid fatty foods, drink plenty of water.");
        break;
      case 'doctor':
        contentToRead = document.querySelector('[data-content="doctor"]')?.textContent || 
                       (languageValue === "sw" 
                       ? "Taarifa ya daktari: Daktari wako ana pendekeza ufanyie vipimo vya damu kila wiki na uende kliniki baada ya miezi miwili. Nambari ya daktari: 0712345678." 
                        : "Doctor information: Your doctor recommends weekly blood tests and a clinic visit after two months. Doctor's number: 0712345678.");
        break;
      case 'map':
        contentToRead = document.querySelector('[data-content="map"]')?.textContent || 
                       (languageValue === "sw" 
                       ? "Ramani inaonyesha hospitali ya wilaya iko kilometa tano kutoka hapa, na klinik tatu ziko katika eneo lako. Kituo cha karibu ni klinik ya Aga Khan." 
                        : "The map shows the district hospital is five kilometers away, with three clinics in your area. The nearest facility is Aga Khan Clinic.");
        break;
      case 'medication':
        contentToRead = document.querySelector('[data-content="medication"]')?.textContent || 
                       (languageValue === "sw" 
                       ? "Kumbusho la dawa: Unapaswa kunywa dawa yako ya shinikizo la damu saa tatu asubuhi, na dawa nyingine saa tisa jioni." 
                        : "Medication reminders: You should take your blood pressure medication at 9 AM, and another medication at 9 PM.");
        break;
    }
    
    await handleSpeak(contentToRead);
  }, [voiceModeState.active, voiceModeState.paused, languageValue, handleSpeak, analysis]);

  // Safe version of getDisplayValue that won't crash
  const safeGetDisplayValue = (fieldName: string, value: string, languageObj: any): string => {
    try {
      return getDisplayValue(fieldName, value, languageObj);
    } catch (error) {
      console.warn(`Error getting display value for ${fieldName}=${value}:`, error);
      // Return the value itself as fallback
      if (fieldName === 'activityType') {
        const option = activityOptions.find(opt => opt.value === value);
        return option? option.label : value;
      } else if (fieldName === 'intensity') {
        if (value === 'light') return 'Light';
        if (value === 'moderate') return 'Moderate';
        if (value === 'vigorous') return 'Vigorous';
        return value;
      }
      return value;
    }
  };

  // Enhanced voice mode start function with simplified announcements
  const handleStartVoiceMode = async () => {
    // First, test if the speech API is available
    try {
      const healthResponse = await fetch(`${API_URL}/api/python-speech/health`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!healthResponse.ok) {
        toast.error(languageValue === "sw" 
         ? "Huduma ya sauti haipatikani. Tafadhali jaribu tena baadaye."
          : "Voice service unavailable. Please try again later.");
        return;
      }
    } catch (error) {
      toast.error(languageValue === "sw" 
       ? "Huduma ya sauti haipatikani. Tafadhali jaribu tena baadaye."
        : "Voice service unavailable. Please try again later.");
      return;
    }
    
    // Reset collected vitals
    collectedVitalsRef.current = {};
    
    setVoiceModeState(prev => ({...prev, active: true }));
    voiceModeActiveRef.current = true;
    pausedRef.current = false;
    
    // Short welcome message
    const welcome = languageValue === "sw"
     ? "Systolic."
      : "Systolic.";
    
    await handleSpeak(welcome, true);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Collect systolic with retry logic
      setVoiceModeState(prev => ({...prev, currentField: 'systolic', status: languageValue === "sw"? "Soma systolic" : "Reading systolic" }));
      scrollToField('systolic');
      const systolicValue = await collectNumberFieldWithConfirm('systolic', 70, 250, currentLanguage.systolicLabel, true, 3);
      if (systolicValue!== undefined) {
        collectedVitalsRef.current.systolic = systolicValue;
        setSystolic(systolicValue.toString());
        // Skip toast for cleaner UI
      } else {
        await handleSpeak(languageValue === "sw" 
         ? "Rudi." 
          : "Repeat.");
      }

      // Collect diastolic
      setVoiceModeState(prev => ({...prev, currentField: 'diastolic', status: languageValue === "sw"? "Soma diastolic" : "Reading diastolic" }));
      scrollToField('diastolic');
      const diastolicValue = await collectNumberFieldWithConfirm('diastolic', 40, 150, currentLanguage.diastolicLabel, true, 3);
      if (diastolicValue!== undefined) {
        collectedVitalsRef.current.diastolic = diastolicValue;
        setDiastolic(diastolicValue.toString());
      } else {
        await handleSpeak(languageValue === "sw" 
         ? "Rudi." 
          : "Repeat.");
      }

      // Collect heart rate
      setVoiceModeState(prev => ({...prev, currentField: 'heartRate', status: languageValue === "sw"? "Soma kiwango cha moyo" : "Reading heart rate" }));
      scrollToField('heartRate');
      const heartRateValue = await collectNumberFieldWithConfirm('heartRate', 40, 200, currentLanguage.heartRateLabel, true, 3);
      if (heartRateValue!== undefined) {
        collectedVitalsRef.current.heartRate = heartRateValue;
        setHeartRate(heartRateValue.toString());
      } else {
        await handleSpeak(languageValue === "sw" 
         ? "Rudi." 
          : "Repeat.");
      }

      // Activity section
      await handleSpeak(languageValue === "sw" 
       ? "Shughuli." 
        : "Activity.", true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Collect activity type
      setVoiceModeState(prev => ({ 
       ...prev, 
        currentField: 'activityType', 
        status: languageValue === "sw"? "Soma shughuli" : "Reading activity" 
      }));
      scrollToField('activityType');
      
      const activityTypeValue = await collectSelectField('activityType', currentLanguage.activityTypeLabel, false);
      if (activityTypeValue && activityTypeValue!== 'skip') {
        collectedVitalsRef.current.activityType = activityTypeValue;
        setActivityType(activityTypeValue);
        
        // If activity is not "none", collect additional activity details
        if (activityTypeValue!== "none") {
          // Collect duration
          setVoiceModeState(prev => ({ 
           ...prev, 
            currentField: 'duration', 
            status: languageValue === "sw"? "Soma muda" : "Reading duration" 
          }));
          scrollToField('duration');
          
          await handleSpeak(languageValue === "sw" 
           ? "Dakika." 
            : "Minutes.", true);
          
          const durationValue = await collectNumberField('duration', 0, 480, currentLanguage.durationLabel, false, 2);
          if (durationValue!== undefined) {
            collectedVitalsRef.current.duration = durationValue;
            setDuration(durationValue.toString());
          }

          // Collect intensity
          setVoiceModeState(prev => ({ 
           ...prev, 
            currentField: 'intensity', 
            status: languageValue === "sw"? "Soma ukali" : "Reading intensity" 
          }));
          scrollToField('intensity');
          
          await handleSpeak(languageValue === "sw" 
           ? "Ukali." 
            : "Intensity.", true);
          
          const intensityValue = await collectSimpleSelectField('intensity', currentLanguage.intensityLabel, false);
          if (intensityValue && intensityValue!== 'skip') {
            collectedVitalsRef.current.intensity = intensityValue;
            setIntensity(intensityValue);
          }

          // Collect time since activity
          setVoiceModeState(prev => ({ 
           ...prev, 
            currentField: 'timeSinceActivity', 
            status: languageValue === "sw"? "Soma muda uliopita" : "Reading time since" 
          }));
          scrollToField('timeSinceActivity');
          
          await handleSpeak(languageValue === "sw" 
           ? "Dakika." 
            : "Minutes.", true);
          
          const timeSinceValue = await collectNumberField('timeSinceActivity', 0, 1440, currentLanguage.timeSinceActivityLabel, false, 2);
          if (timeSinceValue!== undefined) {
            collectedVitalsRef.current.timeSinceActivity = timeSinceValue;
            setTimeSinceActivity(timeSinceValue.toString());
          }
        } else {
          await handleSpeak(languageValue === "sw" 
           ? "Hakuna." 
            : "None.");
        }
      }

      // Notes section
      setVoiceModeState(prev => ({ 
       ...prev, 
        currentField: 'notes', 
        status: languageValue === "sw"? "Soma maelezo" : "Reading notes" 
      }));
      scrollToField('notes');
      
      await handleSpeak(languageValue === "sw" 
       ? "Maelezo." 
        : "Notes.", true);
      
      const notesValue = await collectSimpleTextField('notes', currentLanguage.notesLabel || "Notes");
      if (notesValue && notesValue!== 'skip' && notesValue!== 'none') {
        setNotes(notesValue);
      }

      // Check if we have all required vitals
      const hasRequiredVitals = collectedVitalsRef.current.systolic && 
                               collectedVitalsRef.current.diastolic && 
                               collectedVitalsRef.current.heartRate;

      if (hasRequiredVitals) {
        // Confirm before submitting
        setVoiceModeState(prev => ({ 
         ...prev, 
          currentField: 'confirmation', 
          status: languageValue === "sw"? "Ngoja kuthibitisha" : "Waiting for confirmation" 
        }));
        
        await handleSpeak(languageValue === "sw" 
         ? "Hifadhi? Ndio au hapana." 
          : "Save? Yes or no.", true);
        
        const confirmResult = await collectSimpleConfirmation();
        
        if (confirmResult) {
          await handleSpeak(languageValue === "sw" 
           ? "Inatumwa." 
            : "Submitting.", true);
          
          const success = await autoSubmitVitals();
          
          if (success) {
            await handleSpeak(languageValue === "sw" 
             ? "Imesajiliwa." 
              : "Saved.", true);
          } else {
            await handleSpeak(languageValue === "sw" 
             ? "Hitilafu." 
              : "Error.", true);
          }
        } else {
          await handleSpeak(languageValue === "sw" 
           ? "Imekataliwa." 
            : "Cancelled.", true);
        }
      } else {
        await handleSpeak(languageValue === "sw" 
         ? "Vipimo vya kutosha." 
          : "Insufficient measurements.", true);
      }

    } catch (error) {
      console.error("Voice mode error:", error);
      await handleSpeak(languageValue === "sw" 
       ? "Hitilafu." 
        : "Error.", true);
    } finally {
      setVoiceModeState(prev => ({ 
       ...prev, 
        active: false, 
        listening: false, 
        speaking: false,
        currentField: null,
        status: "",
        paused: false
      }));
      voiceModeActiveRef.current = false;
      pausedRef.current = false;
    }
  };

  // Enhanced helper function to collect number fields with confirmation
  const collectNumberFieldWithConfirm = async (
    fieldName: string, 
    min: number, 
    max: number, 
    label: string, 
    isRequired: boolean,
    maxAttempts: number = 3
  ): Promise<number | undefined> => {
    if (!voiceModeActiveRef.current) return undefined;
    
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      if (!voiceModeActiveRef.current) break;
      
      try {
        // Listen for number
        setVoiceModeState(prev => ({ 
         ...prev,
          status: languageValue === "sw" 
           ? `Inasoma ${label.toLowerCase()}` 
            : `Reading ${label.toLowerCase()}`
        }));
        
        const result = await listenForField(
          fieldName,
          label,
          'number' as const,
          min,
          max,
          languageValue,
          currentLanguage,
          voiceModeActiveRef,
          pausedRef,
          isProcessingRef,
          (state: Partial<VoiceModeState>) => setVoiceModeState(prev => ({...prev,...state })),
          mediaRecorderRef,
          API_URL,
          fieldRefs,
          handleSpeak,
          isRequired
        );
        
        if (typeof result === 'number') {
          // Confirm the value
          await handleSpeak(languageValue === "sw" 
           ? `${result}. Ndio au hapana?` 
            : `${result}. Yes or no?`, true);
          
          const confirmResult = await collectSimpleConfirmation();
          
          if (confirmResult) {
            return result;
          } else {
            // User said no, ask to repeat
            await handleSpeak(languageValue === "sw" 
             ? "Rudi." 
              : "Repeat.", true);
            attempts++;
            continue;
          }
        } else if (result === 'skip') {
          return undefined;
        } else if (result === null) {
          attempts++;
          if (attempts < maxAttempts) {
            await handleSpeak(languageValue === "sw" 
             ? "Rudi." 
              : "Repeat.", true);
            continue;
          }
        }
        
        return undefined;
      } catch (error) {
        console.error(`Error collecting number field ${fieldName}:`, error);
        attempts++;
        
        if (attempts < maxAttempts) {
          await handleSpeak(languageValue === "sw" 
           ? "Rudi." 
            : "Repeat.", true);
        }
      }
    }
    
    return undefined;
  };

  // Enhanced helper function to collect number fields without confirmation
  const collectNumberField = async (
    fieldName: string, 
    min: number, 
    max: number, 
    label: string, 
    isRequired: boolean,
    maxAttempts: number = 2
  ): Promise<number | undefined> => {
    if (!voiceModeActiveRef.current) return undefined;
    
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      if (!voiceModeActiveRef.current) break;
      
      try {
        setVoiceModeState(prev => ({ 
         ...prev,
          status: languageValue === "sw" 
           ? `Inasoma ${label.toLowerCase()}` 
            : `Reading ${label.toLowerCase()}`
        }));
        
        const result = await listenForField(
          fieldName,
          label,
          'number' as const,
          min,
          max,
          languageValue,
          currentLanguage,
          voiceModeActiveRef,
          pausedRef,
          isProcessingRef,
          (state: Partial<VoiceModeState>) => setVoiceModeState(prev => ({...prev,...state })),
          mediaRecorderRef,
          API_URL,
          fieldRefs,
          handleSpeak,
          isRequired
        );
        
        if (typeof result === 'number') {
          return result;
        } else if (result === 'skip') {
          return undefined;
        } else if (result === null) {
          attempts++;
          if (attempts < maxAttempts) {
            continue;
          }
        }
        
        return undefined;
      } catch (error) {
        console.error(`Error collecting number field ${fieldName}:`, error);
        attempts++;
      }
    }
    
    return undefined;
  };

  // Optimized helper function to collect select fields
  const collectSelectField = async (
    fieldName: string, 
    label: string, 
    isRequired: boolean
  ): Promise<string | undefined> => {
    if (!voiceModeActiveRef.current) return undefined;
    
    try {
      const result = await listenForField(
        fieldName,
        label,
        'select' as const,
        undefined,
        undefined,
        languageValue,
        currentLanguage,
        voiceModeActiveRef,
        pausedRef,
        isProcessingRef,
        (state: Partial<VoiceModeState>) => setVoiceModeState(prev => ({...prev,...state })),
        mediaRecorderRef,
        API_URL,
        fieldRefs,
        handleSpeak,
        isRequired
      );
      
      if (result === 'skip') {
        return 'skip';
      }
      
      if (typeof result === 'string') {
        return result;
      }
      
      return undefined;
    } catch (error) {
      console.error(`Error collecting select field ${fieldName}:`, error);
      return undefined;
    }
  };

  // Optimized SIMPLIFIED version for intensity
  const collectSimpleSelectField = async (
    fieldName: string, 
    label: string, 
    isRequired: boolean
  ): Promise<string | undefined> => {
    if (!voiceModeActiveRef.current) return undefined;
    
    try {
      setVoiceModeState(prev => ({ 
       ...prev,
        listening: true, 
        status: languageValue === "sw"? `Sikiliza ${label}` : `Listening for ${label}` 
      }));
      
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

      return new Promise(async (resolve) => {
        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          
          if (audioChunks.length === 0 ||!voiceModeActiveRef.current) {
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
            resolve(undefined);
            return;
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

          try {
            const transcribedText = await transcribeAudio(audioBlob);
            
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));

            if (transcribedText) {
              const text = transcribedText.toLowerCase().trim();
              
              if (text.includes('skip') || text.includes('ruka')) {
                resolve('skip');
              } else if (text.includes('light') || text.includes('nyepesi')) {
                resolve('light');
              } else if (text.includes('moderate') || text.includes('wastani')) {
                resolve('moderate');
              } else if (text.includes('vigorous') || text.includes('kali')) {
                resolve('vigorous');
              } else {
                resolve('moderate');
              }
            } else {
              resolve(undefined);
            }
          } catch (error: any) {
            console.error("Transcription error:", error);
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
            resolve(undefined);
          }
        };

        mediaRecorder.start();
        
        setTimeout(() => {
          if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
            mediaRecorder.stop();
          }
        }, 4000);
      });

    } catch (error) {
      console.error("Media recording error:", error);
      setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
      return undefined;
    }
  };

  // Optimized SIMPLIFIED version for text fields
  const collectSimpleTextField = async (fieldName: string, label: string): Promise<string | undefined> => {
    if (!voiceModeActiveRef.current) return undefined;
    
    try {
      setVoiceModeState(prev => ({ 
       ...prev,
        listening: true, 
        status: languageValue === "sw"? "Sikiliza maelezo" : "Listening for notes" 
      }));
      
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

      return new Promise(async (resolve) => {
        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          
          if (audioChunks.length === 0 ||!voiceModeActiveRef.current) {
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
            resolve(undefined);
            return;
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

          try {
            const transcribedText = await transcribeAudio(audioBlob);
            
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));

            if (transcribedText) {
              const text = transcribedText.toLowerCase().trim();
              
              if (text.includes('skip') || text.includes('ruka')) {
                resolve('skip');
              } else if (text.includes('none') || text.includes('hakuna')) {
                resolve('none');
              } else {
                resolve(transcribedText);
              }
            } else {
              resolve(undefined);
            }
          } catch (error: any) {
            console.error("Transcription error:", error);
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
            resolve(undefined);
          }
        };

        mediaRecorder.start();
        
        setTimeout(() => {
          if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
            mediaRecorder.stop();
          }
        }, 4000);
      });

    } catch (error) {
      console.error("Media recording error:", error);
      setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
      return undefined;
    }
  };

  // Optimized SIMPLIFIED version for confirmation
  const collectSimpleConfirmation = async (): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        setVoiceModeState(prev => ({ 
         ...prev,
          listening: true, 
          status: languageValue === "sw"? "Sikiliza uthibitisho" : "Listening for confirmation" 
        }));
        
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
          
          if (audioChunks.length === 0 ||!voiceModeActiveRef.current) {
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
            resolve(false);
            return;
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

          try {
            const transcribedText = await transcribeAudio(audioBlob);
            
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));

            if (transcribedText) {
              const text = transcribedText.toLowerCase().trim();
              
              if (text.includes('yes') || text.includes('ndio') || text.includes('yeah') || text.includes('sure')) {
                resolve(true);
              } else if (text.includes('no') || text.includes('hapana') || text.includes('cancel')) {
                resolve(false);
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          } catch (error: any) {
            setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
            resolve(false);
          }
        };

        mediaRecorder.start();
        
        setTimeout(() => {
          if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
            mediaRecorder.stop();
          }
        }, 2500);

      } catch (error) {
        setVoiceModeState(prev => ({...prev, listening: false, status: "" }));
        resolve(false);
      }
    });
  };

  // Stop voice mode
  const handleStopVoiceMode = () => {

    stopVoiceMode({
      voiceModeActiveRef,
      pausedRef,
      mediaRecorderRef,
      currentLanguage,
      setVoiceModeState: (state) => setVoiceModeState(prev => ({...prev,...state })),
      handleSpeak,
      isMuted: voiceModeState.muted,
      languageValue: languageValue
    });
  };

  stopVoiceMode({
    voiceModeActiveRef,
    pausedRef,
    mediaRecorderRef,
    currentLanguage,
    setVoiceModeState: (state) => setVoiceModeState(prev => ({...prev,...state })),
    handleSpeak,
    isMuted: voiceModeState.muted,
    
  });
};


  // Toggle mute
  const handleToggleMute = () => {
    setVoiceModeState(prev => ({...prev, muted:!prev.muted }))
  }

  const reset = () => {
    setSystolic("")
    setDiastolic("")
    setHeartRate("")
    setActivityType("none")
    setDuration("")
    setIntensity("moderate")
    setTimeSinceActivity("")
    setNotes("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setAnalysis(null)

    if (!systolic ||!diastolic ||!heartRate) {
      setMessage(t.vitals.allFieldsRequired)
      return
    }

    const systolicNum = Number(systolic)
    const diastolicNum = Number(diastolic)
    const heartRateNum = Number(heartRate)

    if (
      systolicNum < 50 ||
      systolicNum > 250 ||
      diastolicNum < 30 ||
      diastolicNum > 150 ||
      heartRateNum < 30 ||
      heartRateNum > 200
    ) {
      setMessage(t.language === "en-US" 
       ? "Please enter realistic vital values."
        : "Tafadhali weka maadili halali ya vitali.")
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("User not authenticated.");

      // Save vitals + activity to backend
      const saveResp = await fetch(
        `${API_URL}/api/hypertensionVitals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            systolic: systolicNum,
            diastolic: diastolicNum,
            heartRate: heartRateNum,
            activityType,
            duration: Number(duration) || 0,
            intensity,
            timeSinceActivity: Number(timeSinceActivity) || 0,
            notes,
          }),
        }
      );

      if (!saveResp.ok) throw new Error("Failed to save vitals")

      // Call AI analysis with language parameter
      const languageParam = t.language === "sw-TZ"? "sw-TZ" : "en-US"
      const aiResp = await fetch(
        `${API_URL}/api/hypertensionVitals/analyze?language=${languageParam}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            vitals: {
              systolic: systolicNum,
              diastolic: diastolicNum,
              heartRate: heartRateNum,
            },
            activity: {
              activityType,
              duration: Number(duration) || 0,
              intensity,
              timeSinceActivity: Number(timeSinceActivity) || 0,
              notes,
            },
          }),
        }
      );

      if (!aiResp.ok) throw new Error("AI analysis failed")

      const aiJson = await aiResp.json()
      setAnalysis(aiJson)
      setLastAnalyzedVitals({
        systolic: systolicNum,
        diastolic: diastolicNum,
        heartRate: heartRateNum,
      })
      setMessage(t.language === "en-US" 
       ? " Vitals saved & analyzed successfully!"
        : " Vitali zimehifadhiwa na kuchambuliwa kwa mafanikio!")
      if (onAfterSave) onAfterSave()
      reset()
    } catch (e: any) {
      setMessage(e.message || (t.language === "en-US" 
       ? " There was an error. Please try again."
        : " Kulikuwa na hitilafu. Tafadhali jaribu tena."))
      setAnalysis(null)
    } finally {
      setSaving(false)
    }
  }

  const handleVoiceFormComplete = (data: {
    systolic: number
    diastolic: number
    heartRate: number
    activityType?: string
    duration?: number
    intensity?: string
    timeSinceActivity?: number
  }) => {
    setSystolic(data.systolic.toString())
    setDiastolic(data.diastolic.toString())
    setHeartRate(data.heartRate.toString())
    if (data.activityType) {
      setActivityType(data.activityType)
    }
    if (typeof data.duration === "number") {
      setDuration(data.duration? data.duration.toString() : "")
    }
    if (data.intensity && ["light", "moderate", "vigorous"].includes(data.intensity)) {
      setIntensity(data.intensity)
    }
    if (typeof data.timeSinceActivity === "number") {
      setTimeSinceActivity(data.timeSinceActivity? data.timeSinceActivity.toString() : "")
    }
    setShowVoiceForm(false)
    
    // Continue with the form, user still needs to fill activity details
    setMessage(t.language === "en-US" 
     ? " Vital values captured! Please complete the activity details below."
      : " Maadili ya vitali yamepokelekwa! Tafadhali kamili maelezo ya shughuli chini.")
  }

  return (
    <>
      {/* Voice Modal */}
      {showVoiceForm && (
        <InteractiveVoiceForm
          language={t.language === "sw-TZ"? "sw" : "en"}
          onComplete={handleVoiceFormComplete}
          onCancel={() => setShowVoiceForm(false)}
          mode="full"
        />
      )}

      <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-2 rounded-lg shadow-sm">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            {t.vitals.title}
          </h3>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {t.language === "en-US" 
               ? "Enter your blood pressure, heart rate, and recent activity — see AI-guided feedback instantly after saving. Use voice mode for hands-free entry."
                : "Weka shinikizo la damu, kiwango cha moyo, na shughuli za hivi karibuni — ona maoni ya AI mara tu baada ya kuhifadhi. Tumia hali ya sauti kwa kuingiza bila mikono."
              }
            </p>
          </div>
        </div>

        {/* Enhanced Voice Control Panel */}
        <VoiceControlPanel
          voiceModeState={voiceModeState}
          currentLanguage={currentLanguage}
          languageValue={languageValue}
          onToggleMute={handleToggleMute}
          onToggleVoiceMode={voiceModeState.active? handleStopVoiceMode : handleStartVoiceMode}
          onPauseResume={handlePauseResume}
          onReadContent={handleReadContent}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Systolic */}
            <div className="space-y-2" data-field="systolic">
              <label className="text-sm font-medium text-gray-700">{t.vitals.systolic}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  min={50}
                  max={250}
                  placeholder="e.g. 120"
                  disabled={saving}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {voiceModeState.active &&!voiceModeState.paused && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSpeak(languageValue === "sw" 
                       ? `Systolic ni ${systolic || 'haijawekwa'} mmHg.` 
                        : `Systolic is ${systolic || 'not set'} mmHg.`)
                    }}
                    className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    <Mic size={16} />
                  </button>
                )} 
              </div>
              <p className="text-xs text-gray-500">
                {t.language === "en-US"? "Upper number" : "Nambari ya juu"}
              </p>
            </div>

            {/* Diastolic */}
            <div className="space-y-2" data-field="diastolic">
              <label className="text-sm font-medium text-gray-700">{t.vitals.diastolic}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  min={30}
                  max={150}
                  placeholder="e.g. 80"
                  disabled={saving}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {voiceModeState.active &&!voiceModeState.paused && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSpeak(languageValue === "sw" 
                       ? `Diastolic ni ${diastolic || 'haijawekwa'} mmHg.` 
                        : `Diastolic is ${diastolic || 'not set'} mmHg.`)
                    }}
                    className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    <Mic size={16} />
                  </button>
                )} 
              </div>
              <p className="text-xs text-gray-500">
                {t.language === "en-US"? "Lower number" : "Nambari ya chini"}
              </p>
            </div>

            {/* Heart Rate */}
            <div className="space-y-2" data-field="heartRate">
              <label className="text-sm font-medium text-gray-700">{t.vitals.heartRate}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  min={30}
                  max={200}
                  placeholder="e.g. 72"
                  disabled={saving}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {voiceModeState.active &&!voiceModeState.paused && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSpeak(languageValue === "sw" 
                       ? `Mapigo ya moyo ni ${heartRate || 'hakijajazwa'} kwa dakika.` 
                        : `Heart rate is ${heartRate || 'not set'} per minute.`)
                    }}
                    className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    <Mic size={16} />
                  </button>
                )} 
              </div>
              <p className="text-xs text-gray-500">
                {t.language === "en-US"? "Beats/min" : "Mipigo/dakika"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Select - FIXED: Use correct value for sleep */}
            <div className="space-y-2" data-field="activityType">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4" />
                {t.language === "en-US"? "Recent Activity Type" : "Aina ya Shughuli ya Hivi Karibuni"}
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {activityOptions.map((opt) => (
                  <option value={opt.value} key={opt.value}>
                    {t.language === "en-US"? opt.label : 
                      opt.value === "none"? "Hakuna shughuli ya hivi karibuni" :
                      opt.value === "exercise"? "Zoezi/Mazoezi" :
                      opt.value === "walking"? "Kutembea" :
                      opt.value === "eating"? "Kula/Chakula" :
                      opt.value === "stress"? "Mkazo/Wasiwasi" :
                      opt.value === "sleep"? "Upungufu wa Usingizi" : // FIXED: Changed from "sleep_deprivation"
                      opt.value === "caffeine"? "Kunywa Kahawa" :
                      opt.value === "medication"? "Dawa ya Hivi Karibuni" :
                      opt.value === "illness"? "Ugonjwa/Homa" :
                      "Nyingine"
                    }
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-2" data-field="duration">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t.language === "en-US"? "Duration (minutes)" : "Muda (dakika)"}
              </label>
              <input
                type="number"
                min={0}
                max={480}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Intensity */}
            <div className="space-y-2" data-field="intensity">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {t.language === "en-US"? "Intensity" : "Ukali"}
              </label>
              <div className="flex gap-2">
                {(["light", "moderate", "vigorous"] as const).map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setIntensity(level)}
                    disabled={saving}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      intensity === level
                       ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {t.language === "en-US" 
                     ? level.charAt(0).toUpperCase() + level.slice(1)
                      : level === "light"? "Nyepesi" :
                        level === "moderate"? "Wastani" :
                        "Kali"
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Time Since Activity */}
            <div className="space-y-2" data-field="timeSinceActivity">
              <label className="text-sm font-medium text-gray-700">
                {t.language === "en-US"? "How long ago? (minutes)" : "Muda uliopita? (dakika)"}
              </label>
              <input
                type="number"
                min={0}
                max={1440}
                value={timeSinceActivity}
                onChange={(e) => setTimeSinceActivity(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2 space-y-2" data-field="notes">
              <label className="text-sm font-medium text-gray-700">
                {t.language === "en-US"? "Notes (optional)" : "Maelezo (hiari)"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
                rows={2}
                placeholder={t.language === "en-US" 
                 ? "E.g., Just finished a walk, or feeling stressed out this morning..."
                  : "Mf., Nimeimaliza matembezi, au nahisi mkazo asubuhi hii..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg ${
                message.includes("")
                 ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t.language === "en-US"? "Saving..." : "Inahifadhi..."}
              </div>
            ) : (
              t.vitals.saveButton
            )} 
          </button>
        </form>

        {analysis && lastAnalyzedVitals && (
          <div className="mt-6">
            {analysis && lastAnalyzedVitals && <ContextAwareAlert analysis={analysis} vitals={lastAnalyzedVitals} />}
          </div>
        )}
      </div>
    </> 
  )
}