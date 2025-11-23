// apps/web/app/components/diabetesPages/InteractiveVoiceForm.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Check, X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { diabetesType } from "@/types/diabetes";

interface InteractiveVoiceFormProps {
  language: "en" | "sw";
  onComplete: (data: Partial<diabetesType>) => void;
  onCancel: () => void;
}

interface VitalField {
  name: keyof diabetesType;
  label: { en: string; sw: string };
  prompt: { en: string; sw: string };
  min: number;
  max: number;
  unit: string;
}

const VITAL_FIELDS: VitalField[] = [
  {
    name: "glucose",
    label: { en: "Blood Glucose", sw: "Sukari ya Damu" },
    prompt: { 
      en: "Please say your blood glucose level in mg/dL. For example, one hundred twenty", 
      sw: "Tafadhali sema kiwango cha sukari damu yako. Kwa mfano, mia moja ishirini" 
    },
    min: 20,
    max: 600,
    unit: "mg/dL"
  },
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

const InteractiveVoiceForm: React.FC<InteractiveVoiceFormProps> = ({
  language,
  onComplete,
  onCancel
}) => {
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [values, setValues] = useState<Partial<diabetesType>>({});
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lastValue, setLastValue] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const currentField = VITAL_FIELDS[currentFieldIndex];
  const isLastField = currentFieldIndex === VITAL_FIELDS.length - 1;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ✅ Browser-based Text-to-Speech (FREE)
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

  // Speech-to-Text function (still using Groq)
  const listen = async (): Promise<number | null> => {
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

            if (data.success && data.text) {
              const number = parseInt(data.text.trim(), 10);
              if (!isNaN(number) && number > 0) {
                resolve(number);
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
    await promptCurrentField();
  };

  // Prompt user for current field
  const promptCurrentField = async () => {
    const field = VITAL_FIELDS[currentFieldIndex];
    if (!field) return;

    const promptText = field.prompt[language];
    
    await speak(promptText);
    
    // Wait for speech to finish, then start listening
    setTimeout(async () => {
      const value = await listen();
      
      if (value !== null) {
        // Validate range
        if (value >= field.min && value <= field.max) {
          await confirmValue(value);
        } else {
          const errorMsg = language === "sw"
            ? `${value} ni nje ya kiwango sahihi. Kiwango sahihi ni ${field.min} hadi ${field.max}. Tafadhali jaribu tena.`
            : `${value} is out of range. Valid range is ${field.min} to ${field.max}. Please try again.`;
          
          await speak(errorMsg);
          setTimeout(() => promptCurrentField(), 2000);
        }
      } else {
        const errorMsg = language === "sw"
          ? "Sikuelewa nambari. Tafadhali jaribu tena."
          : "I didn't understand the number. Please try again.";
        
        await speak(errorMsg);
        setTimeout(() => promptCurrentField(), 2000);
      }
    }, 500);
  };

  // Confirm value with user
  const confirmValue = async (value: number) => {
    setLastValue(value);
    setConfirming(true);

    const confirmMsg = language === "sw"
      ? `Je, ${value} ni sahihi? Bonyeza ndiyo au hapana.`
      : `Is ${value} correct? Press yes or no.`;

    await speak(confirmMsg);
  };

  // Accept the value and move to next field
  const acceptValue = async () => {
    if (lastValue === null) return;

    const field = VITAL_FIELDS[currentFieldIndex];
    if (!field) return;

    setValues(prev => ({ ...prev, [field.name]: lastValue }));
    setConfirming(false);
    setLastValue(null);

    if (isLastField) {
      const completeMsg = language === "sw"
        ? "Asante sana! Vipimo vyote vimekamilika."
        : "Thank you! All measurements are complete.";
      
      await speak(completeMsg);
      
      setTimeout(() => {
        onComplete({ ...values, [field.name]: lastValue });
      }, 2000);
    } else {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-3">
            <Mic className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {language === "sw" ? "Msaidizi wa Sauti" : "Voice Assistant"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {language === "sw" 
              ? "Nitakusaidia kuweka vipimo vyako"
              : "I'll help you enter your measurements"}
          </p>
        </div>

        {!started ? (
          /* Start Button */
          <div className="space-y-4">
            <button
              onClick={startVoiceInput}
              disabled={isSpeaking || isListening}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>{currentFieldIndex + 1} / {VITAL_FIELDS.length}</span>
              <span className="font-semibold">{currentField?.label[language]}</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentFieldIndex + 1) / VITAL_FIELDS.length) * 100}%` }}
              />
            </div>

            {/* Current Value Display */}
            {lastValue !== null && confirming && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl text-center border-2 border-blue-200">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {lastValue}
                </div>
                <div className="text-sm text-gray-600">
                  {currentField?.unit}
                </div>
              </div>
            )}

            {/* Status Messages */}
            <div className="text-center p-4 bg-gray-50 rounded-xl min-h-[60px] flex items-center justify-center">
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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

            {/* Completed Fields */}
            {Object.keys(values).length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-500 font-semibold">
                  {language === "sw" ? "Vipimo vilivyokamilika:" : "Completed:"}
                </p>
                {Object.entries(values).map(([key, value]) => {
                  const field = VITAL_FIELDS.find(f => f.name === key);
                  return field ? (
                    <div key={key} className="flex justify-between text-sm bg-green-50 p-2 rounded">
                      <span className="text-gray-700">{field.label[language]}</span>
                      <span className="font-bold text-green-600">{value} {field.unit}</span>
                    </div>
                  ) : null;
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