"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Check, X, Loader2, Activity } from "lucide-react";
import { toast } from "react-hot-toast";

interface InteractiveVoiceFormProps {
  language: "en" | "sw";
  onComplete: (data: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    activityType?: string;
    duration?: number;
    intensity?: string;
    timeSinceActivity?: number;
  }) => void;
  onCancel: () => void;
  mode?: "vitals" | "full";
}

interface BaseField {
  name: string;
  label: { en: string; sw: string };
  prompt: { en: string; sw: string };
  min?: number;
  max?: number;
  unit?: string;
  options?: { en: string[]; sw: string[] };
}

interface VitalField extends BaseField {
  name: "systolic" | "diastolic" | "heartRate";
  min: number;
  max: number;
  unit: string;
}

interface ActivityField extends BaseField {
  name: "activityType" | "duration" | "intensity" | "timeSinceActivity";
  options?: { en: string[]; sw: string[] };
}

const VITAL_FIELDS: VitalField[] = [
  {
    name: "systolic",
    label: { en: "Systolic Blood Pressure", sw: "Shinikizo la Damu Systolic" },
    prompt: { 
      en: "Please say your systolic blood pressure. For example, one hundred thirty", 
      sw: "Tafadhali sema shinikizo lako la damu systolic. Kwa mfano, mia moja thelathini" 
    },
    min: 70,
    max: 250,
    unit: "mmHg"
  },
  {
    name: "diastolic",
    label: { en: "Diastolic Blood Pressure", sw: "Shinikizo la Damu Diastolic" },
    prompt: { 
      en: "Please say your diastolic blood pressure. For example, eighty", 
      sw: "Tafadhali sema shinikizo lako la damu diastolic. Kwa mfano, themanini" 
    },
    min: 40,
    max: 150,
    unit: "mmHg"
  },
  {
    name: "heartRate",
    label: { en: "Heart Rate", sw: "Mapigo ya Moyo" },
    prompt: { 
      en: "Please say your heart rate in beats per minute. For example, seventy two", 
      sw: "Tafadhali sema mapigo ya moyo yako kwa dakika. Kwa mfano, sabini na mbili" 
    },
    min: 30,
    max: 220,
    unit: "bpm"
  }
];

const ACTIVITY_FIELDS: ActivityField[] = [
  {
    name: "activityType",
    label: { en: "Activity Type", sw: "Aina ya Shughuli" },
    prompt: { 
      en: "What activity did you do recently? Say exercise, walking, eating, stress, sleep, caffeine, medication, illness, or none.", 
      sw: "Shughuli gani ulifanya hivi karibuni? Sema zoezi, kutembea, kula, mkazo, usingizi, kafeini, dawa, ugonjwa, au hapuna." 
    },
    options: { 
      en: ["exercise", "walking", "eating", "stress", "sleep", "caffeine", "medication", "illness", "none"],
      sw: ["zoezi", "kutembea", "kula", "mkazo", "usingizi", "kafeini", "dawa", "ugonjwa", "hapuna"]
    }
  },
  {
    name: "duration",
    label: { en: "Duration", sw: "Muda" },
    prompt: { 
      en: "How many minutes did the activity last? Say zero if unsure.", 
      sw: "Muda gani dakika? Sema sifuri usijui." 
    },
    min: 0,
    max: 480,
    unit: "minutes"
  },
  {
    name: "intensity",
    label: { en: "Intensity", sw: "Ukali" },
    prompt: { 
      en: "How intense was the activity? Say light, moderate, or vigorous.", 
      sw: "Ukali wa shughuli ulikuwa gani? Sema nyepesi, wastani, kali." 
    },
    options: { 
      en: ["light", "moderate", "vigorous"],
      sw: ["nyepesi", "wastani", "kali"]
    }
  },
  {
    name: "timeSinceActivity",
    label: { en: "Time Since Activity", sw: "Muda Uliopita" },
    prompt: { 
      en: "How many minutes ago did you finish the activity? Say zero if unsure.", 
      sw: "Dakika ngapi ulizokamilisha shughuli? Sema sifuri usijui." 
    },
    min: 0,
    max: 1440,
    unit: "minutes"
  }
];

const InteractiveVoiceForm: React.FC<InteractiveVoiceFormProps> = ({
  language,
  onComplete,
  onCancel,
  mode = "vitals"
}) => {
  const [currentSection, setCurrentSection] = useState<"vitals" | "activity">("vitals");
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [values, setValues] = useState<{
    systolic: number | null;
    diastolic: number | null;
    heartRate: number | null;
    activityType: string;
    duration: number | null;
    intensity: string;
    timeSinceActivity: number | null;
  }>({
    systolic: null,
    diastolic: null,
    heartRate: null,
    activityType: "none",
    duration: null,
    intensity: "moderate",
    timeSinceActivity: null
  });
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastValue, setLastValue] = useState<number | string | null>(null);
  const [started, setStarted] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const currentFields = currentSection === "vitals" ? VITAL_FIELDS : ACTIVITY_FIELDS;
  const currentField = currentFields[currentFieldIndex];
  const isLastField = currentFieldIndex === currentFields.length - 1;
  const isLastSection = currentSection === "activity" && isLastField;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech function
  const speak = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        setIsSpeaking(true);
        
        // Stop any current speech
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language
        utterance.lang = language === "sw" ? "sw-KE" : "en-US";
        
        // Get available voices
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(language === "sw" ? "sw" : "en")
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Configure speech
        utterance.rate = 0.85; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };

        utterance.onerror = (error) => {
          console.error("Speech error:", error);
          setIsSpeaking(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);

      } catch (error) {
        console.error("❌ TTS Error:", error);
        setIsSpeaking(false);
        resolve();
      }
    });
  };

  // Speech-to-Text function using Grok API
  const listen = async (): Promise<number | string | null> => {
    return new Promise(async (resolve) => {
      try {
        setIsListening(true);

        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          }
        });

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 256000
        });

        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());

          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

          if (audioBlob.size < 1000) {
            setIsListening(false);
            resolve(null);
            return;
          }

          // Send to backend
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          formData.append("language", language);

          try {
            const response = await fetch(`${API_URL}/api/speech/stt`, {
              method: "POST",
              body: formData
            });

            const data = await response.json();
            setIsListening(false);

            if (data.success && data.text && currentField) {
              // Handle different field types
              if ('options' in currentField && currentField.options) {
                // For selection fields, match the input to available options
                const text = data.text.toLowerCase().trim();
                const options = currentField.options[language];
                
                // Try to find a match
                // Speech-to-Text function using Grok API
const listen = async (): Promise<number | string | null> => {
  return new Promise(async (resolve) => {
    try {
      setIsListening(true);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 256000
      });

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        if (audioBlob.size < 1000) {
          setIsListening(false);
          resolve(null);
          return;
        }

        // Send to backend
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", language);

        try {
          const response = await fetch(`${API_URL}/api/speech/stt`, {
            method: "POST",
            body: formData
          });

          const data = await response.json();
          setIsListening(false);

          if (data.success && data.text && currentField) {
            // Handle different field types
            if ('options' in currentField && currentField.options) {
              // For selection fields, match the input to available options
              const text = data.text.toLowerCase().trim();
              const options = currentField.options[language];
              
              // Try to find a match with proper null checks
              for (let i = 0; i < options.length; i++) {
                const option = options[i];
                if (option && text.includes(option.substring(0, 3))) {
                  resolve(option);
                  return;
                }
              }
              
              // If no match found, return null for retry
              resolve(null);
              return;
            } else if ('min' in currentField && 'max' in currentField && 
                     currentField.min !== undefined && currentField.max !== undefined) {
              // For numeric fields
              const number = parseInt(data.text.trim(), 10);
              if (!isNaN(number) && number >= currentField.min && number <= currentField.max) {
                resolve(number);
              } else {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error("STT Error:", error);
          setIsListening(false);
          resolve(null);
        }
      };

      // Record for 3 seconds
      mediaRecorder.start(100);
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 3000);

    } catch (error) {
      console.error("❌ Listen Error:", error);
      setIsListening(false);
      toast.error(
        language === "sw" 
          ? "Imeshindwa kupata maikrofoni" 
          : "Failed to access microphone"
      );
      resolve(null);
    }
  });
};
                
                // If no match found, return null for retry
                resolve(null);
                return;
              } else if ('min' in currentField && 'max' in currentField && 
                       currentField.min !== undefined && currentField.max !== undefined) {
                // For numeric fields
                const number = parseInt(data.text.trim(), 10);
                if (!isNaN(number) && number >= currentField.min && number <= currentField.max) {
                  resolve(number);
                } else {
                  resolve(null);
                }
              } else {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error("STT Error:", error);
            setIsListening(false);
            resolve(null);
          }
        };

        // Record for 3 seconds
        mediaRecorder.start(100);
        
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, 3000);

      } catch (error) {
        console.error("❌ Listen Error:", error);
        setIsListening(false);
        toast.error(
          language === "sw" 
            ? "Imeshindwa kupata maikrofoni" 
            : "Failed to access microphone"
        );
        resolve(null);
      }
    });
  };

  // Start the voice-guided process
  const startVoiceInput = async () => {
    setStarted(true);
    await speakSectionIntro();
  };

  // Speak section introduction
  const speakSectionIntro = async () => {
    if (currentSection === "vitals") {
      const intro = language === "sw" 
        ? "Tutaanza kwa kufafanua vipimo vya shinikizo la damu na mapigo ya moyo. Tafadhali jiulize maswali yote."
        : "We'll start with your blood pressure and heart rate measurements. Please answer all questions.";
      await speak(intro);
    } else {
      const intro = language === "sw" 
        ? "Sasa tutafafanua shughuli zako za hivi karibuni. Tafadhali jiulize maswali yote."
        : "Now we'll capture your recent activities. Please answer all questions.";
      await speak(intro);
    }
    
    setTimeout(() => promptCurrentField(), 2000);
  };

  // Prompt user for current field
  const promptCurrentField = async () => {
    const field = currentFields[currentFieldIndex];
    if (!field) return;

    const promptText = field.prompt[language];
    
    await speak(promptText);
    
    // Wait for speech to finish, then start listening
    setTimeout(async () => {
      const value = await listen();
      
      if (value !== null && currentField) {
        // Validate range (for numeric fields)
        if ('min' in field && 'max' in field && field.min !== undefined && field.max !== undefined) {
          const numValue = typeof value === 'number' ? value : parseInt(value as string, 10);
          if (!isNaN(numValue) && numValue >= field.min && numValue <= field.max) {
            await confirmValue(value);
          } else {
            const errorMsg = language === "sw"
              ? `Nambari hii si sahihi. Tafadhali sema nambari kati ya ${field.min} na ${field.max}.`
              : `That number is not valid. Please say a number between ${field.min} and ${field.max}.`;
            
            await speak(errorMsg);
            setTimeout(() => promptCurrentField(), 2000);
          }
        } else {
          // For selection fields, just confirm
          await confirmValue(value);
        }
      } else {
        const errorMsg = language === "sw"
          ? "Sikuelewe. Tafadhali jaribu tena."
          : "I didn't understand. Please try again.";
        
        await speak(errorMsg);
        setTimeout(() => promptCurrentField(), 2000);
      }
    }, 500);
  };

  // Confirm value with user
  const confirmValue = async (value: number | string) => {
    setLastValue(value);
    setConfirming(true);

    let confirmMsg = "";
    if (typeof value === 'number') {
      confirmMsg = language === "sw"
        ? `Je, ${value} ni sahihi? Bonyeza ndiyo au hapana.`
        : `Is ${value} correct? Press yes or no.`;
    } else {
      confirmMsg = language === "sw"
        ? `Je, ${value} ni sahihi? Bonyeza ndiyo au hapana.`
        : `Is ${value} correct? Press yes or no.`;
    }

    await speak(confirmMsg);
  };

  // Accept the value and move to next field
  const acceptValue = async () => {
    if (lastValue === null || !currentField) return;

    // Update values based on field type
    if (typeof lastValue === 'number' && ('min' in currentField && 'max' in currentField && 
       currentField.min !== undefined && currentField.max !== undefined)) {
      setValues(prev => ({ ...prev, [currentField.name]: lastValue }));
    } else {
      setValues(prev => ({ ...prev, [currentField.name]: lastValue }));
    }
    
    setConfirming(false);
    setLastValue(null);

    if (isLastField) {
      // Move to next section or complete
      if (currentSection === "vitals" && mode === "full") {
        // Move to activity section
        setCurrentSection("activity");
        setCurrentFieldIndex(0);
        setTimeout(() => speakSectionIntro(), 2000);
      } else {
        // Complete the form
        const completeMsg = language === "sw"
          ? "Asante sana! Kila kitimekamilika."
          : "Thank you! Everything is complete.";
        
        await speak(completeMsg);
        
        setTimeout(() => {
          onComplete({ 
            systolic: values.systolic || 0, 
            diastolic: values.diastolic || 0, 
            heartRate: values.heartRate || 0,
            activityType: values.activityType,
            duration: values.duration || 0,
            intensity: values.intensity,
            timeSinceActivity: values.timeSinceActivity || 0
          });
        }, 2000);
      }
    } else {
      // Move to next field
      const nextMsg = language === "sw"
        ? "Vizuri. Tuendelee."
        : "Good. Let's continue.";
      
      await speak(nextMsg);
      
      setTimeout(() => {
        setCurrentFieldIndex(prev => prev + 1);
        setTimeout(() => promptCurrentField(), 1000);
      }, 1500);
    }
  };

  // Retry the current value
  const retryValue = async () => {
    setConfirming(false);
    setLastValue(null);
    
    const retryMsg = language === "sw"
      ? "Sawa. Jaribu tena."
      : "Okay. Let's try again.";
    
    await speak(retryMsg);
    
    setTimeout(() => promptCurrentField(), 1500);
  };

  // Skip current section
  const skipSection = async () => {
    if (currentSection === "vitals" && mode === "full") {
      // Move to activity section
      setCurrentSection("activity");
      setCurrentFieldIndex(0);
      setTimeout(() => speakSectionIntro(), 2000);
    } else {
      // Complete the form
      const completeMsg = language === "sw"
        ? "Asante! Kitaendelea."
        : "Thank you! Let's proceed.";
      
      await speak(completeMsg);
      
      setTimeout(() => {
        onComplete({ 
          systolic: values.systolic || 0, 
          diastolic: values.diastolic || 0, 
          heartRate: values.heartRate || 0,
          activityType: values.activityType,
          duration: values.duration || 0,
          intensity: values.intensity,
          timeSinceActivity: values.timeSinceActivity || 0
        });
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-pink-600 rounded-full mb-3">
            <Mic className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {language === "sw" ? "Msaidizi wa Sauti" : "Voice Assistant"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {currentSection === "vitals" 
              ? (language === "sw" 
                  ? "Nitakusaidia kuweka vipimo vako vya shinikizo la damu na mapigo ya moyo"
                  : "I'll help you enter your blood pressure and heart rate measurements")
              : (language === "sw" 
                  ? "Nitakusaidia kufafanua shughuli zako za hivi karibuni"
                  : "I'll help you capture your recent activities")
            }
          </p>
        </div>

        {!started ? (
          /* Start Button */
          <div className="space-y-4">
            <button
              onClick={startVoiceInput}
              disabled={isSpeaking || isListening}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === "sw" ? "🎙️ Anza" : "🎙️ Start"}
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            >
              {language === "sw" ? "Ghairi" : "Cancel"}
            </button>
          </div>
        ) : (
          /* Voice Interaction UI */
          <div className="space-y-4">
            {/* Section and Progress */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>
                {currentSection === "vitals" 
                  ? (language === "sw" ? "Vipimo" : "Measurements")
                  : (language === "sw" ? "Shughuli" : "Activities")
                }
              </span>
              <span className="font-semibold">{currentField?.label[language]}</span>
              <span>{currentFieldIndex + 1} / {currentFields.length}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentFieldIndex + 1) / currentFields.length) * 100}%` }}
              />
            </div>

            {/* Section Separator */}
            {mode === "full" && currentSection === "vitals" && (
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500">
                  {language === "sw" ? "Shughuli zitafuata" : "Activities will follow"}
                </span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            )}

            {/* Current Value Display */}
            {lastValue !== null && confirming && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl text-center border-2 border-red-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {currentSection === "activity" && <Activity className="text-red-600" size={20} />}
                  <div className="text-4xl font-bold text-red-600">
                    {lastValue}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentField?.unit}
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            <div className="text-center p-4 bg-gray-50 rounded-xl min-h-[60px] flex items-center justify-center">
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="ml-2 font-semibold">
                    {language === "sw" ? "Ninazungumza..." : "Speaking..."}
                  </span>
                </div>
              )}
              
              {isListening && (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                  <span className="font-semibold">
                    {language === "sw" ? "Sikiliza..." : "Listening..."}
                  </span>
                </div>
              )}

              {!isSpeaking && !isListening && (
                <div className="text-gray-500">
                  {confirming 
                    ? (language === "sw" ? "Thibitisha thamani yako" : "Confirm your value")
                    : (language === "sw" ? "Tayari..." : "Ready...")}
                </div>
              )}
            </div>

            {/* Manual Confirmation Buttons */}
            {confirming && lastValue !== null && (
              <div className="flex gap-3">
                <button
                  onClick={acceptValue}
                  disabled={isSpeaking || isListening}
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={20} />
                  {language === "sw" ? "Ndiyo" : "Yes"}
                </button>
                <button
                  onClick={retryValue}
                  disabled={isSpeaking || isListening}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={20} />
                  {language === "sw" ? "Hapana" : "No"}
                </button>
              </div>
            )}

            {/* Skip Button (only for activity section) */}
            {currentSection === "activity" && (
              <button
                onClick={skipSection}
                disabled={isSpeaking || isListening}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === "sw" ? "Ruka Shughuli" : "Skip Activities"}
              </button>
            )}

            {/* Completed Fields */}
            {(currentSection === "vitals" || (currentSection === "activity" && currentFieldIndex > 0)) && (
              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-500 font-semibold">
                  {language === "sw" ? "Vilivyokamilika:" : "Completed:"}
                </p>
                {currentFields.slice(0, currentFieldIndex).map((field, index) => {
                  const value = values[field.name as keyof typeof values];
                  if (value === null || value === undefined) return null;
                  
                  return (
                    <div key={index} className="flex justify-between text-sm bg-green-50 p-2 rounded">
                      <span className="text-gray-700">{field.label[language]}</span>
                      <span className="font-bold text-green-600">
                        {value} {field.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              disabled={isSpeaking || isListening}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {language === "sw" ? "Ghairi" : "Cancel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveVoiceForm;