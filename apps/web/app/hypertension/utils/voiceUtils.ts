import { getDisplayValue } from './formUtils';

let currentAudio: HTMLAudioElement | null = null;

// Voice Mode State Interface
export interface VoiceModeState {
  active: boolean;
  listening: boolean;
  speaking: boolean;
  currentField: string | null;
  muted: boolean;
  paused: boolean;
  status: string;
}

// Text-to-Speech function
export const speak = async (
  text: string, 
  languageValue: string, 
  isMuted: boolean, 
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  pausedRef: React.MutableRefObject<boolean>,
  setVoiceModeState: (state: Partial<VoiceModeState>) => void
): Promise<void> => {
  if (pausedRef.current || isMuted || !voiceModeActiveRef.current) return Promise.resolve();

  setVoiceModeState({ speaking: true, status: "" });

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const synthesisLang = languageValue === "sw" ? "sw" : "en";
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`${API_URL}/api/python-speech/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language: synthesisLang }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      setVoiceModeState({ speaking: false });
      return Promise.resolve();
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    return new Promise<void>((resolve) => {
      const checkPauseInterval = setInterval(() => {
        if (pausedRef.current) {
          audio.pause();
          audio.currentTime = 0;
          clearInterval(checkPauseInterval);
          URL.revokeObjectURL(audioUrl);
          currentAudio = null;
          setVoiceModeState({ speaking: false });
          resolve();
        }
      }, 100);

      audio.onended = () => {
        clearInterval(checkPauseInterval);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setVoiceModeState({ speaking: false });
        resolve();
      };
      
      audio.onerror = () => {
        clearInterval(checkPauseInterval);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setVoiceModeState({ speaking: false });
        resolve();
      };
      
      audio.play().catch(() => {
        clearInterval(checkPauseInterval);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setVoiceModeState({ speaking: false });
        resolve();
      });
    });
  } catch (error: any) {
    setVoiceModeState({ speaking: false });
    return Promise.resolve();
  }
};

export const stopCurrentSpeech = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};

export const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
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
    return webmBlob;
  }
};

export const parseSpokenInput = (text: string, languageValue: string, fieldType?: 'number' | 'select'): { 
  type: 'number' | 'text' | 'skip' | 'yes' | 'no' | 'cancel' | 'unknown'; 
  value?: number; 
  textValue?: string 
} => {
  const lowerText = text.toLowerCase().trim();
  
  // Check for yes/no/cancel commands
  const yesWords = languageValue === "sw" 
    ? ['ndio', 'yes', 'correct', 'right', 'true', 'sawa', 'kubali', 'ehe', 'ndiyo']
    : ['yes', 'correct', 'right', 'true', 'yeah', 'yep', 'ye', 'y'];
  
  const noWords = languageValue === "sw"
    ? ['hapana', 'no', 'wrong', 'incorrect', 'false', 'jaribu tena', 'siyo', 'si', 'la']
    : ['no', 'wrong', 'incorrect', 'false', 'nope', 'try again', 'nah'];
  
  const cancelWords = languageValue === "sw"
    ? ['batilisha', 'cancel', 'stop', 'quit', 'end', 'simamisha', 'acha']
    : ['cancel', 'stop', 'quit', 'end', 'cease'];
  
  const skipWords = languageValue === "sw" 
    ? ['ruka', 'pass', 'next', 'none', 'sina', 'skip']
    : ['skip', 'pass', 'next', 'none', "don't know", 'not sure'];
  
  // Check for confirmation/cancellation first
  if (yesWords.some(word => lowerText.includes(word))) {
    return { type: 'yes' };
  }
  if (noWords.some(word => lowerText.includes(word))) {
    return { type: 'no' };
  }
  if (cancelWords.some(word => lowerText.includes(word))) {
    return { type: 'cancel' };
  }
  
  // Then check for skip
  if (skipWords.some(word => lowerText.includes(word))) {
    return { type: 'skip' };
  }
  
  // Check for numbers
  if (fieldType === 'number' || fieldType === 'select') {
    const numbers = lowerText.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const number = parseInt(numbers[0], 10);
      if (!isNaN(number) && number > 0) {
        return { type: 'number', value: number };
      }
    }
  }
  
  // For text or select fields
  if (fieldType === 'select' || lowerText.length > 0) {
    return { type: 'text', textValue: lowerText };
  }

  return { type: 'unknown' };
};

const checkIfClearMatch = (spokenText: string, fieldName: string, currentLanguage: any): boolean => {
  const lowerText = spokenText.toLowerCase();
  const keywords = currentLanguage.optionKeywords;
  
  if (!keywords || !keywords[fieldName]) return false;
  
  for (const option in keywords[fieldName]) {
    for (const keyword of keywords[fieldName][option]) {
      const normalizedKeyword = keyword.toLowerCase().trim();
      if (lowerText === normalizedKeyword || 
          lowerText.includes(normalizedKeyword + " ") ||
          lowerText.includes(" " + normalizedKeyword) ||
          lowerText.startsWith(normalizedKeyword) ||
          lowerText.endsWith(normalizedKeyword)) {
        return true;
      }
    }
  }
  
  return false;
};

export const mapSpokenToOption = (spokenText: string, fieldName: string, currentLanguage: any): string | null => {
  const keywords = currentLanguage.optionKeywords as any;
  
  // For hypertension-specific fields
  if (fieldName === 'activityType') {
    const options = [
      { dbValue: 'none', displayValue: 'No recent activity' },
      { dbValue: 'exercise', displayValue: 'Exercise/Workout' },
      { dbValue: 'walking', displayValue: 'Walking' },
      { dbValue: 'eating', displayValue: 'Eating/Meal' },
      { dbValue: 'stress', displayValue: 'Stress/Anxiety' },
      { dbValue: 'sleep_deprivation', displayValue: 'Sleep Deprivation' },
      { dbValue: 'caffeine', displayValue: 'Caffeine Intake' },
      { dbValue: 'medication', displayValue: 'Recent Medication' },
      { dbValue: 'illness', displayValue: 'Illness/Fever' },
      { dbValue: 'other', displayValue: 'Other' }
    ];
    
    const lowerSpoken = spokenText.toLowerCase().trim();
    
    // Try keyword matching first
    if (keywords && keywords[fieldName]) {
      for (const option of options) {
        if (keywords[fieldName][option.dbValue]) {
          for (const keyword of keywords[fieldName][option.dbValue]) {
            const normalizedKeyword = keyword.toLowerCase().trim();
            if (lowerSpoken.includes(normalizedKeyword)) {
              return option.dbValue;
            }
          }
        }
      }
    }
    
    // Enhanced fallback matching
    if (lowerSpoken.includes('none') || lowerSpoken.includes('no activity') || lowerSpoken.includes('not active')) {
      return 'none';
    }
    if (lowerSpoken.includes('exercise') || lowerSpoken.includes('workout') || lowerSpoken.includes('gym')) {
      return 'exercise';
    }
    if (lowerSpoken.includes('walking') || lowerSpoken.includes('walk') || lowerSpoken.includes('tembee')) {
      return 'walking';
    }
    if (lowerSpoken.includes('eating') || lowerSpoken.includes('meal') || lowerSpoken.includes('chakula')) {
      return 'eating';
    }
    if (lowerSpoken.includes('stress') || lowerSpoken.includes('anxiety') || lowerSpoken.includes('msongo')) {
      return 'stress';
    }
    if (lowerSpoken.includes('sleep') || lowerSpoken.includes('deprivation') || lowerSpoken.includes('kulala')) {
      return 'sleep_deprivation';
    }
    if (lowerSpoken.includes('caffeine') || lowerSpoken.includes('coffee') || lowerSpoken.includes('kahawa')) {
      return 'caffeine';
    }
    if (lowerSpoken.includes('medication') || lowerSpoken.includes('medicine') || lowerSpoken.includes('dawa')) {
      return 'medication';
    }
    if (lowerSpoken.includes('illness') || lowerSpoken.includes('fever') || lowerSpoken.includes('ugonjwa')) {
      return 'illness';
    }
    if (lowerSpoken.includes('other') || lowerSpoken.includes('another') || lowerSpoken.includes('nyingine')) {
      return 'other';
    }
  }
  
  return null;
};

export const pauseVoiceMode = (params: {
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  pausedRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  setVoiceModeState: (state: Partial<VoiceModeState>) => void;
  handleSpeak: (text: string) => Promise<void>;
  languageValue: string;
  isMuted: boolean;
}) => {
  const {
    pausedRef,
    mediaRecorderRef,
    setVoiceModeState,
    handleSpeak,
    languageValue,
    isMuted
  } = params;

  pausedRef.current = true;
  
  if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
    try {
      mediaRecorderRef.current.stop();
    } catch (error) {}
  }
  
  stopCurrentSpeech();
  
  setVoiceModeState({ 
    paused: true,
    listening: false,
    speaking: false,
    status: ""
  });
  
  if (!isMuted) {
    setTimeout(() => {
      handleSpeak(languageValue === "sw" ? "Nimesimama." : "Paused.").catch(() => {});
    }, 100);
  }
};

export const resumeVoiceMode = async (params: {
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  pausedRef: React.MutableRefObject<boolean>;
  setVoiceModeState: (state: Partial<VoiceModeState>) => void;
  handleSpeak: (text: string) => Promise<void>;
  languageValue: string;
  isMuted: boolean;
  currentField: string | null;
}) => {
  const {
    pausedRef,
    setVoiceModeState,
    handleSpeak,
    languageValue,
    isMuted
  } = params;

  pausedRef.current = false;
  
  setVoiceModeState({ 
    paused: false,
    status: ""
  });
  
  if (!isMuted) {
    try {
      await handleSpeak(languageValue === "sw" ? "Tunaendelea." : "Resuming.");
    } catch (error) {}
  }
};

// Simplified confirmation function
export const askConfirmation = async (
  value: string | number, 
  fieldName: string, 
  fieldLabel: string, 
  languageValue: string, 
  currentLanguage: any, 
  API_URL: string, 
  handleSpeak: (text: string) => Promise<void>,
  setVoiceModeState: (state: Partial<VoiceModeState>) => void,
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  pausedRef: React.MutableRefObject<boolean>
): Promise<boolean> => {
  const displayValue = typeof value === 'number' 
    ? value 
    : getDisplayValue(fieldName, value as string, currentLanguage);
  
  // Simplified question
  const question = languageValue === "sw" 
    ? `${displayValue}. Ndio au hapana?`
    : `${displayValue}. Yes or no?`;
  
  await handleSpeak(question);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return new Promise(async (resolve) => {
    try {
      while (pausedRef.current && voiceModeActiveRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (!voiceModeActiveRef.current) {
        resolve(false);
        return;
      }
      
      setVoiceModeState({ listening: true, status: languageValue === "sw" ? "Sema ndio au hapana" : "Say yes or no" });

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
          setVoiceModeState({ listening: false, status: "" });
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
            body: formData,
            signal: AbortSignal.timeout(8000)
          });

          if (!response.ok) {
            setVoiceModeState({ listening: false, status: "" });
            resolve(true); // Assume yes if there's an error
            return;
          }

          const data = await response.json();
          setVoiceModeState({ listening: false, status: "" });

          if (data.success && data.text) {
            const parsed = parseSpokenInput(data.text, languageValue, 'select');
            
            if (parsed.type === 'yes') {
              resolve(true);
            } else if (parsed.type === 'no') {
              resolve(false);
            } else if (parsed.type === 'cancel') {
              resolve(false);
            } else if (parsed.type === 'number') {
              resolve(parsed.value === 1);
            } else if (parsed.type === 'text') {
              const lowerText = parsed.textValue?.toLowerCase() || '';
              const yesWords = languageValue === "sw" 
                ? ['ndio', 'yes', 'correct', 'right', 'true', 'sawa']
                : ['yes', 'correct', 'right', 'true', 'yeah', 'yep'];
              const noWords = languageValue === "sw"
                ? ['hapana', 'no', 'wrong', 'incorrect', 'false', 'jaribu tena']
                : ['no', 'wrong', 'incorrect', 'false', 'nope', 'try again'];
              
              if (yesWords.some(word => lowerText.includes(word))) {
                resolve(true);
              } else if (noWords.some(word => lowerText.includes(word))) {
                resolve(false);
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          } else {
            resolve(true);
          }
        } catch (error: any) {
          setVoiceModeState({ listening: false, status: "" });
          resolve(true);
        }
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 2500); // Reduced from 3000

    } catch (error) {
      setVoiceModeState({ listening: false, status: "" });
      resolve(false);
    }
  });
};

// Simplified listenForField function
export const listenForField = async (
  fieldName: string,
  fieldLabel: string,
  fieldType: 'number' | 'select',
  min: number | undefined,
  max: number | undefined,
  languageValue: string,
  currentLanguage: any,
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  pausedRef: React.MutableRefObject<boolean>,
  isProcessingRef: React.MutableRefObject<boolean>,
  setVoiceModeState: (state: Partial<VoiceModeState>) => void,
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  API_URL: string,
  fieldRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>,
  handleSpeak: (text: string) => Promise<void>,
  isRequired: boolean
): Promise<string | number | 'skip' | null> => {
  
  while (pausedRef.current && voiceModeActiveRef.current) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  if (isProcessingRef.current || !voiceModeActiveRef.current) {
    return null;
  }

  if (fieldRefs.current[fieldName]) {
    fieldRefs.current[fieldName]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  setVoiceModeState({ currentField: fieldName });

  // SIMPLIFIED: Just say the field name
  const announcement = fieldLabel;
  
  await handleSpeak(announcement);
  await new Promise(resolve => setTimeout(resolve, 300));

  while (pausedRef.current && voiceModeActiveRef.current) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  if (!voiceModeActiveRef.current) {
    return null;
  }

  return new Promise(async (resolve) => {
    try {
      isProcessingRef.current = true;
      
      setVoiceModeState({ 
        listening: true, 
        status: languageValue === "sw" ? "Sema sasa" : "Speak now" 
      });

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
          setVoiceModeState({ listening: false, currentField: null, status: "" });
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

          const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(8000) // Reduced from 10000
          });

          if (!response.ok) {
            setVoiceModeState({ listening: false, currentField: null, status: "" });
            isProcessingRef.current = false;
            await handleSpeak(languageValue === "sw" ? "Rudi." : "Repeat.");
            resolve(null);
            return;
          }

          const data = await response.json();
          
          setVoiceModeState({ listening: false, currentField: null, status: "" });
          isProcessingRef.current = false;

          if (data.success && data.text) {
            const parsed = parseSpokenInput(data.text, languageValue, fieldType);
            
            if (parsed.type === 'skip') {
              if (isRequired) {
                await handleSpeak(languageValue === "sw" ? "Rudi." : "Repeat.");
                resolve(null);
              } else {
                resolve('skip');
              }
            } else if (parsed.type === 'number' && parsed.value !== undefined) {
              if (fieldType === 'number' && min !== undefined && max !== undefined) {
                if (parsed.value >= min && parsed.value <= max) {
                  const confirmed = await askConfirmation(
                    parsed.value, 
                    fieldName, 
                    fieldLabel, 
                    languageValue, 
                    currentLanguage, 
                    API_URL, 
                    handleSpeak, 
                    setVoiceModeState,
                    voiceModeActiveRef,
                    pausedRef
                  );
                  if (confirmed) {
                    resolve(parsed.value);
                  } else {
                    resolve(null);
                  }
                } else {
                  await handleSpeak(languageValue === "sw" 
                    ? `Rudi. ${min} hadi ${max}.`
                    : `Repeat. ${min} to ${max}.`);
                  resolve(null);
                }
              } else {
                resolve(null);
              }
            } else if (parsed.type === 'text' && parsed.textValue && fieldType === 'select') {
              const mappedValue = mapSpokenToOption(parsed.textValue, fieldName, currentLanguage);
              
              if (mappedValue) {
                const isClearMatch = checkIfClearMatch(parsed.textValue, fieldName, currentLanguage);
                
                if (isClearMatch) {
                  resolve(mappedValue);
                } else {
                  const displayValue = getDisplayValue(fieldName, mappedValue, currentLanguage);
                  const confirmed = await askConfirmation(
                    displayValue, 
                    fieldName, 
                    fieldLabel, 
                    languageValue, 
                    currentLanguage, 
                    API_URL, 
                    handleSpeak, 
                    setVoiceModeState,
                    voiceModeActiveRef,
                    pausedRef
                  );
                  if (confirmed) {
                    resolve(mappedValue);
                  } else {
                    resolve(null);
                  }
                }
              } else {
                await handleSpeak(languageValue === "sw" ? "Rudi." : "Repeat.");
                resolve(null);
              }
            } else {
              await handleSpeak(languageValue === "sw" ? "Rudi." : "Repeat.");
              resolve(null);
            }
          } else {
            await handleSpeak(languageValue === "sw" ? "Rudi." : "Repeat.");
            resolve(null);
          }
        } catch (error: any) {
          setVoiceModeState({ listening: false, currentField: null, status: "" });
          isProcessingRef.current = false;
          await handleSpeak(languageValue === "sw" ? "Rudi." : "Repeat.");
          resolve(null);
        }
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
          mediaRecorder.stop();
        }
      }, 3500); // Reduced from 4000

    } catch (error) {
      setVoiceModeState({ listening: false, currentField: null, status: "" });
      isProcessingRef.current = false;
      resolve(null);
    }
  });
};

export const startVoiceMode = async (params: {
  languageValue: string;
  currentLanguage: any;
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  pausedRef: React.MutableRefObject<boolean>;
  voiceModeState: VoiceModeState;
  setVoiceModeState: (state: Partial<VoiceModeState>) => void;
  setValue: any;
  getValues: any;
  toast: any;
  handleSpeak: (text: string) => Promise<void>;
  isProcessingRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  API_URL: string;
  fieldRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}): Promise<void> => {
  const {
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
  } = params;

  setVoiceModeState({ active: true });
  voiceModeActiveRef.current = true;
  pausedRef.current = false;
  
  // Simplified welcome
  const welcome = languageValue === "sw"
    ? "Systolic."
    : "Systolic.";
  
  await handleSpeak(welcome);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const allFields = [
    { 
      name: "systolic", 
      label: currentLanguage.systolicLabel || "Systolic Pressure",
      type: "number" as const,
      min: 70, 
      max: 250,
      required: true
    },
    { 
      name: "diastolic", 
      label: currentLanguage.diastolicLabel || "Diastolic Pressure",
      type: "number" as const,
      min: 40, 
      max: 150,
      required: true
    },
    { 
      name: "heartRate", 
      label: currentLanguage.heartRateLabel || "Heart Rate",
      type: "number" as const,
      min: 40, 
      max: 200,
      required: true
    },
    { 
      name: "activityType", 
      label: currentLanguage.activityTypeLabel || "Recent Activity Type",
      type: "select" as const,
      required: false
    },
    { 
      name: "duration", 
      label: currentLanguage.durationLabel || "Duration (minutes)",
      type: "number" as const,
      min: 0, 
      max: 480,
      required: false
    },
    { 
      name: "intensity", 
      label: currentLanguage.intensityLabel || "Intensity",
      type: "select" as const,
      required: false
    },
    { 
      name: "timeSinceActivity", 
      label: currentLanguage.timeSinceActivityLabel || "Time Since Activity (minutes)",
      type: "number" as const,
      min: 0, 
      max: 1440,
      required: false
    }
  ];

  for (const field of allFields) {
    if (!voiceModeActiveRef.current) break;
    
    while (pausedRef.current && voiceModeActiveRef.current) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (!voiceModeActiveRef.current) break;

    let validInput = false;
    let attempts = 0;
    const maxAttempts = field.required ? 3 : 2;
    
    while (!validInput && attempts < maxAttempts && voiceModeActiveRef.current) {
      while (pausedRef.current && voiceModeActiveRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (!voiceModeActiveRef.current) break;
      
      const result = await listenForField(
        field.name, 
        field.label, 
        field.type,
        field.min,
        field.max,
        languageValue,
        currentLanguage,
        voiceModeActiveRef,
        pausedRef,
        isProcessingRef,
        setVoiceModeState,
        mediaRecorderRef,
        API_URL,
        fieldRefs,
        handleSpeak,
        field.required
      );
      
      if (!voiceModeActiveRef.current) break;
      
      if (result === null) {
        attempts++;
        continue;
      }

      if (result === 'skip') {
        if (!field.required) {
          validInput = true;
          break;
        } else {
          attempts++;
          continue;
        }
      }

      setValue(field.name, result as any);
      
      const displayValue = typeof result === 'number' 
        ? result 
        : getDisplayValue(field.name, result as string, currentLanguage);
      
      if (!voiceModeState.muted && voiceModeActiveRef.current) {
        await handleSpeak(languageValue === "sw" ? `${displayValue}` : `${displayValue}`);
      }
      
      validInput = true;
    }
    
    if (!validInput && voiceModeActiveRef.current) {
      if (field.required) {
        const manualMsg = languageValue === "sw"
          ? `Tafadhali weka ${field.label} mwenyewe.`
          : `Please enter ${field.label} manually.`;
        
        if (!voiceModeState.muted) {
          await handleSpeak(manualMsg);
        }
        
        setVoiceModeState({ 
          active: false,
          listening: false,
          speaking: false,
          currentField: null, 
          status: "" 
        });
        voiceModeActiveRef.current = false;
        pausedRef.current = false;
        return;
      }
    }

    if (voiceModeActiveRef.current) {
      await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay
    }
  }

  if (voiceModeActiveRef.current) {
    const complete = languageValue === "sw"
      ? "Imekamilika."
      : "Complete.";
    
    await handleSpeak(complete);
  }
  
  setVoiceModeState({ 
    active: false, 
    currentField: null, 
    status: "",
    listening: false,
    speaking: false,
    paused: false
  });
  voiceModeActiveRef.current = false;
  pausedRef.current = false;
};

export const stopVoiceMode = (params: {
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  pausedRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  currentLanguage: any;
  setVoiceModeState: (state: Partial<VoiceModeState>) => void;
  handleSpeak: (text: string) => Promise<void>;
  isMuted: boolean;
  languageValue: string; // ADD THIS PARAMETER
}) => {
  const {
    voiceModeActiveRef,
    pausedRef,
    mediaRecorderRef,
    currentLanguage,
    setVoiceModeState,
    handleSpeak,
    isMuted,
    languageValue // ADD THIS DESTRUCTURING
  } = params;

  stopCurrentSpeech();
  
  if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
    try {
      mediaRecorderRef.current.stop();
    } catch (error) {}
  }
  
  voiceModeActiveRef.current = false;
  pausedRef.current = false;
  
  setVoiceModeState({
    active: false,
    listening: false,
    speaking: false,
    currentField: null,
    muted: false,
    paused: false,
    status: ""
  });
  
  if (!isMuted) {
    handleSpeak(languageValue === "sw" ? "Imezimwa." : "Stopped.").catch(() => {});
  }
};