// apps/web/app/components/diabetesPages/utils/voiceUtils.ts
import { getDisplayValue } from './formUtils';

// Store the current audio element globally to control it
let currentAudio: HTMLAudioElement | null = null;

export const speak = async (
  text: string, 
  languageValue: string, 
  isMuted: boolean, 
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  pausedRef: React.MutableRefObject<boolean>,
  setState: (speaking: boolean, status: string) => void
): Promise<void> => {
  // Check if paused before starting
  if (pausedRef.current) {
    console.log("Cannot speak while paused");
    return Promise.resolve();
  }
  
  if (isMuted || !voiceModeActiveRef.current) return Promise.resolve();

  setState(true, languageValue === "sw" ? "Ninazungumza..." : "Speaking...");

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const synthesisLang = languageValue === "sw" ? "sw" : "en";
    
    console.log(`🔊 Speaking: "${text}" (lang: ${synthesisLang})`);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_URL}/api/python-speech/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language: synthesisLang }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("Speech synthesis failed:", response.status);
      setState(false, "");
      return Promise.resolve();
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    return new Promise<void>((resolve) => {
      // Check for pause during playback
      const checkPauseInterval = setInterval(() => {
        if (pausedRef.current) {
          console.log("Pause detected during speech, stopping audio");
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
      
      audio.onerror = (error) => {
        console.error("Audio playback error:", error);
        clearInterval(checkPauseInterval);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setState(false, "");
        resolve();
      };
      
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        clearInterval(checkPauseInterval);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        setState(false, "");
        resolve();
      });
    });
  } catch (error: any) {
    console.error("TTS Error:", error);
    setState(false, "");
    return Promise.resolve();
  }
};

// Function to stop any currently playing speech
export const stopCurrentSpeech = () => {
  if (currentAudio) {
    console.log("Stopping current speech");
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
    console.error("Error converting to WAV:", error);
    return webmBlob;
  }
};

export const parseSpokenInput = (text: string, languageValue: string, fieldType?: 'number' | 'select'): { type: 'number' | 'text' | 'skip' | 'unknown'; value?: number; textValue?: string } => {
  const lowerText = text.toLowerCase().trim();
  console.log(`DEBUG parseSpokenInput: text="${text}", lowerText="${lowerText}", fieldType=${fieldType}`);
  
  const skipWords = languageValue === "sw" 
    ? ['ruka', 'pass', 'next', 'none', 'sina', 'hapana']
    : ['skip', 'pass', 'next', 'none', "don't know", 'not sure'];
  
  if (skipWords.some(word => lowerText.includes(word))) {
    console.log(`DEBUG: Matched skip word`);
    return { type: 'skip' };
  }
  
  const yesWords = languageValue === "sw" 
    ? ['ndio', 'yes', 'correct', 'right', 'true', 'sawa']
    : ['yes', 'correct', 'right', 'true', 'yeah', 'yep'];
  
  const noWords = languageValue === "sw"
    ? ['hapana', 'no', 'wrong', 'incorrect', 'false', 'jaribu tena']
    : ['no', 'wrong', 'incorrect', 'false', 'nope', 'try again'];
  
  if (yesWords.some(word => lowerText.includes(word))) {
    console.log(`DEBUG: Matched yes word`);
    return { type: 'number', value: 1 };
  }
  if (noWords.some(word => lowerText.includes(word))) {
    console.log(`DEBUG: Matched no word`);
    return { type: 'number', value: 0 };
  }

  if (fieldType === 'select') {
    console.log(`DEBUG: Select field, returning full text: "${lowerText}"`);
    return { type: 'text', textValue: lowerText };
  }

  const numbers = lowerText.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const number = parseInt(numbers[0], 10);
    if (!isNaN(number) && number > 0) {
      console.log(`DEBUG: Parsed number: ${number}`);
      return { type: 'number', value: number };
    }
  }

  if (lowerText.length > 0) {
    console.log(`DEBUG: Returning text value: "${lowerText}"`);
    return { type: 'text', textValue: lowerText };
  }

  console.log(`DEBUG: Unknown input`);
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
        console.log(`DEBUG: Clear match found for "${spokenText}" -> "${option}"`);
        return true;
      }
    }
  }
  
  return false;
};

export const mapSpokenToOption = (spokenText: string, fieldName: string, currentLanguage: any): string | null => {
  console.log(`DEBUG mapSpokenToOption: fieldName="${fieldName}", spokenText="${spokenText}"`);
  
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
  
  if (keywords && keywords[fieldName]) {
    for (const option of options) {
      if (keywords[fieldName][option.dbValue]) {
        for (const keyword of keywords[fieldName][option.dbValue]) {
          const normalizedKeyword = keyword.toLowerCase().trim();
          
          if (lowerSpoken.includes(normalizedKeyword)) {
            console.log(`DEBUG: MATCH FOUND! Option: ${option.dbValue}`);
            return option.dbValue;
          }
        }
      }
    }
  }
  
  // Fallback matching for common patterns
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
    voiceModeActiveRef,
    pausedRef,
    mediaRecorderRef,
    setVoiceModeState,
    handleSpeak,
    languageValue,
    isMuted
  } = params;

  console.log("=== PAUSING VOICE MODE ===");
  
  pausedRef.current = true;
  
  if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
    try {
      mediaRecorderRef.current.stop();
    } catch (error) {
      console.log("Error stopping recorder:", error);
    }
  }
  
  stopCurrentSpeech();
  
  setVoiceModeState((prev: any) => ({ 
    ...prev, 
    paused: true,
    listening: false,
    speaking: false,
    status: languageValue === "sw" ? "Imesimamishwa" : "Paused"
  }));
  
  if (!isMuted) {
    setTimeout(() => {
      handleSpeak(
        languageValue === "sw" 
          ? "Nimesimama." 
          : "Paused."
      ).catch(error => console.error("Error speaking pause message:", error));
    }, 200);
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
    voiceModeActiveRef,
    pausedRef,
    setVoiceModeState,
    handleSpeak,
    languageValue,
    isMuted,
    currentField
  } = params;

  console.log("=== RESUMING VOICE MODE ===");
  
  pausedRef.current = false;
  
  setVoiceModeState((prev: any) => ({ 
    ...prev, 
    paused: false,
    listening: false,
    speaking: false,
    status: languageValue === "sw" ? "Inaendelea..." : "Resuming..."
  }));
  
  if (!isMuted) {
    try {
      const resumeMsg = languageValue === "sw" ? "Tunaendelea." : "Resuming.";
      await handleSpeak(resumeMsg);
    } catch (error) {
      console.error("Error speaking resume message:", error);
    }
  }
  
  setTimeout(() => {
    setVoiceModeState((prev: any) => ({ 
      ...prev, 
      status: ""
    }));
  }, 1000);
};

// ============= ASK CONFIRMATION =============
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
    ? `${currentLanguage.confirmQuestion} ${displayValue}? Sema 'ndio' au 'hapana'`
    : `${currentLanguage.confirmQuestion} ${displayValue}? Say 'yes' or 'no'`;
  
  console.log(`DEBUG askConfirmation: Asking: "${question}"`);
  await handleSpeak(question);
  
  return new Promise(async (resolve) => {
    try {
      // Check pause status before starting
      while (pausedRef.current && voiceModeActiveRef.current) {
        console.log(`DEBUG: Voice mode paused during confirmation, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!voiceModeActiveRef.current) {
        console.log(`DEBUG: Voice mode cancelled during confirmation`);
        resolve(false);
        return;
      }
      
      setVoiceModeState((prev: any) => ({ ...prev, listening: true, status: languageValue === "sw" ? "Ninasikiliza uthibitisho..." : "Listening for confirmation..." }));

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
          console.log(`DEBUG: No audio chunks or voice mode cancelled`);
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

          console.log(`DEBUG: Sending confirmation audio to transcription API, size: ${wavBlob.size} bytes`);
          const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(10000)
          });

          if (!response.ok) {
            console.error(`DEBUG: Confirmation API error: HTTP ${response.status}`);
            setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
            resolve(true); // Auto-confirm on API error
            return;
          }

          const data = await response.json();
          console.log(`DEBUG: Confirmation transcription result:`, data);
          
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));

          if (data.success && data.text) {
            const parsed = parseSpokenInput(data.text, languageValue, 'select');
            console.log(`DEBUG: Confirmation parsed input:`, parsed);
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
            console.log(`DEBUG: Confirmation failed - no text in response`);
            resolve(true); // Auto-confirm
          }
        } catch (error: any) {
          console.error("Confirmation error:", error);
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
          resolve(true); // Auto-confirm on error
        }
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          console.log(`DEBUG: Confirmation recording timeout`);
          mediaRecorder.stop();
        }
      }, 5000);

    } catch (error) {
      console.error("Confirmation setup error:", error);
      setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
      resolve(false);
    }
  });
};

// ============= LISTEN FOR FIELD =============
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
  console.log(`DEBUG listenForField: Starting for field "${fieldName}" (${fieldLabel}), required: ${isRequired}`);
  
  // Check if paused before starting
  while (pausedRef.current && voiceModeActiveRef.current) {
    console.log(`DEBUG: Voice mode paused, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (isProcessingRef.current || !voiceModeActiveRef.current) {
    console.log(`DEBUG: Already processing or voice mode not active`);
    return null;
  }

  if (fieldRefs.current[fieldName]) {
    fieldRefs.current[fieldName]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  setVoiceModeState((prev: any) => ({ ...prev, currentField: fieldName }));

  const fieldInstructionKey = fieldName as keyof typeof currentLanguage.fieldInstructions;
  const instruction = currentLanguage.fieldInstructions[fieldInstructionKey];
  
  const requiredNote = isRequired ? 
    (languageValue === "sw" ? " (Sehemu hii ni muhimu)" : " (This field is required)") : 
    "";
  
  let finalInstruction = instruction;
  if (isRequired) {
    finalInstruction = languageValue === "sw" 
      ? `Sehemu hii ni muhimu. ${instruction.replace("Sema 'ruka'", "Haiwezi kurukwa")}`
      : `This field is required. ${instruction.replace("Say 'skip'", "Cannot be skipped")}`;
  } else {
    finalInstruction = languageValue === "sw"
      ? `${instruction} Unaweza kusema 'ruka' kama huna kipimo hiki.`
      : `${instruction} You can say 'skip' if you don't have this measurement.`;
  }
  
  const announcement = `${fieldLabel}${requiredNote}. ${finalInstruction}`;
  console.log(`DEBUG: Speaking announcement: "${announcement}"`);
  await handleSpeak(announcement);

  // Check pause status after speaking
  while (pausedRef.current && voiceModeActiveRef.current) {
    console.log(`DEBUG: Voice mode paused after announcement, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!voiceModeActiveRef.current) {
    console.log(`DEBUG: Voice mode cancelled during speaking`);
    return null;
  }

  return new Promise(async (resolve) => {
    try {
      isProcessingRef.current = true;
      setVoiceModeState((prev: any) => ({ 
        ...prev, 
        listening: true, 
        status: languageValue === "sw" ? "Ninasikiliza sasa... Tafadhali zungumza." : "Listening now... Please speak." 
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
          console.log(`DEBUG: No audio chunks or voice mode cancelled`);
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;
          resolve(null);
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log(`DEBUG: Audio recorded, size: ${audioBlob.size} bytes`);

        try {
          const wavBlob = await convertWebmToWav(audioBlob);
          
          const formData = new FormData();
          formData.append("audio", wavBlob, "recording.wav");
          formData.append("language", languageValue);

          console.log(`DEBUG: Sending to transcription API`);
          const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(15000)
          });

          if (!response.ok) {
            console.error(`DEBUG: Transcription API error: HTTP ${response.status}`);
            setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
            isProcessingRef.current = false;
            const errorMsg = languageValue === "sw"
              ? "Kumetokea hitilafu. Tafadhali jaribu tena."
              : "An error occurred. Please try again.";
            await handleSpeak(errorMsg);
            resolve(null);
            return;
          }

          const data = await response.json();
          console.log(`DEBUG: Transcription response:`, data);
          
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;

          if (data.success && data.text) {
            const parsed = parseSpokenInput(data.text, languageValue, fieldType);
            console.log(`DEBUG: Parsed input:`, parsed);
            
            if (parsed.type === 'skip') {
              if (isRequired) {
                const requiredMsg = languageValue === "sw"
                  ? "Sehemu hii ni muhimu na haiwezi kurukwa. Tafadhali jaribu tena."
                  : "This field is required and cannot be skipped. Please try again.";
                console.log(`DEBUG: Required field attempted to skip`);
                await handleSpeak(requiredMsg);
                resolve(null);
              } else {
                console.log(`DEBUG: Skipping optional field`);
                resolve('skip');
              }
            } else if (parsed.type === 'number' && parsed.value !== undefined) {
              console.log(`DEBUG: Got number value: ${parsed.value}`);
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
                    console.log(`DEBUG: Confirmed number value: ${parsed.value}`);
                    resolve(parsed.value);
                  } else {
                    console.log(`DEBUG: Number confirmation failed`);
                    resolve(null);
                  }
                } else {
                  const rangeMsg = languageValue === "sw"
                    ? `Thamani ${parsed.value} iko nje ya anuwai. Inapaswa kuwa kati ya ${min} na ${max}. Jaribu tena.`
                    : `Value ${parsed.value} is out of range. Should be between ${min} and ${max}. Please try again.`;
                  console.log(`DEBUG: Value out of range: ${parsed.value} not in [${min}, ${max}]`);
                  await handleSpeak(rangeMsg);
                  resolve(null);
                }
              } else {
                console.log(`DEBUG: Field type mismatch or no min/max defined`);
                resolve(null);
              }
            } else if (parsed.type === 'text' && parsed.textValue && fieldType === 'select') {
              console.log(`DEBUG: Got text value: "${parsed.textValue}" for select field ${fieldName}`);
              const mappedValue = mapSpokenToOption(parsed.textValue, fieldName, currentLanguage);
              console.log(`DEBUG: Mapped "${parsed.textValue}" to: ${mappedValue}`);
              
              if (mappedValue) {
                const isClearMatch = checkIfClearMatch(parsed.textValue, fieldName, currentLanguage);
                
                if (isClearMatch) {
                  console.log(`DEBUG: Clear match detected, skipping confirmation`);
                  resolve(mappedValue);
                } else {
                  const displayValue = getDisplayValue(fieldName, mappedValue, currentLanguage);
                  console.log(`DEBUG: Display value for ${mappedValue}: ${displayValue}`);
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
                    console.log(`DEBUG: Confirmed mapped value: ${mappedValue}`);
                    resolve(mappedValue);
                  } else {
                    console.log(`DEBUG: Mapped value confirmation failed`);
                    resolve(null);
                  }
                }
              } else {
                const optionsMsg = isRequired
                  ? (languageValue === "sw"
                    ? "Sikuelewa. Tafadhali jaribu tena."
                    : "I didn't understand. Please try again.")
                  : (languageValue === "sw"
                    ? "Sikuelewa. Tafadhali jaribu tena au sema 'ruka'."
                    : "I didn't understand. Please try again or say 'skip'.");
                console.log(`DEBUG: Could not map text to option`);
                await handleSpeak(optionsMsg);
                resolve(null);
              }
            } else {
              const retryMsg = isRequired
                ? (languageValue === "sw"
                  ? "Sikukusikia vizuri. Tafadhali jaribu tena."
                  : "I didn't hear you clearly. Please try again.")
                : (languageValue === "sw"
                  ? "Sikukusikia vizuri. Tafadhali jaribu tena au sema 'ruka'."
                  : "I didn't hear you clearly. Please try again or say 'skip'.");
              console.log(`DEBUG: Could not understand input`);
              await handleSpeak(retryMsg);
              resolve(null);
            }
          } else {
            const errorMsg = languageValue === "sw"
              ? "Kumetokea hitilafu. Tafadhali jaribu tena."
              : "An error occurred. Please try again.";
            console.log(`DEBUG: Transcription failed`);
            await handleSpeak(errorMsg);
            resolve(null);
          }
        } catch (error: any) {
          console.error("STT Error:", error);
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;
          const errorMsg = languageValue === "sw"
            ? "Hitilafu ya kiufundi. Tafadhali jaribu tena."
            : "Technical error. Please try again.";
          await handleSpeak(errorMsg);
          resolve(null);
        }
      };

      mediaRecorder.start();
      console.log(`DEBUG: Started recording for field "${fieldName}"`);
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
          console.log(`DEBUG: Recording timeout for field "${fieldName}"`);
          mediaRecorder.stop();
        }
      }, 7000);

    } catch (error) {
      console.error("Listen Error:", error);
      setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
      isProcessingRef.current = false;
      resolve(null);
    }
  });
};

// ============= START VOICE MODE =============
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

  console.log("=== STARTING VOICE MODE ===");
  setVoiceModeState((prev: any) => ({ ...prev, active: true }));
  voiceModeActiveRef.current = true;
  pausedRef.current = false;
  
  const welcome = languageValue === "sw"
    ? "Karibu. Nitakusaidia kuweka vipimo vyako vya kiafya. Sehemu muhimu zisizoweza kurukwa zitahitaji thamani halisi. Sehemu za hiari zinaweza kurukwa kwa kusema 'ruka'. Tutaanza na sukari ya damu."
    : "Welcome. I will help you enter your health measurements. Required fields cannot be skipped and need actual values. Optional fields can be skipped by saying 'skip'. Let's start with blood glucose.";
  
  await handleSpeak(welcome);
  
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
    // Check if voice mode is still active
    if (!voiceModeActiveRef.current) {
      console.log("Voice mode cancelled, breaking loop");
      break;
    }
    
    // Wait while paused
    while (pausedRef.current && voiceModeActiveRef.current) {
      console.log(`Voice mode paused at field: ${field.name}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check again after pause
    if (!voiceModeActiveRef.current) {
      console.log("Voice mode cancelled during pause, breaking loop");
      break;
    }

    if (field.dependsOn && field.dependsValue) {
      const dependentValue = getValues(field.dependsOn);
      console.log(`Checking dependency: ${field.name} depends on ${field.dependsOn}=${dependentValue}, needs ${field.dependsValue}`);
      if (dependentValue !== field.dependsValue) {
        console.log(`Skipping ${field.name} because ${field.dependsOn} is ${dependentValue}`);
        continue;
      }
    }

    let validInput = false;
    let attempts = 0;
    const maxAttempts = field.required ? 5 : 2;
    
    while (!validInput && attempts < maxAttempts && voiceModeActiveRef.current) {
      // Wait while paused
      while (pausedRef.current && voiceModeActiveRef.current) {
        console.log(`Voice mode paused during field attempt: ${field.name}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check again after pause
      if (!voiceModeActiveRef.current) {
        console.log("Voice mode cancelled during pause, breaking attempt loop");
        break;
      }
      
      console.log(`Listening for ${field.name}, attempt ${attempts + 1}, required: ${field.required}`);
      
      // Call listenForField with individual parameters
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
      
      if (!voiceModeActiveRef.current) {
        console.log("Voice mode cancelled during listening");
        break;
      }
      
      if (result === null) {
        console.log("No input received");
        if (!voiceModeState.muted && voiceModeActiveRef.current) {
          if (field.required) {
            const requiredMsg = languageValue === "sw"
              ? `Sehemu hii ni muhimu. Jaribu la ${attempts + 1} kati ya ${maxAttempts}.`
              : `This field is required. Attempt ${attempts + 1} of ${maxAttempts}.`;
            await handleSpeak(requiredMsg);
          } else {
            await handleSpeak(languageValue === "sw" 
              ? "Sikukusikia. Tafadhali jaribu tena." 
              : "I didn't hear you. Please try again."
            );
          }
        }
        attempts++;
        continue;
      }

      if (result === 'skip') {
        if (!field.required) {
          console.log(`User skipped optional field: ${field.name}`);
          const skipMsg = languageValue === "sw"
            ? "Kumekwisha ruka."
            : "Skipped.";
          
          toast.success(`⏭️ ${field.label}: ${currentLanguage.skip}`, { duration: 3000 });
          
          if (!voiceModeState.muted && voiceModeActiveRef.current) {
            await handleSpeak(skipMsg);
          }
          
          validInput = true;
          break;
        } else {
          console.log(`Required field attempted to be skipped: ${field.name}`);
          const requiredMsg = languageValue === "sw"
            ? "Sehemu hii ni muhimu na haiwezi kurukwa. Tafadhali jaribu tena."
            : "This field is required and cannot be skipped. Please try again.";
          
          if (!voiceModeState.muted && voiceModeActiveRef.current) {
            await handleSpeak(requiredMsg);
          }
          
          attempts++;
          continue;
        }
      }

      console.log(`Setting value for ${field.name} to:`, result);
      setValue(field.name, result as any);
      
      const displayValue = typeof result === 'number' 
        ? result 
        : getDisplayValue(field.name, result as string, currentLanguage);
      
      const successMsg = languageValue === "sw"
        ? `Imewekwa ${displayValue}`
        : `Set to ${displayValue}`;
      
      toast.success(`✅ ${field.label}: ${displayValue}`, { duration: 3000 });
      
      if (!voiceModeState.muted && voiceModeActiveRef.current) {
        await handleSpeak(successMsg);
      }
      
      validInput = true;
    }
    
    if (!validInput && voiceModeActiveRef.current) {
      console.log(`Failed to get input for ${field.name} after ${maxAttempts} attempts`);
      if (field.required) {
        const manualMsg = languageValue === "sw"
          ? `Haiwezekani kukusikia kwa ${field.label}. Tafadhali weka ${field.label} mwenyewe kwenye fomu kabla ya kuwasilisha.`
          : `Could not hear your ${field.label}. Please enter ${field.label} manually in the form before submitting.`;
        
        toast.error(`❌ ${manualMsg}`, { duration: 5000 });
        
        if (!voiceModeState.muted) {
          await handleSpeak(manualMsg);
        }
        
        const stopMsg = languageValue === "sw"
          ? "Nitaacha hali ya sauti. Tafadhali tumia fomu mwenyewe."
          : "I will stop voice mode. Please use the form directly.";
        
        await handleSpeak(stopMsg);
        
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
      } else {
        const moveOnMsg = languageValue === "sw"
          ? "Tutaenda kwenye kipimo kifuatacho."
          : "Let's move to the next measurement.";
        
        if (!voiceModeState.muted) {
          await handleSpeak(moveOnMsg);
        }
      }
    }

    if (voiceModeActiveRef.current) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (voiceModeActiveRef.current) {
    console.log("Voice mode completed successfully");
    const complete = languageValue === "sw"
      ? "Asante! Vipimo vyote vimekamilika. Sasa unaweza kuchagua kupata uchambuzi wa AI na kisha kubonyeza 'Wasilisha Viwango vya Kiafya'."
      : "Thank you! All measurements complete. You can now choose to get AI insights and then click 'Submit Vitals'.";
    
    await handleSpeak(complete);
    toast.success(currentLanguage.voiceComplete, { duration: 5000 });
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

// ============= STOP VOICE MODE =============
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

  console.log("=== STOPPING VOICE MODE ===");
  
  // Stop any current speech
  stopCurrentSpeech();
  
  if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
    try {
      mediaRecorderRef.current.stop();
    } catch (error) {
      console.log("Error stopping recorder:", error);
    }
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
    handleSpeak(currentLanguage.voiceCancelled).catch(error => 
      console.error("Error speaking stop message:", error)
    );
  }
};