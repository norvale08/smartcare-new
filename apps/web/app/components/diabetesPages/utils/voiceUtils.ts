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

// COMPLETE REPLACEMENT FOR parseSwahiliNumber AND parseSpokenInput
// Copy and paste this ENTIRE section into your voiceUtils.ts file

// Swahili number word mappings
const swahiliNumberWords: { [key: string]: number } = {
  // Units (0-10)
  'sifuri': 0, 'moja': 1, 'mbili': 2, 'tatu': 3, 'nne': 4, 'tano': 5,
  'sita': 6, 'saba': 7, 'nane': 8, 'tisa': 9, 'kumi': 10,
  
  // Tens (20-90)
  'ishirini': 20, 'thelathini': 30, 'arobaini': 40, 'hamsini': 50,
  'sitini': 60, 'sabini': 70, 'themanini': 80, 'tisini': 90,
  
  // Hundreds
  'mia': 100,
  
  // Alternative spellings
  'arubaini': 40, 'thamanini': 80
};

/**
 * Parse Swahili number words into numeric values
 * Handles: 0-999 (units, tens, hundreds, and compounds)
 * Examples:
 * - "sabini na sita" → 76
 * - "mia mbili na hamsini na tano" → 255
 * - "mia moja ishirini" → 120 (NOT 121 - "moja" after "mia" is part of "one hundred")
 * - "mia tatu" → 300
 * - "ishirini na nne" → 24
 * - "mia tano na sitini na nne" → 564
 */
const parseSwahiliNumber = (text: string): number | null => {
  const normalized = text.toLowerCase().trim();
  
  console.log(`🔍 parseSwahiliNumber input: "${normalized}"`);
  
  // Check for exact phrase matches first
  if (swahiliNumberWords[normalized] !== undefined) {
    console.log(`   ✅ Exact match: ${swahiliNumberWords[normalized]}`);
    return swahiliNumberWords[normalized];
  }
  
  const words = normalized.split(/\s+/);
  console.log(`   📝 Split into words:`, words);
  
  let total = 0;
  let currentNumber = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue; // Skip if word is undefined
    
    console.log(`   🔤 Processing word [${i}]: "${word}"`);
    
    // Skip "na" (and)
    if (word === 'na') {
      console.log(`      ⏭️  Skipping 'na'`);
      continue;
    }
    
    if (swahiliNumberWords[word] !== undefined) {
      const value = swahiliNumberWords[word];
      console.log(`      ✅ Found value: ${value}`);
      
      if (value === 100) {
        // Handle "mia" (hundred)
        if (currentNumber === 0) {
          // "mia" alone means 100
          currentNumber = 100;
          console.log(`      💯 'mia' alone = 100`);
        } else {
          // Previous number is a multiplier (e.g., "mbili mia" = 2 * 100 = 200)
          total += currentNumber * 100;
          currentNumber = 0;
          console.log(`      💯 Hundred multiplier, total now: ${total}`);
        }
      } else if (value >= 10 && value < 100) {
        // Tens (20, 30, 40, etc.)
        if (total > 0 && currentNumber === 0) {
          // We've already processed hundreds, add tens
          // e.g., "mia mbili sabini" = 200 + 70
          currentNumber = value;
          console.log(`      🔟 Tens after hundreds, currentNumber: ${currentNumber}`);
        } else {
          currentNumber += value;
          console.log(`      🔟 Adding tens, currentNumber: ${currentNumber}`);
        }
      } else if (value >= 1 && value <= 9) {
        // Units (1-9)
        
        // Special case: Skip unit that comes immediately after "mia"
        // In "mia moja ishirini", "moja" is part of "mia moja" (100), not a separate +1
        if (i > 0 && words[i - 1] === 'mia') {
          console.log(`      🚫 Skipping unit after 'mia' (part of hundred expression)`);
          continue;
        }
        
        // Check if next word is "mia" (this unit is a hundred multiplier)
        if (i + 1 < words.length && words[i + 1] === 'mia') {
          currentNumber = value;
          console.log(`      🔢 Units as hundred multiplier: ${currentNumber}`);
        } else {
          // Just add the unit to current number
          currentNumber += value;
          console.log(`      ➕ Adding units, currentNumber: ${currentNumber}`);
        }
      } else if (value === 0) {
        if (total === 0 && currentNumber === 0) {
          console.log(`      0️⃣ Zero value`);
          return 0;
        }
      }
    } else {
      console.log(`      ❌ Word "${word}" not in dictionary`);
    }
  }
  
  total += currentNumber;
  console.log(`   🎯 Final total: ${total}`);
  return total > 0 ? total : null;
};

/**
 * Parse spoken input and categorize it
 * Handles: numbers (digits + Swahili words), text, skip commands
 */
export const parseSpokenInput = (
  text: string, 
  languageValue: string, 
  fieldType?: 'number' | 'select'
): { 
  type: 'number' | 'text' | 'skip' | 'unknown'; 
  value?: number; 
  textValue?: string 
} => {
  const lowerText = text.toLowerCase().trim();
  
  console.log(`🔊 Parsing spoken input: "${text}" -> "${lowerText}"`);
  console.log(`   Language: ${languageValue}, Field type: ${fieldType}`);
  
  // Define skip words (NO 'none' here - it's a valid select option!)
  const skipWords = languageValue === "sw" 
    ? ['ruka', 'pass', 'next', 'sina', 'hapana']
    : ['skip', 'pass', 'next', "don't know", 'not sure'];
  
  // Check for skip command
  if (skipWords.some(word => lowerText.includes(word))) {
    console.log('   ⏭️ SKIP detected');
    return { type: 'skip' };
  }
  
  // For select fields, ALWAYS return as text (let mapSpokenToOption handle it)
  if (fieldType === 'select') {
    console.log(`   📝 Select field - returning as text: "${lowerText}"`);
    return { type: 'text', textValue: lowerText };
  }
  
  // For number fields, try parsing
  if (fieldType === 'number') {
    console.log(`   🔢 Number field - attempting to parse...`);
    
    // Priority 1: Try Swahili number words (if Swahili language)
    if (languageValue === 'sw') {
      const swahiliNum = parseSwahiliNumber(lowerText);
      if (swahiliNum !== null) {
        console.log(`   ✅ Parsed Swahili number: ${swahiliNum}`);
        return { type: 'number', value: swahiliNum };
      }
      console.log(`   ❌ No Swahili number pattern found`);
    }
    
    // Priority 2: Try extracting digits (works for both languages)
    const numbers = lowerText.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const number = parseInt(numbers[0], 10);
      if (!isNaN(number) && number >= 0) {
        console.log(`   ✅ Parsed digit number: ${number}`);
        return { type: 'number', value: number };
      }
    }
    
    console.log('   ❌ No valid number found');
  }
  
  // Fallback to text if not empty
  if (lowerText.length > 0) {
    console.log(`   Fallback to text: "${lowerText}"`);
    return { type: 'text', textValue: lowerText };
  }

  console.log('   ❓ Unknown input');
  return { type: 'unknown' };
};

export const mapSpokenToOption = (spokenText: string, fieldName: string, currentLanguage: any): string | null => {
  const normalized = spokenText.toLowerCase().trim();
  
  console.log(`\n🔍 mapSpokenToOption - Field: ${fieldName}, Input: "${normalized}"`);
  
  // ✅ CONTEXT - Support both English and Swahili
  if (fieldName === 'context') {
    // Try language-specific keywords first
    if (currentLanguage && currentLanguage.optionKeywords && currentLanguage.optionKeywords.context) {
      const contextKeywords = currentLanguage.optionKeywords.context;
      
      if (contextKeywords.fasting.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: Fasting');
        return 'Fasting';
      }
      if (contextKeywords.postMeal.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: Post-meal');
        return 'Post-meal';
      }
      if (contextKeywords.random.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: Random');
        return 'Random';
      }
    }
    
    // Fallback to English keywords
    if (normalized.includes('fast')) return 'Fasting';
    if (normalized.includes('post') || normalized.includes('after')) return 'Post-meal';
    if (normalized.includes('random')) return 'Random';
  }
  
  // ✅ LASTMEALTIME - Support both English and Swahili
  if (fieldName === 'lastMealTime') {
    // Try language-specific keywords first
    if (currentLanguage && currentLanguage.optionKeywords && currentLanguage.optionKeywords.lastMealTime) {
      const mealTimeKeywords = currentLanguage.optionKeywords.lastMealTime;
      
      if (mealTimeKeywords.moreThanSix.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: more_than_6_hours');
        return 'more_than_6_hours';
      }
      if (mealTimeKeywords.sixHours.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: 6_hours');
        return '6_hours';
      }
      if (mealTimeKeywords.fourHours.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: 4_hours');
        return '4_hours';
      }
      if (mealTimeKeywords.twoHours.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: 2_hours');
        return '2_hours';
      }
    }
    
    // Fallback to English patterns
    if (normalized.includes('more than') || normalized.includes('6+') || normalized.includes('6 +')) {
      return 'more_than_6_hours';
    }
    if (normalized.includes('2') && !normalized.includes('4') && !normalized.includes('6')) {
      return '2_hours';
    }
    if (normalized.includes('4')) {
      return '4_hours';
    }
    if (normalized.includes('6') && !normalized.includes('more') && !normalized.includes('+')) {
      return '6_hours';
    }
  }
  
  // ✅ IMPROVED MEALTYPE - Handle users saying actual food names
  if (fieldName === 'mealType') {
    console.log('🔍 Mapping mealType:', normalized);
    
    // ✅ CARBOHYDRATES - expanded food list
    const carbFoods = [
      'carb', 'carbs', 'carbohydrates', 'carbohydrate',
      'rice', 'white rice', 'brown rice', 'fried rice',
      'bread', 'white bread', 'whole wheat', 'toast', 'sandwich',
      'pasta', 'spaghetti', 'noodles', 'macaroni',
      'potato', 'potatoes', 'fries', 'french fries', 'mashed potatoes',
      'corn', 'maize', 'tortilla',
      'oatmeal', 'oats', 'porridge',
      'cereal', 'breakfast cereal',
      'pizza', 'burger', 'burger bun',
      'chapati', 'roti', 'naan',
      'ugali', 'sadza', 'nsima', 'pap'
    ];
    
    if (carbFoods.some(food => normalized.includes(food))) {
      console.log('✅ Matched: carbohydrates');
      return 'carbohydrates';
    }
    
    // ✅ SUGARY DRINKS - expanded list
    const sugaryDrinks = [
      'sugar', 'sugary', 'sweet',
      'soda', 'coke', 'pepsi', 'soft drink', 'pop',
      'juice', 'orange juice', 'apple juice', 'fruit juice',
      'sweet tea', 'iced tea', 'bubble tea',
      'energy drink', 'red bull', 'monster',
      'smoothie', 'milkshake', 'shake',
      'sweetened', 'sweet drink', 'sugary drink'
    ];
    
    if (sugaryDrinks.some(drink => normalized.includes(drink))) {
      console.log('✅ Matched: sugary_drinks');
      return 'sugary_drinks';
    }
    
    // ✅ PROTEINS - expanded list
    const proteinFoods = [
      'protein', 'proteins',
      'meat', 'beef', 'steak', 'pork', 'lamb',
      'chicken', 'turkey', 'duck',
      'fish', 'salmon', 'tuna', 'tilapia',
      'egg', 'eggs', 'omelette', 'scrambled eggs',
      'beans', 'lentils', 'legumes', 'chickpeas',
      'tofu', 'tempeh', 'soy', 'soya',
      'peanuts', 'nuts', 'almonds', 'walnuts',
      'cheese', 'milk', 'yogurt', 'curd'
    ];
    
    if (proteinFoods.some(food => normalized.includes(food))) {
      console.log('✅ Matched: proteins');
      return 'proteins';
    }
    
    // ✅ VEGETABLES - expanded list
    const vegetableFoods = [
      'vegetable', 'vegetables', 'veggies',
      'salad', 'green salad', 'vegetable salad',
      'broccoli', 'cauliflower', 'cabbage',
      'spinach', 'kale', 'lettuce',
      'carrot', 'carrots',
      'tomato', 'tomatoes',
      'onion', 'onions', 'garlic',
      'pepper', 'bell pepper', 'capsicum',
      'cucumber', 'zucchini', 'eggplant', 'aubergine',
      'green beans', 'peas'
    ];
    
    if (vegetableFoods.some(food => normalized.includes(food))) {
      console.log('✅ Matched: vegetables');
      return 'vegetables';
    }
    
    // ✅ MIXED MEAL
    const mixedTerms = [
      'mixed', 'mixture', 'combination', 'combo',
      'everything', 'bit of everything', 'little bit of everything',
      'balanced', 'balanced meal', 'full meal',
      'variety', 'various', 'different things',
      'buffet', 'potluck',
      'rice and beans', 'rice with chicken', 'rice and fish',
      'pasta with sauce', 'noodles with vegetables'
    ];
    
    if (mixedTerms.some(term => normalized.includes(term))) {
      console.log('✅ Matched: mixed_meal');
      return 'mixed_meal';
    }
    
    // ✅ Handle Swahili food names if language is Swahili
    if (currentLanguage && currentLanguage.optionKeywords && currentLanguage.optionKeywords.mealType) {
      const mealKeywords = currentLanguage.optionKeywords.mealType;
      
      // Check each category for keywords
        if (mealKeywords.carbs.some((keyword: string) => normalized.includes(keyword))) {
          console.log('✅ Matched via language keywords: carbohydrates');
          return 'carbohydrates';
        }
        if (mealKeywords.sugaryDrinks.some((keyword: string) => normalized.includes(keyword))) {
          console.log('✅ Matched via language keywords: sugary_drinks');
          return 'sugary_drinks';
        }
        if (mealKeywords.proteins.some((keyword: string) => normalized.includes(keyword))) {
          console.log('✅ Matched via language keywords: proteins');
          return 'proteins';
        }
        if (mealKeywords.vegetables.some((keyword: string) => normalized.includes(keyword))) {
          console.log('✅ Matched via language keywords: vegetables');
          return 'vegetables';
        }
        if (mealKeywords.mixed.some((keyword: string) => normalized.includes(keyword))) {
          console.log('✅ Matched via language keywords: mixed_meal');
          return 'mixed_meal';
        }
    }
    
    console.log('❌ No meal type match found');
  }
  
  // ✅ EXERCISERECENT - Support both English and Swahili
  if (fieldName === 'exerciseRecent') {
    // Try language-specific keywords first
    if (currentLanguage && currentLanguage.optionKeywords && currentLanguage.optionKeywords.exerciseRecent) {
      const exerciseKeywords = currentLanguage.optionKeywords.exerciseRecent;
      
      if (exerciseKeywords.none.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: none');
        return 'none';
      }
      if (exerciseKeywords.sixTo24Hours.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: 6_to_24_hours');
        return '6_to_24_hours';
      }
      if (exerciseKeywords.twoToSixHours.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: 2_to_6_hours');
        return '2_to_6_hours';
      }
      if (exerciseKeywords.within2Hours.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: within_2_hours');
        return 'within_2_hours';
      }
    }
    
    // Fallback to English hardcoded matching
    if (normalized === 'none' || normalized === 'non' || normalized === 'known' || 
        normalized === 'nun' || normalized === 'no' || normalized === 'man') {
      console.log('✅ Matched: none');
      return 'none';
    }
    
    if (normalized.includes('no exercise') || normalized.includes('not exercise') || 
        normalized.includes('did not') || normalized.includes('didn\'t')) {
      console.log('✅ Matched: none (phrase)');
      return 'none';
    }
    
    if (normalized.includes('24')) {
      console.log('✅ Matched: 6_to_24_hours');
      return '6_to_24_hours';
    }
    
    if (normalized.includes('within') || (normalized.includes('2') && !normalized.includes('6'))) {
      console.log('✅ Matched: within_2_hours');
      return 'within_2_hours';
    }
    
    if (normalized.includes('2') && normalized.includes('6')) {
      console.log('✅ Matched: 2_to_6_hours');
      return '2_to_6_hours';
    }
  }
  
  // ✅ EXERCISEINTENSITY - Support both English and Swahili
  if (fieldName === 'exerciseIntensity') {
    // Try language-specific keywords first
    if (currentLanguage && currentLanguage.optionKeywords && currentLanguage.optionKeywords.exerciseIntensity) {
      const intensityKeywords = currentLanguage.optionKeywords.exerciseIntensity;
      
      if (intensityKeywords.light.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: light');
        return 'light';
      }
      if (intensityKeywords.moderate.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: moderate');
        return 'moderate';
      }
      if (intensityKeywords.vigorous.some((keyword: string) => normalized.includes(keyword))) {
        console.log('✅ Matched via language keywords: vigorous');
        return 'vigorous';
      }
    }
    
    // Fallback to English keywords
    if (normalized.includes('light') || normalized.includes('easy')) {
      return 'light';
    }
    if (normalized.includes('moderate') || normalized.includes('medium')) {
      return 'moderate';
    }
    if (normalized.includes('vigorous') || normalized.includes('intense')) {
      return 'vigorous';
    }
  }
  
  console.log('❌ No match found');
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
      handleSpeak(languageValue === "sw" ? "Imezimwa." : "Paused.").catch(() => {});
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

export const getOptionsList = (fieldName: string, currentLanguage: any): string[] => {
  switch (fieldName) {
    case 'context':
      return [
        currentLanguage.contextOptions.fasting,
        currentLanguage.contextOptions.postMeal,
        currentLanguage.contextOptions.random
      ];
    case 'lastMealTime':
      return [
        currentLanguage.lastMealOptions.twoHours,
        currentLanguage.lastMealOptions.fourHours,
        currentLanguage.lastMealOptions.sixHours,
        currentLanguage.lastMealOptions.moreThanSix
      ];
    case 'mealType':
      return [
        currentLanguage.mealTypeOptions.carbs,
        currentLanguage.mealTypeOptions.sugaryDrinks,
        currentLanguage.mealTypeOptions.proteins,
        currentLanguage.mealTypeOptions.vegetables,
        currentLanguage.mealTypeOptions.mixed
      ];
    case 'exerciseRecent':
      return [
        currentLanguage.exerciseOptions.none,
        currentLanguage.exerciseOptions.within2Hours,
        currentLanguage.exerciseOptions.twoToSixHours,
        currentLanguage.exerciseOptions.sixTo24Hours
      ];
    case 'exerciseIntensity':
      return [
        currentLanguage.intensityOptions.light,
        currentLanguage.intensityOptions.moderate,
        currentLanguage.intensityOptions.vigorous
      ];
    default:
      return [];
  }
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

  let prompt = "";
  if (fieldType === 'number') {
    prompt = fieldLabel;
  } else if (fieldType === 'select') {
    const options = getOptionsList(fieldName, currentLanguage);
    if (languageValue === "sw") {
      prompt = `${fieldLabel}. ${options.join(', ')}.`;
    } else {
      prompt = `${fieldLabel}. ${options.join(', ')}.`;
    }
  }
  
  console.log(`\n🎤 Speaking prompt for ${fieldName}: "${prompt}"`);
  await handleSpeak(prompt);
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
      
      setVoiceModeState((prev: any) => ({ 
        ...prev, 
        listening: true, 
        status: languageValue === "sw" ? "Sema" : "Speak"
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

          console.log(`📤 Sending transcription request for ${fieldName}...`);
          const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(8000)
          });

          if (!response.ok) {
            console.error(`❌ Transcription request failed for ${fieldName}`);
            setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
            isProcessingRef.current = false;
            resolve(null);
            return;
          }

          const data = await response.json();
          
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;

          if (data.success && data.text) {
            console.log("\n" + "=".repeat(50));
            console.log("🎤 TRANSCRIPTION RECEIVED");
            console.log("Field:", fieldName);
            console.log("Raw transcription:", data.text);
            console.log("Field type:", fieldType);
            console.log("Is required:", isRequired);
            console.log("=".repeat(50) + "\n");
            
            const parsed = parseSpokenInput(data.text, languageValue, fieldType);
            console.log("🧩 PARSED RESULT:", JSON.stringify(parsed, null, 2));
            
            // ✅ SIMPLIFIED LOGIC: Handle "none" as text for select fields
            if (parsed.type === 'skip') {
              console.log("⏭️ SKIP DETECTED");
              if (isRequired) {
                console.log("❌ Field is required, rejecting skip");
                resolve(null);
              } else {
                console.log("✅ Field is optional, accepting skip");
                resolve('skip');
              }
            } 
            else if (parsed.type === 'number' && parsed.value !== undefined) {
              console.log("🔢 NUMBER DETECTED:", parsed.value);
              if (fieldType === 'number' && min !== undefined && max !== undefined) {
                if (parsed.value >= min && parsed.value <= max) {
                  console.log("✅ Number in valid range, accepting");
                  resolve(parsed.value);
                } else {
                  console.log("❌ Number out of range:", { value: parsed.value, min, max });
                  resolve(null);
                }
              } else {
                console.log("❌ Field type mismatch or no min/max");
                resolve(null);
              }
            } 
            else if (parsed.type === 'text' && parsed.textValue && fieldType === 'select') {
              console.log("📝 TEXT FOR SELECT FIELD:", parsed.textValue);
              console.log("🔍 Attempting to map to option...");
              
              const mappedValue = mapSpokenToOption(parsed.textValue, fieldName, currentLanguage);
              console.log("🗺️ MAPPED VALUE:", mappedValue);
              
              if (mappedValue) {
                console.log(`✅ SUCCESS: "${parsed.textValue}" -> "${mappedValue}"`);
                resolve(mappedValue);
              } else {
                console.log("❌ Failed to map to any valid option");
                console.log("Available options:");
                const optionsList = getOptionsList(fieldName, currentLanguage);
                console.log(optionsList);
                resolve(null);
              }
            } 
            else {
              console.log("❓ UNKNOWN/UNHANDLED PARSING RESULT");
              console.log("Parsed type:", parsed.type);
              console.log("Field type:", fieldType);
              console.log("Text value:", parsed.textValue);
              resolve(null);
            }
          } else {
            console.log("❌ No text in transcription response or unsuccessful");
            resolve(null);
          }
        } catch (error: any) {
          console.error("❌ ERROR in transcription process:", error);
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;
          resolve(null);
        }
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
          console.log(`⏰ Timeout for ${fieldName}, stopping recording`);
          mediaRecorder.stop();
        }
      }, 5000);

    } catch (error) {
      console.error("❌ ERROR starting recording:", error);
      setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
      isProcessingRef.current = false;
      resolve(null);
    }
  });
};

export const askForAIFeedback = async (
  languageValue: string,
  currentLanguage: any,
  voiceModeActiveRef: React.MutableRefObject<boolean>,
  pausedRef: React.MutableRefObject<boolean>,
  setVoiceModeState: (state: any) => void,
  handleSpeak: (text: string) => Promise<void>,
  isMuted: boolean,
  API_URL: string,
  isProcessingRef: React.MutableRefObject<boolean>,
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  fieldRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>
): Promise<boolean> => {
  
  while (pausedRef.current && voiceModeActiveRef.current) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  if (isProcessingRef.current || !voiceModeActiveRef.current) {
    return true; // Default to yes
  }

  if (fieldRefs.current['aiFeedback']) {
    fieldRefs.current['aiFeedback']?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  setVoiceModeState((prev: any) => ({ ...prev, currentField: 'aiFeedback' }));

  const question = languageValue === "sw" 
    ? "Ungependa kupata msaada wa AI? Sema ndio au hapana. Chaguo msingi ni ndio." 
    : "Would you like AI feedback? Say yes or no. Default is yes.";
  
  console.log(`\n🎤 Asking AI feedback question: "${question}"`);
  await handleSpeak(question);
  await new Promise(resolve => setTimeout(resolve, 500));

  while (pausedRef.current && voiceModeActiveRef.current) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  if (!voiceModeActiveRef.current) {
    return true; // Default to yes
  }

  return new Promise(async (resolve) => {
    try {
      isProcessingRef.current = true;
      
      setVoiceModeState((prev: any) => ({ 
        ...prev, 
        listening: true, 
        status: languageValue === "sw" ? "Sema" : "Speak"
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
          resolve(true); // Default to yes if no input
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        try {
          const wavBlob = await convertWebmToWav(audioBlob);
          
          const formData = new FormData();
          formData.append("audio", wavBlob, "recording.wav");
          formData.append("language", languageValue);

          console.log(`📤 Sending transcription request for AI feedback...`);
          const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(8000)
          });

          if (!response.ok) {
            console.error(`❌ Transcription request failed for AI feedback`);
            setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
            isProcessingRef.current = false;
            resolve(true); // Default to yes on error
            return;
          }

          const data = await response.json();
          
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;

          if (data.success && data.text) {
            const transcription = data.text.toLowerCase().trim();
            console.log(`🎤 AI Feedback response: "${transcription}"`);
            
            const yesWords = languageValue === "sw" 
              ? ['ndio', 'yes', 'yep', 'yeah', 'ok', 'sawa', 'hapana', 'no', 'nope', 'not', 'dont', "don't", 'cancel', 'stop']
              : ['yes', 'yep', 'yeah', 'ok', 'sure', 'no', 'nope', 'not', 'dont', "don't", 'cancel', 'stop'];
            
            const noWords = languageValue === "sw" 
              ? ['hapana', 'no', 'nope', 'not', 'dont', "don't", 'cancel', 'stop', 'la']
              : ['no', 'nope', 'not', 'dont', "don't", 'cancel', 'stop'];
            
            // Check for "no" words first
            const isNo = noWords.some(word => transcription.includes(word));
            
            if (isNo) {
              console.log("❌ User said NO to AI feedback");
              resolve(false);
            } else {
              // Default to yes for any other response or no clear "no"
              console.log("✅ User said YES or defaulting to YES for AI feedback");
              resolve(true);
            }
          } else {
            console.log("❌ No text in transcription response, defaulting to YES");
            resolve(true); // Default to yes
          }
        } catch (error: any) {
          console.error("❌ ERROR in AI feedback transcription:", error);
          setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
          isProcessingRef.current = false;
          resolve(true); // Default to yes on error
        }
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording" && voiceModeActiveRef.current) {
          console.log(`⏰ Timeout for AI feedback, stopping recording`);
          mediaRecorder.stop();
        }
      }, 5000);

    } catch (error) {
      console.error("❌ ERROR starting recording for AI feedback:", error);
      setVoiceModeState((prev: any) => ({ ...prev, listening: false, currentField: null, status: "" }));
      isProcessingRef.current = false;
      resolve(true); // Default to yes on error
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
  hasHypertension?: boolean;
  hasDiabetes?: boolean;
  setRequestAI: (value: boolean) => void;
  onAutoSubmit: (aiRequested?: boolean) => Promise<void>;
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
    fieldRefs,
    hasHypertension = false,
    hasDiabetes = false,
    setRequestAI,
    onAutoSubmit
  } = params;

  setVoiceModeState((prev: any) => ({ ...prev, active: true }));
  voiceModeActiveRef.current = true;
  pausedRef.current = false;
  
  const welcome = languageValue === "sw"
    ? "Anza."
    : "Start.";
  
  await handleSpeak(welcome);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const bpFieldsRequired = hasHypertension;
  
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
      name: "systolic", 
      label: currentLanguage.systolicLabel,
      type: "number" as const,
      min: 70, 
      max: 250,
      required: bpFieldsRequired,
      skipIfDiabetesOnly: true
    },
    { 
      name: "diastolic", 
      label: currentLanguage.diastolicLabel,
      type: "number" as const,
      min: 40, 
      max: 150,
      required: bpFieldsRequired,
      skipIfDiabetesOnly: true
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

  // Field collection loop
  for (const field of allFields) {
    if (!voiceModeActiveRef.current) break;
    
    if (field.skipIfDiabetesOnly && hasDiabetes && !hasHypertension) {
      console.log(`Skipping ${field.name} because user has diabetes only (no hypertension)`);
      continue;
    }
    
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
    const maxAttempts = field.required ? 2 : 1;
    
    while (!validInput && attempts < maxAttempts && voiceModeActiveRef.current) {
      while (pausedRef.current && voiceModeActiveRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (!voiceModeActiveRef.current) break;
      
      console.log(`\n🔄 Attempt ${attempts + 1}/${maxAttempts} for ${field.name}`);
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
        console.log(`❌ No valid input for ${field.name}, attempt ${attempts + 1} failed`);
        attempts++;
        continue;
      }

      if (result === 'skip') {
        if (!field.required) {
          console.log(`✅ Skipping optional field: ${field.name}`);
          toast.success(`⏭️ ${field.label}: ${currentLanguage.skip}`, { duration: 2000 });
          validInput = true;
          break;
        } else {
          console.log(`❌ Cannot skip required field: ${field.name}`);
          attempts++;
          continue;
        }
      }

      console.log(`✅ Captured value for ${field.name}:`, result);
      setValue(field.name, result as any);
      
      const displayValue = typeof result === 'number' 
        ? result 
        : getDisplayValue(field.name, result as string, currentLanguage);
      
      toast.success(`✅ ${field.label}: ${displayValue}`, { duration: 2000 });
      
      if (!voiceModeState.muted && voiceModeActiveRef.current) {
        await handleSpeak(`${displayValue}`);
      }
      
      validInput = true;
    }
    
    if (!validInput && voiceModeActiveRef.current) {
      if (field.required) {
        console.log(`❌ Failed to get valid input for required field: ${field.name}`);
        const manualMsg = languageValue === "sw"
          ? `Ingiza mwenyewe.`
          : `Enter manually.`;
        
        toast.error(`❌ ${manualMsg}`, { duration: 4000 });
        
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
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Ask for AI feedback after all fields are collected
  if (voiceModeActiveRef.current) {
    console.log("\n🤖 Asking for AI feedback preference...");
    
    const wantsAI = await askForAIFeedback(
      languageValue,
      currentLanguage,
      voiceModeActiveRef,
      pausedRef,
      setVoiceModeState,
      handleSpeak,
      voiceModeState.muted,
      API_URL,
      isProcessingRef,
      mediaRecorderRef,
      fieldRefs
    );

    console.log(`🤖 AI Feedback decision: ${wantsAI ? 'YES' : 'NO'}`);

    // Submit form with AI feedback value
    if (voiceModeActiveRef.current) {
      console.log("\n📤 Auto-submitting form with AI feedback:", wantsAI);
      
      const submittingMsg = languageValue === "sw"
        ? "Inatuma data..."
        : "Submitting...";
      
      await handleSpeak(submittingMsg);
      
      try {
        await onAutoSubmit(wantsAI);
        
        const successMsg = languageValue === "sw"
          ? "Imekamilika. Data imehifadhiwa."
          : "Complete. Data saved.";
        
        await handleSpeak(successMsg);
        toast.success(currentLanguage.voiceComplete, { duration: 3000 });
      } catch (error) {
        console.error("❌ Auto-submit failed:", error);
        const errorMsg = languageValue === "sw"
          ? "Hitilafu. Jaribu tena."
          : "Error. Try again.";
        
        await handleSpeak(errorMsg);
        toast.error(errorMsg, { duration: 3000 });
      }
    }
  }
 
  // Clean up voice mode
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
}

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