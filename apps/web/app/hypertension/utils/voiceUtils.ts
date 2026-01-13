// apps/web/app/hypertension/utils/voiceUtils.ts
import { toast } from "react-hot-toast";

// Voice Mode State Interface
export interface VoiceModeState {
  active: boolean;
  listening: boolean;
  speaking: boolean;
  currentField: string | null;
  muted: boolean;
  status: string;
}

// Text-to-Speech function
export const speak = async (
  text: string,
  language: "en" | "sw",
  muted: boolean,
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  setVoiceModeState: React.Dispatch<React.SetStateAction<VoiceModeState>>
): Promise<void> => {
  if (muted || !window.speechSynthesis) return;

  return new Promise((resolve) => {
    try {
      setVoiceModeState(prev => ({ ...prev, speaking: true, status: text }));

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
        setVoiceModeState(prev => ({ ...prev, speaking: false, status: "" }));
        resolve();
      };

      utterance.onerror = (error) => {
        console.error("Speech error:", error);
        setVoiceModeState(prev => ({ ...prev, speaking: false, status: "" }));
        resolve();
      };

      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error("❌ TTS Error:", error);
      setVoiceModeState(prev => ({ ...prev, speaking: false, status: "" }));
      resolve();
    }
  });
};

// Speech-to-Text function using Grok API
export const listenForField = async ({
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
  isRequired
}: {
  fieldName: string;
  fieldLabel: string;
  fieldType: "number" | "select";
  min?: number;
  max?: number;
  languageValue: "en" | "sw";
  currentLanguage: any;
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  isProcessingRef: React.MutableRefObject<boolean>;
  setVoiceModeState: React.Dispatch<React.SetStateAction<VoiceModeState>>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  API_URL: string;
  fieldRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  handleSpeak: (text: string) => Promise<void>;
  isRequired: boolean;
}): Promise<number | string | null> => {
  return new Promise(async (resolve) => {
    if (!voiceModeActiveRef.current) {
      resolve(null);
      return;
    }

    try {
      setVoiceModeState(prev => ({ 
        ...prev, 
        listening: true, 
        currentField: fieldLabel, 
        status: currentLanguage.listening 
      }));

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 256000
      });

      const audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        if (audioBlob.size < 1000) {
          setVoiceModeState(prev => ({ ...prev, listening: false }));
          resolve(null);
          return;
        }

        // Send to backend
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", languageValue);

        try {
          const response = await fetch(`${API_URL}/api/speech/stt`, {
            method: "POST",
            body: formData
          });

          const data = await response.json();
          setVoiceModeState(prev => ({ ...prev, listening: false }));

          if (data.success && data.text) {
            // Handle different field types
            if (fieldType === "select") {
              // For selection fields, match the input to available options
              const text = data.text.toLowerCase().trim();
              const options = currentLanguage.optionKeywords[fieldName];
              
              if (options) {
                // Try to find a match
                for (const [key, keywords] of Object.entries(options)) {
                  const keywordArray = keywords as string[];
                  for (const keyword of keywordArray) {
                    if (text.includes(keyword.substring(0, 3))) {
                      resolve(key);
                      return;
                    }
                  }
                }
              }
              
              // If no match found, return null for retry
              resolve(null);
              return;
            } else if (fieldType === "number" && min !== undefined && max !== undefined) {
              // For numeric fields
              const number = parseInt(data.text.trim(), 10);
              if (!isNaN(number) && number >= min && number <= max) {
                resolve(number);
              } else {
                // Number out of range
                const errorMsg = languageValue === "sw"
                  ? `Nambari hii si sahihi. Tafadhali sema nambari kati ya ${min} na ${max}.`
                  : `That number is not valid. Please say a number between ${min} and ${max}.`;
                
                await handleSpeak(errorMsg);
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
          setVoiceModeState(prev => ({ ...prev, listening: false }));
          resolve(null);
        }
      };

      // Record for 3 seconds
      mediaRecorderRef.current.start(100);
      
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 3000);

    } catch (error) {
      console.error("❌ Listen Error:", error);
      setVoiceModeState(prev => ({ ...prev, listening: false }));
      toast.error(
        languageValue === "sw" 
          ? "Imeshindwa kupata maikrofoni" 
          : "Failed to access microphone"
      );
      resolve(null);
    }
  });
};

// Start voice mode function
export const startVoiceMode = async ({
  languageValue,
  currentLanguage,
  voiceModeActiveRef,
  voiceModeState,
  setVoiceModeState,
  setValue,
  getValues,
  toast,
  handleSpeak,
  listenForField
}: {
  languageValue: "en" | "sw";
  currentLanguage: any;
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  voiceModeState: VoiceModeState;
  setVoiceModeState: React.Dispatch<React.SetStateAction<VoiceModeState>>;
  setValue: (name: string, value: any, options?: any) => void;
  getValues: () => any;
  toast: typeof import("react-hot-toast").toast;
  handleSpeak: (text: string) => Promise<void>;
  listenForField: (params: any) => Promise<number | string | null>;
}): Promise<void> => {
  try {
    // Set voice mode as active
    voiceModeActiveRef.current = true;
    setVoiceModeState(prev => ({ ...prev, active: true }));

    // Give user instructions
    const introText = languageValue === "sw"
      ? "Nimezimia hali ya msaidizi wa sauti. Nitakusaidia kuingiza maadili yako ya shinikizo la damu na mapigo ya moyo kwa kutumia sauti yako."
      : "Voice assistant mode activated. I'll help you enter your blood pressure and heart rate values using your voice.";

    await handleSpeak(introText);

    // Start with systolic blood pressure
    await handleSpeak(currentLanguage.fieldInstructions.systolic);
    const systolicValue = await listenForField({
      fieldName: "systolic",
      fieldLabel: currentLanguage.systolicLabel,
      fieldType: "number",
      min: 70,
      max: 250,
      languageValue,
      currentLanguage,
      voiceModeActiveRef,
      isProcessingRef: { current: false },
      setVoiceModeState,
      mediaRecorderRef: { current: null },
      API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
      fieldRefs: { current: {} },
      handleSpeak,
      isRequired: true
    });

    if (systolicValue !== null && typeof systolicValue === 'number') {
      setValue("systolic", systolicValue);
      
      // Confirm the value
      const confirmText = languageValue === "sw"
        ? `Shinikizo la sistolic ni ${systolicValue} mmHg. Hii ni sahihi?`
        : `Systolic pressure is ${systolicValue} mmHg. Is this correct?`;
      
      await handleSpeak(confirmText);
      
      // Wait for user confirmation (simplified - would need more complex implementation)
      setTimeout(async () => {
        await handleSpeak(languageValue === "sw" ? "Je, unahisi thamani hii ni sahihi?" : "Do you feel this value is correct?");
        
        // For now, assume yes and continue
        // In a full implementation, you'd listen for "yes" or "no"
        
        // Move to diastolic
        await handleSpeak(currentLanguage.fieldInstructions.diastolic);
        const diastolicValue = await listenForField({
          fieldName: "diastolic",
          fieldLabel: currentLanguage.diastolicLabel,
          fieldType: "number",
          min: 40,
          max: 150,
          languageValue,
          currentLanguage,
          voiceModeActiveRef,
          isProcessingRef: { current: false },
          setVoiceModeState,
          mediaRecorderRef: { current: null },
          API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
          fieldRefs: { current: {} },
          handleSpeak,
          isRequired: true
        });

        if (diastolicValue !== null && typeof diastolicValue === 'number') {
          setValue("diastolic", diastolicValue);
          
          // Confirm the value
          const confirmText = languageValue === "sw"
            ? `Shinikizo la diastolic ni ${diastolicValue} mmHg. Hii ni sahihi?`
            : `Diastolic pressure is ${diastolicValue} mmHg. Is this correct?`;
          
          await handleSpeak(confirmText);
          
          // Wait for user confirmation
          setTimeout(async () => {
            await handleSpeak(languageValue === "sw" ? "Je, unahisi thamani hii ni sahihi?" : "Do you feel this value is correct?");
            
            // Move to heart rate
            await handleSpeak(currentLanguage.fieldInstructions.heartRate);
            const heartRateValue = await listenForField({
              fieldName: "heartRate",
              fieldLabel: currentLanguage.heartRateLabel,
              fieldType: "number",
              min: 30,
              max: 220,
              languageValue,
              currentLanguage,
              voiceModeActiveRef,
              isProcessingRef: { current: false },
              setVoiceModeState,
              mediaRecorderRef: { current: null },
              API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
              fieldRefs: { current: {} },
              handleSpeak,
              isRequired: true
            });

            if (heartRateValue !== null && typeof heartRateValue === 'number') {
              setValue("heartRate", heartRateValue);
              
              // Confirm the value
              const confirmText = languageValue === "sw"
                ? `Kiwango cha mapigo ya moyo ni ${heartRateValue} kwa dakika. Hii ni sahihi?`
                : `Heart rate is ${heartRateValue} beats per minute. Is this correct?`;
              
              await handleSpeak(confirmText);
              
              // Wait for user confirmation
              setTimeout(async () => {
                await handleSpeak(languageValue === "sw" ? "Je, unahisi thamani hii ni sahihi?" : "Do you feel this value is correct?");
                
                // Completion message
                const completeText = languageValue === "sw"
                  ? "Asante! Vipimo vyote vimekamilika. Unaweza kubonyeza kitufe cha 'Hifadhi' ili kuhifadhi data."
                  : "Thank you! All measurements completed. You can press the 'Save' button to save your data.";
                
                await handleSpeak(completeText);
                
                // Stop voice mode
                stopVoiceMode({
                  voiceModeActiveRef,
                  mediaRecorderRef: { current: null },
                  currentLanguage,
                  setVoiceModeState,
                  handleSpeak,
                  isMuted: voiceModeState.muted
                });
              }, 3000);
            } else {
              // User cancelled or invalid input
              stopVoiceMode({
                voiceModeActiveRef,
                mediaRecorderRef: { current: null },
                currentLanguage,
                setVoiceModeState,
                handleSpeak,
                isMuted: voiceModeState.muted
              });
            }
          }, 3000);
        } else {
          // User cancelled or invalid input
          stopVoiceMode({
            voiceModeActiveRef,
            mediaRecorderRef: { current: null },
            currentLanguage,
            setVoiceModeState,
            handleSpeak,
            isMuted: voiceModeState.muted
          });
        }
      }, 3000);
    } else {
      // User cancelled or invalid input
      stopVoiceMode({
        voiceModeActiveRef,
        mediaRecorderRef: { current: null },
        currentLanguage,
        setVoiceModeState,
        handleSpeak,
        isMuted: voiceModeState.muted
      });
    }
  } catch (error) {
    console.error("Voice mode error:", error);
    toast.error(languageValue === "sw" ? "Hitilafu ya sauti" : "Voice error");
    
    // Stop voice mode on error
    stopVoiceMode({
      voiceModeActiveRef,
      mediaRecorderRef: { current: null },
      currentLanguage,
      setVoiceModeState,
      handleSpeak,
      isMuted: voiceModeState.muted
    });
  }
};

// Stop voice mode function
export const stopVoiceMode = ({
  voiceModeActiveRef,
  mediaRecorderRef,
  currentLanguage,
  setVoiceModeState,
  handleSpeak,
  isMuted
}: {
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  currentLanguage: any;
  setVoiceModeState: React.Dispatch<React.SetStateAction<VoiceModeState>>;
  handleSpeak: (text: string) => Promise<void>;
  isMuted: boolean;
}): void => {
  voiceModeActiveRef.current = false;
  
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
  }
  
  setVoiceModeState(prev => ({ ...prev, active: false, listening: false, speaking: false, currentField: null, status: "" }));
  
  if (!isMuted) {
    const stopText = currentLanguage.voiceCancelled;
    handleSpeak(stopText);
  }
};
