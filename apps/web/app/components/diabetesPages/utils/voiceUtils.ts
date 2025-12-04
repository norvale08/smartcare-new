// apps/web/app/components/diabetesPages/utils/voiceUtils.ts
import { getDisplayValue } from './formUtils';
import { diabetesValidationRules } from './formUtils';

export const speak = async (
  text: string, 
  languageValue: string, 
  isMuted: boolean, 
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  setState: (speaking: boolean, status: string) => void
): Promise<void> => {
  if (isMuted || !voiceModeActiveRef.current) return Promise.resolve();

  return new Promise((resolve) => {
    try {
      setState(true, languageValue === "sw" ? "Ninazungumza..." : "Speaking...");
      window.speechSynthesis?.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageValue === "sw" ? "sw-KE" : "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setState(false, "");
        resolve();
      };

      utterance.onerror = () => {
        setState(false, "");
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setState(false, "");
      resolve();
    }
  });
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
  
  // Check for skip commands
  const skipWords = languageValue === "sw" 
    ? ['ruka', 'pass', 'next', 'none', 'sina', 'hapana']
    : ['skip', 'pass', 'next', 'none', "don't know", 'not sure'];
  
  if (skipWords.some(word => lowerText.includes(word))) {
    console.log(`DEBUG: Matched skip word`);
    return { type: 'skip' };
  }
  
  // Check for yes/no confirmation
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

  // For SELECT fields, we should return text even if it contains numbers
  if (fieldType === 'select') {
    // For select fields, return the full text for mapping
    console.log(`DEBUG: Select field, returning full text: "${lowerText}"`);
    return { type: 'text', textValue: lowerText };
  }

  // For NUMBER fields, parse numbers
  const numbers = lowerText.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const number = parseInt(numbers[0], 10);
    if (!isNaN(number) && number > 0) {
      console.log(`DEBUG: Parsed number: ${number}`);
      return { type: 'number', value: number };
    }
  }

  // For text inputs, return the text
  if (lowerText.length > 0) {
    console.log(`DEBUG: Returning text value: "${lowerText}"`);
    return { type: 'text', textValue: lowerText };
  }

  console.log(`DEBUG: Unknown input`);
  return { type: 'unknown' };
};

// Helper function to check if a match is clear
const checkIfClearMatch = (spokenText: string, fieldName: string, currentLanguage: any): boolean => {
  const lowerText = spokenText.toLowerCase();
  const keywords = currentLanguage.optionKeywords;
  
  if (!keywords || !keywords[fieldName]) return false;
  
  // Check if the spoken text clearly matches one option
  for (const option in keywords[fieldName]) {
    for (const keyword of keywords[fieldName][option]) {
      const normalizedKeyword = keyword.toLowerCase().trim();
      // If it's an exact or very close match
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
  console.log(`DEBUG Keywords for ${fieldName}:`, keywords ? keywords[fieldName] || keywords : 'No keywords found');
  
  // Get all possible options for this field
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
      console.log(`DEBUG: No mapping for field ${fieldName}`);
      return null;
  }
  
  const lowerSpoken = spokenText.toLowerCase().trim();
  console.log(`DEBUG: Lower spoken text: "${lowerSpoken}"`);
  console.log(`DEBUG: Options:`, options);
  
  // First check each option's keywords
  if (keywords && keywords[fieldName]) {
    for (const option of options) {
      if (keywords[fieldName][option.dbValue]) {
        for (const keyword of keywords[fieldName][option.dbValue]) {
          const normalizedKeyword = keyword.toLowerCase().trim();
          console.log(`DEBUG: Checking keyword "${normalizedKeyword}" against "${lowerSpoken}"`);
          
          // Check for exact match or partial match
          if (lowerSpoken.includes(normalizedKeyword)) {
            console.log(`DEBUG: MATCH FOUND! Option: ${option.dbValue}`);
            return option.dbValue;
          }
        }
      } else {
        console.log(`DEBUG: No keywords found for option "${option.dbValue}" in field "${fieldName}"`);
      }
    }
  }
  
  // Additional fallback matching for common patterns
  console.log(`DEBUG: No keyword match found, trying fallback matching...`);
  
  if (fieldName === 'context') {
    if (lowerSpoken.includes('fasting') || lowerSpoken.includes('fast') || lowerSpoken.includes('empty') || lowerSpoken.includes('morning')) {
      console.log(`DEBUG: Fallback match for context: fasting -> Fasting`);
      return 'Fasting';
    }
    if (lowerSpoken.includes('post') || lowerSpoken.includes('after') || lowerSpoken.includes('meal') || lowerSpoken.includes('eat')) {
      console.log(`DEBUG: Fallback match for context: post meal -> Post-meal`);
      return 'Post-meal';
    }
    if (lowerSpoken.includes('random') || lowerSpoken.includes('anytime') || lowerSpoken.includes('any')) {
      console.log(`DEBUG: Fallback match for context: random -> Random`);
      return 'Random';
    }
  }
  
  if (fieldName === 'lastMealTime') {
    if (lowerSpoken.includes('2') || lowerSpoken.includes('two') || lowerSpoken.includes('recent') || lowerSpoken.includes('just') || lowerSpoken.includes('couple')) {
      console.log(`DEBUG: Fallback match for lastMealTime: 2 hours -> 2_hours`);
      return '2_hours';
    }
    if (lowerSpoken.includes('4') || lowerSpoken.includes('four') || lowerSpoken.includes('few')) {
      console.log(`DEBUG: Fallback match for lastMealTime: 4 hours -> 4_hours`);
      return '4_hours';
    }
    if (lowerSpoken.includes('6') || lowerSpoken.includes('six') || lowerSpoken.includes('half') || lowerSpoken.includes('several')) {
      console.log(`DEBUG: Fallback match for lastMealTime: 6 hours -> 6_hours`);
      return '6_hours';
    }
    if (lowerSpoken.includes('more') || lowerSpoken.includes('over') || lowerSpoken.includes('long') || lowerSpoken.includes('many') || lowerSpoken.includes('hours ago')) {
      console.log(`DEBUG: Fallback match for lastMealTime: more than 6 hours -> more_than_6_hours`);
      return 'more_than_6_hours';
    }
    if (lowerSpoken.includes('hour')) {
      // Try to extract number from phrases like "3 hours ago"
      const hourMatch = lowerSpoken.match(/(\d+)\s*hour/);
      if (hourMatch && hourMatch[1]) {
        const hours = parseInt(hourMatch[1], 10);
        if (hours <= 2) return '2_hours';
        if (hours <= 4) return '4_hours';
        if (hours <= 6) return '6_hours';
        return 'more_than_6_hours';
      }
    }
  }
  
  if (fieldName === 'mealType') {
    if (lowerSpoken.includes('carb') || lowerSpoken.includes('bread') || lowerSpoken.includes('rice') || lowerSpoken.includes('pasta')) {
      return 'carbohydrates';
    }
    if (lowerSpoken.includes('sugar') || lowerSpoken.includes('soda') || lowerSpoken.includes('juice') || lowerSpoken.includes('drink')) {
      return 'sugary_drinks';
    }
    if (lowerSpoken.includes('protein') || lowerSpoken.includes('meat') || lowerSpoken.includes('chicken') || lowerSpoken.includes('fish')) {
      return 'proteins';
    }
    if (lowerSpoken.includes('vegetable') || lowerSpoken.includes('salad') || lowerSpoken.includes('green') || lowerSpoken.includes('veggie')) {
      return 'vegetables';
    }
    if (lowerSpoken.includes('mixed') || lowerSpoken.includes('combination') || lowerSpoken.includes('everything') || lowerSpoken.includes('balanced')) {
      return 'mixed_meal';
    }
  }
  
  if (fieldName === 'exerciseRecent') {
    if (lowerSpoken.includes('none') || lowerSpoken.includes('no') || lowerSpoken.includes('not') || lowerSpoken.includes('didnt')) {
      console.log(`DEBUG: Fallback match for exerciseRecent: none -> none`);
      return 'none';
    }
    if (lowerSpoken.includes('within') || lowerSpoken.includes('2') || lowerSpoken.includes('two') || lowerSpoken.includes('recent') || lowerSpoken.includes('just')) {
      console.log(`DEBUG: Fallback match for exerciseRecent: within 2 hours -> within_2_hours`);
      return 'within_2_hours';
    }
    if (lowerSpoken.includes('2 to 6') || lowerSpoken.includes('two to six') || lowerSpoken.includes('2-6') || lowerSpoken.includes('few hour') || lowerSpoken.includes('several hour')) {
      console.log(`DEBUG: Fallback match for exerciseRecent: 2 to 6 hours -> 2_to_6_hours`);
      return '2_to_6_hours';
    }
    if (lowerSpoken.includes('6 to 24') || lowerSpoken.includes('six to twenty four') || lowerSpoken.includes('6-24') || lowerSpoken.includes('yesterday') || lowerSpoken.includes('last day') || lowerSpoken.includes('earlier')) {
      console.log(`DEBUG: Fallback match for exerciseRecent: 6 to 24 hours -> 6_to_24_hours`);
      return '6_to_24_hours';
    }
  }
  
  if (fieldName === 'exerciseIntensity') {
    if (lowerSpoken.includes('light') || lowerSpoken.includes('walk') || lowerSpoken.includes('easy') || lowerSpoken.includes('gentle')) {
      return 'light';
    }
    if (lowerSpoken.includes('moderate') || lowerSpoken.includes('brisk') || lowerSpoken.includes('medium') || lowerSpoken.includes('cycle')) {
      return 'moderate';
    }
    if (lowerSpoken.includes('vigorous') || lowerSpoken.includes('run') || lowerSpoken.includes('hard') || lowerSpoken.includes('intense')) {
      return 'vigorous';
    }
  }
  
  console.log(`DEBUG: No match found for "${spokenText}" in field "${fieldName}"`);
  return null;
};

export const askConfirmation = async (
  value: string | number, 
  fieldName: string, 
  fieldLabel: string, 
  languageValue: string, 
  currentLanguage: any, 
  API_URL: string, 
  handleSpeak: (text: string) => Promise<void>,
  setVoiceModeState: (state: any) => void
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
        
        if (audioChunks.length === 0) {
          console.log(`DEBUG: No audio chunks for confirmation`);
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
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000)
          });

          if (!response.ok) {
            console.error(`DEBUG: Confirmation API error: HTTP ${response.status}`);
            // Try to get error details from response
            let errorDetails = '';
            try {
              const errorData = await response.text();
              errorDetails = errorData;
            } catch (e) {
              errorDetails = 'No error details available';
            }
            console.error(`DEBUG: Error details: ${errorDetails}`);
            
            // Auto-confirm if API fails to prevent breaking the flow
            console.log(`DEBUG: Auto-confirming due to API error (HTTP ${response.status})`);
            setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
            
            // For testing: auto-confirm to continue flow
            // In production, you might want to resolve(false) to ask again
            resolve(true); // Auto-confirm to continue
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
              // Check for yes/no words in text
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
                // If unclear, default to false (ask again)
                resolve(false);
              }
            } else {
              resolve(false);
            }
          } else {
            console.log(`DEBUG: Confirmation failed - no text in response`);
            // Auto-confirm if no response to continue flow
            resolve(true);
          }
        } catch (error: any) {
          console.error("Confirmation error:", error);
          if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            console.log(`DEBUG: Confirmation API timeout`);
          }
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, status: "" }));
          // Auto-confirm on error to prevent breaking flow
          resolve(true);
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

export const listenForField = async (params: {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'number' | 'select';
  min?: number;
  max?: number;
  languageValue: string;
  currentLanguage: any;
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  isProcessingRef: React.MutableRefObject<boolean>;
  setVoiceModeState: (state: any) => void;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  API_URL: string;
  fieldRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  handleSpeak: (text: string) => Promise<void>;
  isRequired: boolean;
}): Promise<string | number | 'skip' | null> => {
  const {
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
  } = params;

  console.log(`DEBUG listenForField: Starting for field "${fieldName}" (${fieldLabel}), required: ${isRequired}`);
  
  if (isProcessingRef.current || !voiceModeActiveRef.current) {
    console.log(`DEBUG: Already processing or voice mode not active`);
    return null;
  }

  // Scroll to field and highlight
  if (fieldRefs.current[fieldName]) {
    fieldRefs.current[fieldName]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  setVoiceModeState((prev: any) => ({ ...prev, currentField: fieldName }));

  // Announce field with instructions
  const fieldInstructionKey = fieldName as keyof typeof currentLanguage.fieldInstructions;
  const instruction = currentLanguage.fieldInstructions[fieldInstructionKey];
  
  // For required fields, don't mention skipping
  const requiredNote = isRequired ? 
    (languageValue === "sw" ? " (Sehemu hii ni muhimu)" : " (This field is required)") : 
    "";
  
  // Modify instructions for required fields
  let finalInstruction = instruction;
  if (isRequired) {
    finalInstruction = languageValue === "sw" 
      ? `Sehemu hii ni muhimu. ${instruction.replace("Sema 'ruka'", "Haiwezi kurukwa")}`
      : `This field is required. ${instruction.replace("Say 'skip'", "Cannot be skipped")}`;
  } else {
    // For optional fields, mention skipping
    finalInstruction = languageValue === "sw"
      ? `${instruction} Unaweza kusema 'ruka' kama huna kipimo hiki.`
      : `${instruction} You can say 'skip' if you don't have this measurement.`;
  }
  
  const announcement = `${fieldLabel}${requiredNote}. ${finalInstruction}`;
  console.log(`DEBUG: Speaking announcement: "${announcement}"`);
  await handleSpeak(announcement);

  // Check if voice mode is still active after speaking
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
              // For required fields, don't allow skipping
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
                    setVoiceModeState
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
                // Check if it's a clear match
                const isClearMatch = checkIfClearMatch(parsed.textValue, fieldName, currentLanguage);
                
                if (isClearMatch) {
                  // Skip confirmation for clear matches to avoid API errors
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
                    setVoiceModeState
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

export const startVoiceMode = async (params: {
  languageValue: string;
  currentLanguage: any;
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  voiceModeState: any;
  setVoiceModeState: (state: any) => void;
  setValue: any;
  getValues: any;
  toast: any;
  handleSpeak: (text: string) => Promise<void>;
  listenForField: any;
}) => {
  const {
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
  } = params;

  console.log("Starting voice mode...");
  setVoiceModeState((prev: any) => ({ ...prev, active: true }));
  voiceModeActiveRef.current = true;
  
  const welcome = languageValue === "sw"
    ? "Karibu. Nitakusaidia kuweka vipimo vyako vya kiafya. Sehemu muhimu zisizoweza kurukwa zitahitaji thamani halisi. Sehemu za hiari zinaweza kurukwa kwa kusema 'ruka'. Tutaanza na sukari ya damu."
    : "Welcome. I will help you enter your health measurements. Required fields cannot be skipped and need actual values. Optional fields can be skipped by saying 'skip'. Let's start with blood glucose.";
  
  await handleSpeak(welcome);
  
  // Define ALL fields with correct required status based on validation rules
  const allFields = [
    // Vital measurements - only glucose is required
    { 
      name: "glucose", 
      label: currentLanguage.glucoseLabel,
      type: "number" as const,
      min: 20, 
      max: 600,
      required: true // Only glucose has required: "Glucose level is required"
    },
    { 
      name: "systolic", 
      label: currentLanguage.systolicLabel,
      type: "number" as const,
      min: 70, 
      max: 250,
      required: false // No required validation for systolic
    },
    { 
      name: "diastolic", 
      label: currentLanguage.diastolicLabel,
      type: "number" as const,
      min: 40, 
      max: 150,
      required: false // No required validation for diastolic
    },
    { 
      name: "heartRate", 
      label: currentLanguage.heartRateLabel,
      type: "number" as const,
      min: 40, 
      max: 200,
      required: false // No required validation for heartRate
    },
    // Measurement context (required)
    { 
      name: "context", 
      label: currentLanguage.contextLabel,
      type: "select" as const,
      required: true // context has required: "Please select a context"
    },
    // Meal details (conditional - only required if context is Post-meal)
    { 
      name: "lastMealTime", 
      label: currentLanguage.lastMealLabel,
      type: "select" as const,
      required: true, // lastMealTime has required: "Please select when you last ate"
      dependsOn: "context",
      dependsValue: "Post-meal"
    },
    { 
      name: "mealType", 
      label: currentLanguage.mealTypeLabel,
      type: "select" as const,
      required: true, // mealType has required: "Please select the meal type"
      dependsOn: "context",
      dependsValue: "Post-meal"
    },
    // Exercise info (required)
    { 
      name: "exerciseRecent", 
      label: currentLanguage.exerciseRecentLabel,
      type: "select" as const,
      required: true // exerciseRecent has required: "Please indicate if you exercised recently"
    },
    { 
      name: "exerciseIntensity", 
      label: currentLanguage.exerciseIntensityLabel,
      type: "select" as const,
      required: true // exerciseIntensity has required: "Please select the exercise intensity"
    }
  ];

  // Process all fields
  for (const field of allFields) {
    // Check if voice mode is still active
    if (!voiceModeActiveRef.current) {
      console.log("Voice mode cancelled, breaking loop");
      break;
    }

    // Check if field should be shown based on dependencies
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
    const maxAttempts = field.required ? 5 : 2; // More attempts for required fields
    
    while (!validInput && attempts < maxAttempts && voiceModeActiveRef.current) {
      console.log(`Listening for ${field.name}, attempt ${attempts + 1}, required: ${field.required}`);
      const result = await listenForField(
        field.name, 
        field.label, 
        field.type,
        field.min,
        field.max,
        field.required
      );
      
      // Check if voice mode was cancelled during listening
      if (!voiceModeActiveRef.current) {
        console.log("Voice mode cancelled during listening");
        break;
      }
      
      if (result === null) {
        // No input received
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
        // Skip command received - only allowed for optional fields
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
          // Required field attempted to be skipped - try again
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

      // Valid value received
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
        // For required fields that couldn't be filled, ask user to enter manually
        const manualMsg = languageValue === "sw"
          ? `Haiwezekani kukusikia kwa ${field.label}. Tafadhali weka ${field.label} mwenyewe kwenye fomu kabla ya kuwasilisha.`
          : `Could not hear your ${field.label}. Please enter ${field.label} manually in the form before submitting.`;
        
        toast.error(`❌ ${manualMsg}`, { duration: 5000 });
        
        if (!voiceModeState.muted) {
          await handleSpeak(manualMsg);
        }
        
        // Stop voice mode for this required field
        const stopMsg = languageValue === "sw"
          ? "Nitaacha hali ya sauti. Tafadhali tumia fomu mwenyewe."
          : "I will stop voice mode. Please use the form directly.";
        
        await handleSpeak(stopMsg);
        
        // Stop voice mode completely
        setVoiceModeState((prev: any) => ({ 
          ...prev, 
          active: false,
          listening: false,
          speaking: false,
          currentField: null, 
          status: "" 
        }));
        voiceModeActiveRef.current = false;
        return;
      } else {
        // Optional field failed - just move on
        const moveOnMsg = languageValue === "sw"
          ? "Tutaenda kwenye kipimo kifuatacho."
          : "Let's move to the next measurement.";
        
        if (!voiceModeState.muted) {
          await handleSpeak(moveOnMsg);
        }
      }
    }

    // Small delay between fields if voice mode is still active
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
  
  // Reset voice mode state
  setVoiceModeState((prev: any) => ({ 
    ...prev, 
    active: false, 
    currentField: null, 
    status: "",
    listening: false,
    speaking: false
  }));
  voiceModeActiveRef.current = false;
};

export const stopVoiceMode = (params: {
  voiceModeActiveRef: React.MutableRefObject<boolean>;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  currentLanguage: any;
  setVoiceModeState: (state: any) => void;
  handleSpeak: (text: string) => Promise<void>;
  isMuted: boolean;
}) => {
  const {
    voiceModeActiveRef,
    mediaRecorderRef,
    currentLanguage,
    setVoiceModeState,
    handleSpeak,
    isMuted
  } = params;

  console.log("Stopping voice mode");
  voiceModeActiveRef.current = false;
  setVoiceModeState((prev: any) => ({ 
    ...prev, 
    active: false,
    listening: false,
    speaking: false,
    currentField: null, 
    status: "" 
  }));
  
  if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
    mediaRecorderRef.current.stop();
  }
  
  if (!isMuted) {
    handleSpeak(currentLanguage.voiceCancelled);
  }
};