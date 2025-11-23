const kenyanEnglishNumbers: Record<string, number> = {
  // Zero variations
  'zero': 0, 'siro': 0, 'ziro': 0, 'sero': 0,
  
  // One variations
  'one': 1, 'wan': 1, 'won': 1, 'wun': 1,
  
  // Two variations
  'two': 2, 'too': 2, 'to': 2, 'tu': 2, 'tuu': 2,
  
  // Three variations
  'three': 3, 'tree': 3, 'tri': 3, 'trii': 3,
  
  // Four variations
  'four': 4, 'for': 4, 'foa': 4, 'fo': 4,
  
  // Five variations
  'five': 5, 'fife': 5, 'faiv': 5, 'fiv': 5,
  
  // Six variations
  'six': 6, 'sex': 6, 'siks': 6,
  
  // Seven variations
  'seven': 7, 'sebben': 7, 'seben': 7, 'sefen': 7, 'sebun': 7,
  
  // Eight variations
  'eight': 8, 'ate': 8, 'eyt': 8, 'eit': 8, 'ait': 8,
  
  // Nine variations
  'nine': 9, 'nain': 9, 'nayn': 9, 'nyn': 9,
  
  // Ten
  'ten': 10, 'tin': 10,
  
  // 11-19
  'eleven': 11, 'elefen': 11, 'ileven': 11,
  'twelve': 12, 'twelef': 12, 'tuelve': 12,
  'thirteen': 13, 'tirteen': 13, 'turteen': 13, 'tatin': 13,
  'fourteen': 14, 'forteen': 14, 'foteen': 14,
  'fifteen': 15, 'fiftin': 15, 'fivtin': 15,
  'sixteen': 16, 'sextin': 16, 'sikstin': 16,
  'seventeen': 17, 'sebentin': 17, 'seventin': 17,
  'eighteen': 18, 'eitin': 18, 'eytin': 18,
  'nineteen': 19, 'naintin': 19, 'nayntin': 19,
  
  // Tens with MANY variations
  'twenty': 20, 'tweny': 20, 'twenti': 20, 'tuenty': 20,
  'thirty': 30, 'tirty': 30, 'turty': 30, 'tati': 30, 'thati': 30,
  'forty': 40, 'fourty': 40, 'for tea': 40, 'for tee': 40, 'fotea': 40, 
  'foty': 40, 'forti': 40, 'fouty': 40, 'fotty': 40,
  'fifty': 50, 'fefty': 50, 'fifti': 50, 'fivty': 50,
  'sixty': 60, 'sexty': 60, 'siksti': 60, 'sisti': 60,
  'seventy': 70, 'sebenty': 70, 'seventi': 70, 'sebenti': 70,
  'eighty': 80, 'aitty': 80, 'eity': 80, 'eyty': 80, 'aity': 80, 'eiti': 80,
  'ninety': 90, 'nainty': 90, 'naynti': 90, 'ninty': 90,
  
  // Hundreds with variations
  'hundred': 100, 'handred': 100, 'hondred': 100, 'hundret': 100, 'handret': 100,
  'one hundred': 100, 'wan handred': 100, 'one handred': 100,
  'two hundred': 200, 'too handred': 200, 'tu handred': 200,
  'three hundred': 300, 'tree handred': 300, 'tri handred': 300,
  'four hundred': 400, 'for handred': 400,
  'five hundred': 500, 'fife handred': 500,
  'six hundred': 600, 'sex handred': 600,
  'seven hundred': 700, 'sebben handred': 700,
  'eight hundred': 800, 'ate handred': 800,
  'nine hundred': 900, 'nain handred': 900,
};


const swahiliNumbers: Record<string, number> = {
  // Basic
  'sifuri': 0, 'sufuri': 0, 'sifure': 0,
  'moja': 1, 'moya': 1,
  'mbili': 2, 'bili': 2, 'mbiri': 2,
  'tatu': 3, 'tate': 3,
  'nne': 4, 'ne': 4, 'ine': 4,
  'tano': 5, 'tan': 5,
  'sita': 6, 'sete': 6,
  'saba': 7, 'sab': 7,
  'nane': 8, 'nan': 8,
  'tisa': 9, 'tise': 9,
  'kumi': 10, 'kume': 10,
  
  // 11-19
  'kumi na moja': 11, 'kumi moja': 11,
  'kumi na mbili': 12, 'kumi mbili': 12,
  'kumi na tatu': 13, 'kumi tatu': 13,
  'kumi na nne': 14, 'kumi nne': 14,
  'kumi na tano': 15, 'kumi tano': 15,
  'kumi na sita': 16, 'kumi sita': 16,
  'kumi na saba': 17, 'kumi saba': 17,
  'kumi na nane': 18, 'kumi nane': 18,
  'kumi na tisa': 19, 'kumi tisa': 19,
  
  // Tens with variations
  'ishirini': 20, 'ishrini': 20, 'shirini': 20, 'ishirin': 20,
  'thelathini': 30, 'thelatin': 30, 'selathini': 30, 'selatin': 30,
  'arobaini': 40, 'arubani': 40, 'arobani': 40, 'robani': 40, 'arobain': 40,
  'hamsini': 50, 'hamsin': 50, 'amsini': 50,
  'sitini': 60, 'sitin': 60, 'stin': 60,
  'sabini': 70, 'sabin': 70, 'sabni': 70,
  'themanini': 80, 'themanin': 80, 'thamanini': 80, 'tamanini': 80,
  'tisini': 90, 'tisin': 90, 'tsin': 90,
  
  // Larger
  'mia': 100, 'miya': 100,
  'elfu': 1000, 'aelfu': 1000,
};


function findClosestNumber(input: string): number | null {
  const clean = input.toLowerCase().trim();
  
  // Direct match first
  if (kenyanEnglishNumbers[clean] !== undefined) {
    return kenyanEnglishNumbers[clean];
  }
  if (swahiliNumbers[clean] !== undefined) {
    return swahiliNumbers[clean];
  }
  
  // Fuzzy match - check if input is SIMILAR to any known number
  const allNumbers = { ...kenyanEnglishNumbers, ...swahiliNumbers };
  
  for (const [key, value] of Object.entries(allNumbers)) {
    // Check if input contains the key or vice versa
    if (clean.includes(key) || key.includes(clean)) {
      console.log(`🎯 Fuzzy match: "${clean}" ≈ "${key}" = ${value}`);
      return value;
    }
    
    // Check similarity (simple character overlap)
    if (key.length > 3 && clean.length > 3) {
      const similarity = calculateSimilarity(clean, key);
      if (similarity > 0.7) {
        console.log(`🎯 Similarity match: "${clean}" ≈ "${key}" (${Math.round(similarity * 100)}%) = ${value}`);
        return value;
      }
    }
  }
  
  return null;
}

// Simple similarity calculation
function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    const char = shorter.charAt(i);
    if (char && longer.includes(char)) {
      matches++;
    }
  }
  
  return matches / longer.length;
}


function extractDigits(text: string): number | null {
  const digits = text.replace(/[^\d]/g, '');
  if (digits.length > 0) {
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num >= 0) {
      return num;
    }
  }
  return null;
}

export function parseCompoundEnglish(text: string): number | null {
  const words = text.toLowerCase().split(/\s+/);
  let total = 0;
  let current = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i] || '';
    const value = kenyanEnglishNumbers[word];
    
    if (value !== undefined) {
      if (value >= 100) {
        // Handle hundreds: "two hundred"
        if (current === 0) current = 1;
        total += current * value;
        current = 0;
      } else if (value >= 10 && value < 100) {
        // Handle tens: "fifty"
        current += value;
      } else {
        // Handle units: "five"
        current += value;
      }
    } else {
      // Try fuzzy matching for this word
      const fuzzyValue = findClosestNumber(word);
      if (fuzzyValue !== null) {
        if (fuzzyValue >= 10 && fuzzyValue < 100) {
          current += fuzzyValue;
        } else {
          current += fuzzyValue;
        }
      }
    }
  }
  
  total += current;
  return total > 0 ? total : null;
}

export function parseCompoundSwahili(text: string): number | null {
  const words = text.toLowerCase().split(/\s+/).filter(w => w !== "na");
  let total = 0;
  let current = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i] || '';
    const value = swahiliNumbers[word];
    
    if (value !== undefined) {
      if (word === "mia" || word === "miya") {
        // Handle hundreds in Swahili
        if (current === 0) current = 1;
        total += current * 100;
        current = 0;
      } else if (value >= 10 && value < 100) {
        // Handle tens
        current += value;
      } else {
        // Handle units
        current += value;
      }
    } else {
      // Try fuzzy matching
      const fuzzyValue = findClosestNumber(word);
      if (fuzzyValue !== null) {
        current += fuzzyValue;
      }
    }
  }

  total += current;
  return total > 0 ? total : null;
}

export function parseCompoundNumber(text: string, language: 'en' | 'sw' = 'en'): number | null {
  if (!text) return null;
  
  console.log('🔍 Parsing COMPOUND number:', text, '| Language:', language);
  
  // Try compound parsing first
  const compoundNum = language === 'sw' 
    ? parseCompoundSwahili(text) 
    : parseCompoundEnglish(text);
  
  if (compoundNum !== null) {
    console.log('✅ Compound parser found:', compoundNum);
    return compoundNum;
  }
  
  // Fallback to simple parsing
  return parseUniversalNumber(text, language);
}


export function swahiliToNumber(text: string): number | null {
  if (!text) return null;
  
  const cleanText = text.toLowerCase().trim();
  
  // Direct match
  if (swahiliNumbers[cleanText] !== undefined) {
    return swahiliNumbers[cleanText];
  }
  
  // Try fuzzy matching
  const fuzzy = findClosestNumber(cleanText);
  if (fuzzy !== null) return fuzzy;
  
  // Parse compound numbers
  const words = cleanText.split(/\s+/).filter((w) => w !== "na");
  let total = 0;
  let current = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i] || '';

    if (word === "mia" || word === "miya") {
      const nextWord = words[i + 1];
      if (nextWord && swahiliNumbers[nextWord] !== undefined) {
        const nextValue = swahiliNumbers[nextWord];
        if (nextValue < 10) {
          total += current;
          current = nextValue * 100;
          i++;
        } else {
          current += 100;
        }
      } else {
        current += 100;
      }
    } else if (word === "elfu" || word === "aelfu") {
      const nextWord = words[i + 1];
      if (nextWord && swahiliNumbers[nextWord] !== undefined) {
        const nextValue = swahiliNumbers[nextWord];
        total += nextValue * 1000;
        i++;
      } else {
        total += 1000;
      }
    } else if (swahiliNumbers[word] !== undefined) {
      const wordValue = swahiliNumbers[word];
      current += wordValue;
    } else {
      // Try fuzzy matching individual words
      const fuzzyWord = findClosestNumber(word);
      if (fuzzyWord !== null) {
        current += fuzzyWord;
      }
    }
  }

  total += current;
  return total > 0 ? total : null;
}


export function kenyanEnglishToNumber(text: string): number | null {
  if (!text) return null;
  
  const cleanText = text.toLowerCase().trim();
  
  // Direct match
  if (kenyanEnglishNumbers[cleanText] !== undefined) {
    return kenyanEnglishNumbers[cleanText];
  }
  
  // Try fuzzy matching
  const fuzzy = findClosestNumber(cleanText);
  if (fuzzy !== null) return fuzzy;
  
  // Try words-to-numbers library
  try {
    // @ts-ignore - words-to-numbers might not be installed
    const wordsToNumbers = require('words-to-numbers');
    const toNumber = wordsToNumbers.default || wordsToNumbers;
    const result = toNumber(cleanText);
    
    if (typeof result === 'number' && !isNaN(result) && result >= 0) {
      return result;
    }
  } catch (e) {
    // Continue with manual parsing
  }
  
  // Manual compound parsing
  const words = cleanText.split(/\s+/);
  let total = 0;
  let current = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i] || '';
    
    let value = kenyanEnglishNumbers[word];
    
    // If no direct match, try fuzzy
    if (value === undefined) {
      const fuzzyResult = findClosestNumber(word);
      if (fuzzyResult !== null) {
        value = fuzzyResult;
      }
    }
    
    if (value !== undefined) {
      if (value >= 100) {
        if (current > 0) {
          total += current * value;
          current = 0;
        } else {
          total += value;
        }
      } else if (value >= 10) {
        current += value;
      } else {
        current += value;
      }
    }
  }
  
  total += current;
  return total > 0 ? total : null;
}

export function parseUniversalNumber(text: string, language: 'en' | 'sw' = 'en'): number | null {
  if (!text) return null;
  
  const cleanText = text.trim();
  
  console.log('🔍 Parsing:', cleanText, '| Language:', language);
  
  
  const digits = extractDigits(cleanText);
  if (digits !== null) {
    console.log('✅ Found digits:', digits);
    return digits;
  }
  

  const fuzzy = findClosestNumber(cleanText);
  if (fuzzy !== null) {
    console.log('✅ Fuzzy match:', fuzzy);
    return fuzzy;
  }
  
  
  if (language === 'sw') {
    const swNum = swahiliToNumber(cleanText);
    if (swNum !== null) {
      console.log('✅ Swahili:', swNum);
      return swNum;
    }
    
    const enNum = kenyanEnglishToNumber(cleanText);
    if (enNum !== null) {
      console.log('✅ English (fallback):', enNum);
      return enNum;
    }
  } else {
    const enNum = kenyanEnglishToNumber(cleanText);
    if (enNum !== null) {
      console.log('✅ English:', enNum);
      return enNum;
    }
    
    const swNum = swahiliToNumber(cleanText);
    if (swNum !== null) {
      console.log('✅ Swahili (fallback):', swNum);
      return swNum;
    }
  }
  
  console.log('❌ No number found');
  return null;
}


export function extractNumber(text: string, language: 'en' | 'sw' = 'en'): number | null {
  if (!text) return null;
  
  console.log('═════════════════════════════════════');
  console.log('🔎 EXTRACTING NUMBER (ULTRA-FORGIVING)');
  console.log('Input:', text);
  console.log('Language:', language);
  
  // Try COMPOUND parsing first
  const compoundNum = parseCompoundNumber(text, language);
  if (compoundNum !== null) {
    console.log('✅ Found with compound parser:', compoundNum);
    return compoundNum;
  }
  
  // Try whole text
  const wholeNum = parseUniversalNumber(text, language);
  if (wholeNum !== null) {
    console.log('✅ Found in whole text:', wholeNum);
    return wholeNum;
  }
  
  // Try word segments
  const words = text.toLowerCase().split(/\s+/);
  console.log('Words:', words);
  
  for (let i = 0; i < words.length; i++) {
    for (let len = Math.min(4, words.length - i); len >= 1; len--) {
      const segment = words.slice(i, i + len).join(' ');
      const num = parseUniversalNumber(segment, language);
      
      if (num !== null) {
        console.log('✅ Found in segment:', segment, '=', num);
        return num;
      }
    }
  }
  
  console.log('❌ No number found');
  return null;
}


export function normalizeVoiceNumber(text: string, language: 'en' | 'sw' = 'en'): number | null {
  if (!text) return null;
  
  let cleanText = text.toLowerCase().trim();
  
  // Enhanced filler word removal
  const fillers = ['my', 'is', 'the', 'a', 'and', 'or', 'glucose', 'sugar', 'blood', 
                   'pressure', 'heart', 'rate', 'sukari', 'damu', 'moyo', 'and', 'na',
                   'please', 'enter', 'weka', 'tafadhali'];
  
  fillers.forEach(word => {
    cleanText = cleanText.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  });
  
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  console.log('🎤 Voice normalized:', text, '→', cleanText);
  
  
  const compoundResult = parseCompoundNumber(cleanText, language);
  if (compoundResult !== null) return compoundResult;
  
  // Fallback to original method
  return extractNumber(cleanText, language);
}

if (typeof window !== 'undefined') {
  (window as any).testParser = {
    test: (text: string, lang: 'en' | 'sw' = 'en') => {
      console.log('\n🧪 TESTING:', text, '(' + lang + ')');
      console.log('─────────────────────────────────────');
      
      const digits = extractDigits(text);
      console.log('Digits:', digits);
      
      const english = kenyanEnglishToNumber(text);
      console.log('English:', english);
      
      const swahili = swahiliToNumber(text);
      console.log('Swahili:', swahili);
      
      const compound = parseCompoundNumber(text, lang);
      console.log('Compound:', compound);
      
      const universal = parseUniversalNumber(text, lang);
      console.log('Universal:', universal);
      
      const extracted = extractNumber(text, lang);
      console.log('Extracted:', extracted);
      
      const normalized = normalizeVoiceNumber(text, lang);
      console.log('Normalized Voice:', normalized);
      
      return extracted;
    },
    
    runTests: () => {
      console.log('\n🎯 RUNNING ALL TESTS\n');
      
      const tests = [
        // Compound numbers
        { text: 'fifty five', lang: 'en' as const, expected: 55 },
        { text: 'thirty four', lang: 'en' as const, expected: 34 },
        { text: 'one hundred twenty five', lang: 'en' as const, expected: 125 },
        { text: 'hamsini na tano', lang: 'sw' as const, expected: 55 },
        { text: 'arobaini na nne', lang: 'sw' as const, expected: 44 },
        { text: 'mia moja ishirini na tano', lang: 'sw' as const, expected: 125 },
        
        // Single numbers
        { text: 'forty', lang: 'en' as const, expected: 40 },
        { text: 'fourty', lang: 'en' as const, expected: 40 },
        { text: 'for tea', lang: 'en' as const, expected: 40 },
        { text: 'fotea', lang: 'en' as const, expected: 40 },
        { text: 'tree', lang: 'en' as const, expected: 3 },
        { text: 'tirty', lang: 'en' as const, expected: 30 },
        { text: 'one hundred twenty', lang: 'en' as const, expected: 120 },
        { text: 'my glucose is forty', lang: 'en' as const, expected: 40 },
        { text: 'arobaini', lang: 'sw' as const, expected: 40 },
        { text: 'arubani', lang: 'sw' as const, expected: 40 },
        { text: 'thelathini', lang: 'sw' as const, expected: 30 },
        { text: 'mia moja ishirini', lang: 'sw' as const, expected: 120 },
        { text: 'kumi na tano', lang: 'sw' as const, expected: 15 },
        { text: '120', lang: 'en' as const, expected: 120 },
        { text: 'glucose 40 mg', lang: 'en' as const, expected: 40 },
      ];
      
      let passed = 0;
      let failed = 0;
      
      tests.forEach(({ text, lang, expected }) => {
        const result = extractNumber(text, lang);
        const status = result === expected ? '✅' : '❌';
        
        if (result === expected) {
          passed++;
        } else {
          failed++;
        }
        
        console.log(`${status} "${text}" → ${result} (expected: ${expected})`);
      });
      
      console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    }
  };
  
  console.log('🛠️ Parser testing tools loaded!');
  console.log('Try:');
  console.log('  window.testParser.test("fifty five", "en")');
  console.log('  window.testParser.runTests()');
}

export default {
  extractNumber,
  parseUniversalNumber,
  parseCompoundNumber,
  parseCompoundEnglish,
  parseCompoundSwahili,
  swahiliToNumber,
  kenyanEnglishToNumber,
  normalizeVoiceNumber,
};