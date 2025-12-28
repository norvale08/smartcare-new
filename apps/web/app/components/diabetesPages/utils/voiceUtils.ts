// apps/web/app/components/diabetesPages/utils/voiceUtils.ts
import { getDisplayValue } from './formUtils';

let currentAudio: HTMLAudioElement | null = null;

export const speak = async (
  text: string, 
  languageValue: string, 
  isMuted: boolean, 
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  pausedRef: React.MutableRefObject<boolean>,
  setState: (speaking: boolean, status: string) => void
): Promise<void> => {
  if (pausedRef.current || isMuted || !voiceModeActiveRef.current) return Promise.resolve();

  setState(true, "");

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
      setState(false, "");
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
          setState(false, "");
          resolve();
        }
      }, 100);

      audio.onended = () => {
        clearInterval(checkPauseInterval);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setState(false, "");
        resolve();
      };
      
      audio.onerror = () => {
        clearInterval(checkPauseInterval);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setState(false, "");
        resolve();
      };
      
      audio.play().catch(() => {
        clearInterval(checkPauseInterval);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setState(false, "");
        resolve();
      });
    });
  } catch (error: any) {
    setState(false, "");
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

export const parseSpokenInput = (text: string, languageValue: string, fieldType?: 'number' | 'select'): { type: 'number' | 'text' | 'skip' | 'unknown'; value?: number; textValue?: string } => {
  const lowerText = text.toLowerCase().trim();
  
  const skipWords = languageValue === "sw" 
    ? ['ruka', 'pass', 'next', 'none', 'sina', 'hapana']
    : ['skip', 'pass', 'next', 'none', "don't know", 'not sure'];
  
  if (skipWords.some(word => lowerText.includes(word))) {
    return { type: 'skip' };
  }
  
  const yesWords = languageValue === "sw" 
    ? ['ndio', 'yes', 'correct', 'right', 'true', 'sawa']
    : ['yes', 'correct', 'right', 'true', 'yeah', 'yep'];
  
  const noWords = languageValue === "sw"
    ? ['hapana', 'no', 'wrong', 'incorrect', 'false', 'jaribu tena']
    : ['no', 'wrong', 'incorrect', 'false', 'nope', 'try again'];
  
  if (yesWords.some(word => lowerText.includes(word))) {
    return { type: 'number', value: 1 };
  }
  if (noWords.some(word => lowerText.includes(word))) {
    return { type: 'number', value: 0 };
  }

  if (fieldType === 'select') {
    return { type: 'text', textValue: lowerText };
  }

  const numbers = lowerText.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const number = parseInt(numbers[0], 10);
    if (!isNaN(number) && number > 0) {
      return { type: 'number', value: number };
    }
  }

  if (lowerText.length > 0) {
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
  
  let options: {dbValue: string, displayValue: string}[] = [];
  
  switch (fieldName) {
    case 'context':
      options = [
        {dbValue: 'Fasting', displayValue: 'Fasting'},
        {dbValue: 'Post-meal', displayValue: 'Post-meal'}, 
        {dbValue: 'Random', displayValue: 'Random'}
      ];
      break;
    case 'lastMealTime':
      options = [
        {dbValue: '2_hours', displayValue: '2_hours'},
        {dbValue: '4_hours', displayValue: '4_hours'},
        {dbValue: '6_hours', displayValue: '6_hours'},
        {dbValue: 'more_than_6_hours', displayValue: 'more_than_6_hours'}
      ];
      break;
    case 'mealType':
      options = [
        {dbValue: 'carbohydrates', displayValue: 'carbohydrates'},
        {dbValue: 'sugary_drinks', displayValue: 'sugary_drinks'},
        {dbValue: 'proteins', displayValue: 'proteins'},
        {dbValue: 'vegetables', displayValue: 'vegetables'},
        {dbValue: 'mixed_meal', displayValue: 'mixed_meal'}
      ];
      break;
    case 'exerciseRecent':
      options = [
        {dbValue: 'none', displayValue: 'none'},
        {dbValue: 'within_2_hours', displayValue: 'within_2_hours'},
        {dbValue: '2_to_6_hours', displayValue: '2_to_6_hours'},
        {dbValue: '6_to_24_hours', displayValue: '6_to_24_hours'}
      ];
      break;
    case 'exerciseIntensity':
      options = [
        {dbValue: 'light', displayValue: 'light'},
        {dbValue: 'moderate', displayValue: 'moderate'},
        {dbValue: 'vigorous', displayValue: 'vigorous'}
      ];
      break;
    default:
      return null;
  }
  
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
  
  // Enhanced fallback matching with more flexible patterns
  if (fieldName === 'context') {
    if (lowerSpoken.includes('fasting') || lowerSpoken.includes('fast') || lowerSpoken.includes('empty')) {
      return 'Fasting';
    }
    if (lowerSpoken.includes('post') || lowerSpoken.includes('after') || lowerSpoken.includes('meal')) {
      return 'Post-meal';
    }
    if (lowerSpoken.includes('random') || lowerSpoken.includes('anytime')) {
      return 'Random';
    }
  }
  
  if (fieldName === 'exerciseRecent') {
    // Match "none" or "no exercise"
    if (lowerSpoken.includes('none') || lowerSpoken.includes('no exercise') || lowerSpoken.includes('not exercised') || lowerSpoken === 'no') {
      return 'none';
    }
    // Match "within 2 hours" - look for "2" and "hour"
    if ((lowerSpoken.includes('within') && lowerSpoken.includes('2')) || 
        (lowerSpoken.includes('2') && lowerSpoken.includes('hour') && !lowerSpoken.includes('6') && !lowerSpoken.includes('24'))) {
      return 'within_2_hours';
    }
    // Match "2 to 6 hours" - look for both "2" and "6"
    if ((lowerSpoken.includes('2') && lowerSpoken.includes('6')) || 
        (lowerSpoken.includes('two') && lowerSpoken.includes('six'))) {
      return '2_to_6_hours';
    }
    // Match "6 to 24 hours" - look for "6" and "24" or just "24"
    if ((lowerSpoken.includes('6') && lowerSpoken.includes('24')) || 
        lowerSpoken.includes('24') ||
        (lowerSpoken.includes('six') && lowerSpoken.includes('24')) ||
        (lowerSpoken.includes('6') && lowerSpoken.includes('hours') && lowerSpoken.includes('ago'))) {
      return '6_to_24_hours';
    }
  }
  
  if (fieldName === 'exerciseIntensity') {
    if (lowerSpoken.includes('light') || lowerSpoken.includes('easy') || lowerSpoken.includes('gentle')) {
      return 'light';
    }
    if (lowerSpoken.includes('moderate') || lowerSpoken.includes('medium') || lowerSpoken.includes('normal')) {
      return 'moderate';
    }
    if (lowerSpoken.includes('vigorous') || lowerSpoken.includes('intense') || lowerSpoken.includes('hard') || lowerSpoken.includes('heavy')) {
      return 'vigorous';
    }
  }
  
  if (fieldName === 'lastMealTime') {
    if (lowerSpoken.includes('2') && lowerSpoken.includes('hour') && !lowerSpoken.includes('4') && !lowerSpoken.includes('6')) {
      return '2_hours';
    }
    if (lowerSpoken.includes('4') && lowerSpoken.includes('hour')) {
      return '4_hours';
    }
    if ((lowerSpoken.includes('6') && lowerSpoken.includes('hour') && !lowerSpoken.includes('more')) ||
        (lowerSpoken.includes('six') && lowerSpoken.includes('hour') && !lowerSpoken.includes('more'))) {
      return '6_hours';
    }
    if (lowerSpoken.includes('more') || lowerSpoken.includes('over') || lowerSpoken.includes('longer')) {
      return 'more_than_6_hours';
    }
  }
  
  if (fieldName === 'mealType') {
    if (lowerSpoken.includes('carb') || lowerSpoken.includes('rice') || lowerSpoken.includes('bread') || lowerSpoken.includes('pasta') || lowerSpoken.includes('ugali')) {
      return 'carbohydrates';
    }
    if (lowerSpoken.includes('sugar') || lowerSpoken.includes('drink') || lowerSpoken.includes('soda') || lowerSpoken.includes('juice')) {
      return 'sugary_drinks';
    }
    if (lowerSpoken.includes('protein') || lowerSpoken.includes('meat') || lowerSpoken.includes('fish') || lowerSpoken.includes('egg') || lowerSpoken.includes('chicken')) {
      return 'proteins';
    }
    if (lowerSpoken.includes('vegetable') || lowerSpoken.includes('salad') || lowerSpoken.includes('greens')) {
      return 'vegetables';
    }
    if (lowerSpoken.includes('mixed') || lowerSpoken.includes('combination') || lowerSpoken.includes('everything')) {
      return 'mixed_meal';
    }
  }
  
  return null;
};

export const pauseVoiceMode = (params: {
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  pausedRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  setVoiceModeState: (state: any) => void;
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
  
  setVoiceModeState((prev: any) => ({ 
    ...prev, 
    paused: true,
    listening: false,
    speaking: false,
    status: ""
  }));
  
  if (!isMuted) {
    setTimeout(() => {
      handleSpeak(languageValue === "sw" ? "Nimesimama." : "Paused.").catch(() => {});
    }, 100);
  }
};

export const resumeVoiceMode = async (params: {
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  pausedRef: React.MutableRefObject<boolean>;
  setVoiceModeState: (state: any) => void;
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
  
  setVoiceModeState((prev: any) => ({ 
    ...prev, 
    paused: false,
    status: ""
  }));
  
  if (!isMuted) {
    try {
      await handleSpeak(languageValue === "sw" ? "Tunaendelea." : "Resuming.");
    } catch (error) {}
  }
};

export const askConfirmation = async (
  value: string | number, 
  fieldName: string, 
  fieldLabel: string, 
  languageValue: string, 
  currentLanguage: any, 
  API_URL: string, 
  handleSpeak: (text: string) => Promise<void>,
  setVoiceModeState: (state: any) => void,
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  pausedRef: React.MutableRefObject<boolean>
): Promise<boolean> => {
  const displayValue = typeof value === 'number' 
    ? value 
    : getDisplayValue(fieldName, value as string, currentLanguage);
  
  const question = languageValue === "sw" 
    ? `${displayValue}?`
    : `${displayValue}?`;
  
  // Wait for confirmation question to finish speaking
  await handleSpeak(question);
  
  // Small delay to ensure speech completes
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
      
      setVoiceModeState((prev: any) => ({ ...prev, listening: true, status: languageValue === "sw" ? "Sema ndio au hapana" : "Say yes or no" }));

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
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
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
            setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
            resolve(true);
            return;
          }

          const data = await response.json();
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));

          if (data.success && data.text) {
            const parsed = parseSpokenInput(data.text, languageValue, 'select');
            if (parsed.type === 'number') {
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
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
          resolve(true);
        }
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 3000); // Reduced from 5s to 3s

    } catch (error) {
      setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
      resolve(false);
    }
  });
};

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
  setVoiceModeState: (state: any) => void,
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

  setVoiceModeState((prev: any) => ({ ...prev, currentField: fieldName }));

  const fieldInstructionKey = fieldName as keyof typeof currentLanguage.fieldInstructions;
  const instruction = currentLanguage.fieldInstructions[fieldInstructionKey];
  
  let finalInstruction = instruction;
  if (isRequired) {
    finalInstruction = languageValue === "sw" 
      ? `${instruction.replace("Sema 'ruka'", "")}`
      : `${instruction.replace("Say 'skip'", "")}`;
  }
  
  const announcement = `${fieldLabel}. ${finalInstruction}`;
  
  // IMPORTANT: Wait for speech to complete BEFORE starting recording
  await handleSpeak(announcement);
  
  // Add small delay to ensure speech has finished
  await new Promise(resolve => setTimeout(resolve, 500));

  while (pausedRef.current && voiceModeActiveRef.current) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  if (!voiceModeActiveRef.current) {
    return null;
  }

  return new Promise(async (resolve) => {
    try {
      isProcessingRef.current = true;
      
      // Start listening AFTER speech is done
      setVoiceModeState((prev: any) => ({ 
        ...prev, 
        listening: true, 
        status: languageValue === "sw" ? "Zungumza sasa" : "Speak now" 
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
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunks.length === 0 || !voiceModeActiveRef.current) {
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
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
            signal: AbortSignal.timeout(10000)
          });

          if (!response.ok) {
            setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
            isProcessingRef.current = false;
            await handleSpeak(languageValue === "sw" ? "Jaribu tena." : "Try again.");
            resolve(null);
            return;
          }

          const data = await response.json();
          
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;

          if (data.success && data.text) {
            const parsed = parseSpokenInput(data.text, languageValue, fieldType);
            
            if (parsed.type === 'skip') {
              if (isRequired) {
                await handleSpeak(languageValue === "sw" ? "Muhimu. Jaribu tena." : "Required. Try again.");
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
                    ? `${min} hadi ${max}. Jaribu tena.`
                    : `${min} to ${max}. Try again.`);
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
                await handleSpeak(languageValue === "sw" ? "Jaribu tena." : "Try again.");
                resolve(null);
              }
            } else {
              await handleSpeak(languageValue === "sw" ? "Jaribu tena." : "Try again.");
              resolve(null);
            }
          } else {
            await handleSpeak(languageValue === "sw" ? "Jaribu tena." : "Try again.");
            resolve(null);
          }
        } catch (error: any) {
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;
          await handleSpeak(languageValue === "sw" ? "Hitilafu. Jaribu tena." : "Error. Try again.");
          resolve(null);
        }
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
          mediaRecorder.stop();
        }
      }, 4000); // Reduced from 7s to 3s

    } catch (error) {
      setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
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
  voiceModeState: any;
  setVoiceModeState: (state: any) => void;
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

  setVoiceModeState((prev: any) => ({ ...prev, active: true }));
  voiceModeActiveRef.current = true;
  pausedRef.current = false;
  
  const welcome = languageValue === "sw"
    ? "Karibu. Tutaanza na sukari ya damu."
    : "Welcome. Let's start with blood glucose.";
  
  // Ensure welcome message completes before starting
  await handleSpeak(welcome);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const allFields = [
    { 
      name: "glucose", 
      label: currentLanguage.glucoseLabel,
      type: "number" as const,
      min: 20, 
      max: 600,
      required: true
    },
    { 
      name: "systolic", 
      label: currentLanguage.systolicLabel,
      type: "number" as const,
      min: 70, 
      max: 250,
      required: false
    },
    { 
      name: "diastolic", 
      label: currentLanguage.diastolicLabel,
      type: "number" as const,
      min: 40, 
      max: 150,
      required: false
    },
    { 
      name: "heartRate", 
      label: currentLanguage.heartRateLabel,
      type: "number" as const,
      min: 40, 
      max: 200,
      required: false
    },
    { 
      name: "context", 
      label: currentLanguage.contextLabel,
      type: "select" as const,
      required: true
    },
    { 
      name: "lastMealTime", 
      label: currentLanguage.lastMealLabel,
      type: "select" as const,
      required: true,
      dependsOn: "context",
      dependsValue: "Post-meal"
    },
    { 
      name: "mealType", 
      label: currentLanguage.mealTypeLabel,
      type: "select" as const,
      required: true,
      dependsOn: "context",
      dependsValue: "Post-meal"
    },
    { 
      name: "exerciseRecent", 
      label: currentLanguage.exerciseRecentLabel,
      type: "select" as const,
      required: true
    },
    { 
      name: "exerciseIntensity", 
      label: currentLanguage.exerciseIntensityLabel,
      type: "select" as const,
      required: true
    }
  ];

  for (const field of allFields) {
    if (!voiceModeActiveRef.current) break;
    
    while (pausedRef.current && voiceModeActiveRef.current) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (!voiceModeActiveRef.current) break;

    if (field.dependsOn && field.dependsValue) {
      const dependentValue = getValues(field.dependsOn);
      if (dependentValue !== field.dependsValue) {
        continue;
      }
    }

    let validInput = false;
    let attempts = 0;
    const maxAttempts = field.required ? 3 : 2; // Reduced from 5/2 to 3/2
    
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
          toast.success(`⏭️ ${field.label}: ${currentLanguage.skip}`, { duration: 2000 });
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
      
      toast.success(`✅ ${field.label}: ${displayValue}`, { duration: 2000 });
      
      if (!voiceModeState.muted && voiceModeActiveRef.current) {
        await handleSpeak(languageValue === "sw" ? `${displayValue}` : `${displayValue}`);
      }
      
      validInput = true;
    }
    
    if (!validInput && voiceModeActiveRef.current) {
      if (field.required) {
        const manualMsg = languageValue === "sw"
          ? `Weka ${field.label} mwenyewe.`
          : `Enter ${field.label} manually.`;
        
        toast.error(`❌ ${manualMsg}`, { duration: 4000 });
        
        if (!voiceModeState.muted) {
          await handleSpeak(manualMsg);
        }
        
        setVoiceModeState((prev: any) => ({ 
          ...prev, 
          active: false,
          listening: false,
          speaking: false,
          currentField: null, 
          status: "" 
        }));
        voiceModeActiveRef.current = false;
        pausedRef.current = false;
        return;
      }
    }

    if (voiceModeActiveRef.current) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
    }
  }

  if (voiceModeActiveRef.current) {
    const complete = languageValue === "sw"
      ? "Asante! Vimekamilika."
      : "Thank you! Complete.";
    
    await handleSpeak(complete);
    toast.success(currentLanguage.voiceComplete, { duration: 3000 });
  }
  
  setVoiceModeState((prev: any) => ({ 
    ...prev, 
    active: false, 
    currentField: null, 
    status: "",
    listening: false,
    speaking: false,
    paused: false
  }));
  voiceModeActiveRef.current = false;
  pausedRef.current = false;
};

export const stopVoiceMode = (params: {
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  pausedRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  currentLanguage: any;
  setVoiceModeState: (state: any) => void;
  handleSpeak: (text: string) => Promise<void>;
  isMuted: boolean;
}) => {
  const {
    voiceModeActiveRef,
    pausedRef,
    mediaRecorderRef,
    currentLanguage,
    setVoiceModeState,
    handleSpeak,
    isMuted
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
    handleSpeak(currentLanguage.voiceCancelled).catch(() => {});
  }
};