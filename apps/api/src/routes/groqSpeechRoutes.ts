// routes/speech.route.ts - ENHANCED COMPOUND NUMBER PARSING
import express, { Request, Response } from "express";
import Groq from "groq-sdk";
import multer from "multer";
import { createReadStream, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const router = express.Router();

// Initialize Groq
let groq: Groq;
try {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log("✅ Groq SDK initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Groq SDK:", error);
  process.exit(1);
}

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// ============================================
// ENHANCED COMPOUND NUMBER PARSER
// ============================================

const kenyanEnglishNumbers: Record<string, number> = {
  // Zero variations
  'zero': 0, 'siro': 0, 'ziro': 0, 'sero': 0, 'sera': 0,
  
  // Single digits
  'one': 1, 'wan': 1, 'won': 1, 'wun': 1, 'wen': 1,
  'two': 2, 'too': 2, 'to': 2, 'tu': 2, 'tuu': 2, 'tuo': 2,
  'three': 3, 'tree': 3, 'tri': 3, 'trii': 3, 'trie': 3,
  'four': 4, 'for': 4, 'foa': 4, 'fo': 4,
  'five': 5, 'fife': 5, 'faiv': 5, 'fiv': 5, 'faive': 5,
  'six': 6, 'sex': 6, 'siks': 6, 'sikis': 6,
  'seven': 7, 'sebben': 7, 'seben': 7, 'sefen': 7, 'sebun': 7, 'sevin': 7,
  'eight': 8, 'ate': 8, 'eyt': 8, 'eit': 8, 'ait': 8,
  'nine': 9, 'nain': 9, 'nayn': 9, 'nyn': 9, 'naini': 9,
  
  // Teens
  'ten': 10, 'tin': 10, 'tein': 10,
  'eleven': 11, 'elefen': 11, 'ileven': 11, 'elevan': 11,
  'twelve': 12, 'twelef': 12, 'tuelve': 12, 'twelv': 12,
  'thirteen': 13, 'tirteen': 13, 'turteen': 13, 'tatin': 13, 'tartin': 13,
  'fourteen': 14, 'forteen': 14, 'foteen': 14, 'fortin': 14,
  'fifteen': 15, 'fiftin': 15, 'fivtin': 15, 'fiften': 15,
  'sixteen': 16, 'sextin': 16, 'sikstin': 16, 'siksten': 16,
  'seventeen': 17, 'sebentin': 17, 'seventin': 17, 'sebenten': 17,
  'eighteen': 18, 'eitin': 18, 'eytin': 18, 'eiten': 18,
  'nineteen': 19, 'naintin': 19, 'nayntin': 19, 'nainten': 19,
  
  // Tens
  'twenty': 20, 'tweny': 20, 'twenti': 20, 'tuenty': 20,
  'thirty': 30, 'tirty': 30, 'turty': 30, 'tati': 30, 'thati': 30, 'tarti': 30,
  'forty': 40, 'fourty': 40, 'for tea': 40, 'fortea': 40, 'fotea': 40, 
  'foty': 40, 'forti': 40, 'fouty': 40, 'fotty': 40, 'footy': 40,
  'fifty': 50, 'fefty': 50, 'fifti': 50, 'fivty': 50, 'feefty': 50,
  'sixty': 60, 'sexty': 60, 'siksti': 60, 'sisti': 60, 'sxty': 60,
  'seventy': 70, 'sebenty': 70, 'seventi': 70, 'sebenti': 70,
  'eighty': 80, 'aitty': 80, 'eity': 80, 'eyty': 80, 'aity': 80, 'eiti': 80, 'ati': 80,
  'ninety': 90, 'nainty': 90, 'naynti': 90, 'ninty': 90, 'ninti': 90,
  
  // Hundreds
  'hundred': 100, 'handred': 100, 'hondred': 100, 'hundret': 100, 'handret': 100, 'hanred': 100,
};

const swahiliNumbers: Record<string, number> = {
  // Basic numbers
  'sifuri': 0, 'sufuri': 0, 'sifure': 0, 'sefuri': 0,
  'moja': 1, 'moya': 1,
  'mbili': 2, 'bili': 2, 'mbiri': 2, 'biri': 2,
  'tatu': 3, 'tate': 3,
  'nne': 4, 'ne': 4, 'ine': 4, 'inne': 4,
  'tano': 5, 'tan': 5, 'tanu': 5,
  'sita': 6, 'sete': 6, 'sitta': 6,
  'saba': 7, 'sab': 7, 'sabba': 7,
  'nane': 8, 'nan': 8, 'nanne': 8,
  'tisa': 9, 'tise': 9, 'tissa': 9,
  
  // Tens
  'kumi': 10, 'kume': 10,
  'ishirini': 20, 'ishrini': 20, 'shirini': 20, 'ishirin': 20,
  'thelathini': 30, 'thelatin': 30, 'selathini': 30, 'selatin': 30,
  'arobaini': 40, 'arubani': 40, 'arobani': 40, 'robani': 40, 'arobain': 40, 'arubain': 40,
  'hamsini': 50, 'hamsin': 50, 'amsini': 50,
  'sitini': 60, 'sitin': 60, 'stin': 60,
  'sabini': 70, 'sabin': 70, 'sabni': 70,
  'themanini': 80, 'themanin': 80, 'thamanini': 80, 'tamanini': 80, 'temanini': 80,
  'tisini': 90, 'tisin': 90, 'tsin': 90,
  
  // Larger numbers
  'mia': 100, 'miya': 100, 'mea': 100,
};

// ============================================
// COMPOUND NUMBER PARSING FUNCTIONS
// ============================================

function parseCompoundEnglish(text: string): number | null {
  const words = text.toLowerCase().split(/\s+/);
  let total = 0;
  let current = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
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

function parseCompoundSwahili(text: string): number | null {
  const words = text.toLowerCase().split(/\s+/).filter(w => w !== "na");
  let total = 0;
  let current = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
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

function findClosestNumber(input: string): number | null {
  const clean = input.toLowerCase().trim();
  const allNumbers = { ...kenyanEnglishNumbers, ...swahiliNumbers };
  
  if (allNumbers[clean] !== undefined) return allNumbers[clean];
  
  for (const [key, value] of Object.entries(allNumbers)) {
    if (clean.includes(key) || key.includes(clean)) {
      return value;
    }
  }
  
  for (const [key, value] of Object.entries(allNumbers)) {
    if (key.length > 2 && clean.length > 2) {
      const similarity = calculateSimilarity(clean, key);
      if (similarity > 0.75) {
        return value;
      }
    }
  }
  
  return null;
}

function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  
  return matches / longer.length;
}

function extractDigits(text: string): number | null {
  const digits = text.replace(/[^\d]/g, '');
  if (digits.length > 0) {
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num >= 0 && num <= 1000) return num;
  }
  return null;
}

// ============================================
// ENHANCED HYBRID EXTRACTION WITH COMPOUND SUPPORT
// ============================================

async function extractNumberWithAI(text: string, language: string): Promise<{
  number: number | null;
  confidence: string;
  method: string;
  candidates: number[];
}> {
  console.log("🤖 Enhanced Hybrid Extraction with Compound Support");
  
  const candidates: number[] = [];
  
  try {
    // Step 1: Try digits first (fastest)
    const digits = extractDigits(text);
    if (digits !== null) {
      console.log("🔢 Found digits:", digits);
      return { number: digits, confidence: 'high', method: 'digits', candidates: [digits] };
    }
    
    // Step 2: Try COMPOUND parsing
    const compoundNum = language === "sw" 
      ? parseCompoundSwahili(text) 
      : parseCompoundEnglish(text);
    
    if (compoundNum !== null) {
      candidates.push(compoundNum);
      console.log("🔧 Compound parser found:", compoundNum);
    }
    
    // Step 3: Ask AI with enhanced compound number awareness
    const systemPrompt = language === "sw" 
      ? `Wewe ni msaidizi wa kuchanganua nambari za Kikenya. Elewa nambari mchanganyiko.

SHERIA ZA MSINGI:
1. Toa nambari MOJA tu (0-1000)
2. Kama hakuna nambari, sema "null"
3. Elewa nambari mchanganyiko: "hamsini na tano" = 55, "arobaini na nne" = 44
4. Nambari za makumi: ishirini=20, thelathini=30, arobaini=40, hamsini=50
5. "Mia moja ishirini na tano" = 125

Jibu kwa JSON: {"number": <nambari au null>, "confidence": "high|medium|low", "reasoning": "ufafanuzi"}`
      : `You are a Kenyan accent-aware number extraction assistant. Understand COMPOUND numbers.

KEY RULES:
1. Return only ONE number (0-1000)
2. If no number, return "null"
3. Understand COMPOUND numbers: "fifty five" = 55, "thirty four" = 34
4. Understand accent variations: "fifty" = 50, "fivty" = 50, "fifty five" = 55
5. "One hundred twenty five" = 125, "two hundred" = 200

Respond in JSON: {"number": <number or null>, "confidence": "high|medium|low", "reasoning": "brief explanation"}`;

    const userPrompt = `Extract the COMPOUND number from this Kenyan speech: "${text}"`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const aiResult = JSON.parse(responseText);
    
    console.log("🤖 AI Response:", aiResult);
    
    if (aiResult.number !== null && typeof aiResult.number === 'number') {
      const aiNum = Math.round(aiResult.number);
      if (aiNum >= 0 && aiNum <= 1000) {
        candidates.push(aiNum);
        console.log("🤖 AI suggests:", aiNum, `(${aiResult.reasoning || 'no reason'})`);
      }
    }
    
    // Step 4: Validation & Decision Logic
    if (candidates.length === 0) {
      return { number: null, confidence: 'low', method: 'none', candidates: [] };
    }
    
    if (candidates.length === 1) {
      return { 
        number: candidates[0], 
        confidence: compoundNum !== null ? 'high' : 'medium', 
        method: compoundNum !== null ? 'compound-parser-only' : 'ai-only',
        candidates 
      };
    }
    
    // Both found numbers - check if they match or are close
    const [compoundValue, aiValue] = candidates;
    
    if (compoundValue === aiValue) {
      console.log("✅ Perfect match! Compound parser and AI agree:", compoundValue);
      return { number: compoundValue, confidence: 'high', method: 'ai+compound-parser-match', candidates };
    }
    
    // Check if numbers are in same range (within 10%)
    const diff = Math.abs(compoundValue - aiValue);
    const avg = (compoundValue + aiValue) / 2;
    const percentDiff = (diff / avg) * 100;
    
    if (percentDiff < 10) {
      console.log(`⚠️ Close match (${percentDiff.toFixed(1)}% diff): preferring compound parser`);
      return { number: compoundValue, confidence: 'medium', method: 'compound-parser-preferred-close', candidates };
    }
    
    // Significant disagreement - prefer compound parser
    console.log(`⚠️ Disagreement: Compound=${compoundValue}, AI=${aiValue}`);
    console.log("   → Preferring compound parser");
    return { number: compoundValue, confidence: 'medium', method: 'compound-parser-preferred-safe', candidates };
    
  } catch (error) {
    console.error("❌ AI error:", error);
    
    // Fallback to compound parsing only
    const compoundNum = language === "sw" 
      ? parseCompoundSwahili(text) 
      : parseCompoundEnglish(text);
    
    if (compoundNum !== null) return { number: compoundNum, confidence: 'medium', method: 'compound-parser-fallback', candidates: [compoundNum] };
    
    return { number: null, confidence: 'low', method: 'error', candidates: [] };
  }
}

// ============================================
// ENDPOINTS
// ============================================

router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "speech-to-text",
    features: ["smart-hybrid-ai-parser", "kenyan-accent-support", "compound-number-parsing"],
    timestamp: new Date().toISOString()
  });
});

router.post("/stt", upload.single("audio"), async (req: Request, res: Response) => {
  console.log("🎧 STT Request (Enhanced Compound Parser)");
  
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file provided"
      });
    }

    console.log("📁 Audio:", req.file.size, "bytes");

    if (req.file.size < 100) {
      return res.status(400).json({
        success: false,
        error: "Audio file too small"
      });
    }

    const { language = "en" } = req.body;
    const languageCode = language === "sw" ? "sw" : "en";
    
    console.log("🌍 Language:", languageCode);

    const tempFilePath = join(tmpdir(), `audio-${Date.now()}.webm`);
    writeFileSync(tempFilePath, req.file.buffer);

    try {
      const audioStream = createReadStream(tempFilePath);
      
      const prompts = {
        en: "Kenyan English numbers with compound support: fifty five, thirty four, one hundred twenty five, two hundred, forty two, sixty seven, eighty nine, ninety nine.",
        sw: "Nambari za Kiswahili mchanganyiko: hamsini na tano, arobaini na nne, mia moja ishirini na tano, mia mbili, arobaini na mbili, sitini na saba, themanini na tisa, tisini na tisa."
      };

      console.log("🎯 Transcribing with compound number awareness...");

      const transcription = await groq.audio.transcriptions.create({
        file: audioStream,
        model: "whisper-large-v3",
        response_format: "verbose_json",
        temperature: 0.0,
        language: languageCode,
        prompt: prompts[languageCode as 'en' | 'sw']
      });

      try {
        unlinkSync(tempFilePath);
      } catch (e) {
        console.warn("Could not delete temp file");
      }

      const rawText = transcription.text?.trim() || '';

      if (!rawText) {
        return res.json({
          success: false,
          error: "No speech detected",
          message: "Please speak clearly and try again."
        });
      }

      console.log("📝 Raw transcription:", rawText);

      // Use enhanced compound extraction
      const result = await extractNumberWithAI(rawText, languageCode);
      
      console.log("🎯 Final result:", result);

      if (result.number !== null && result.number > 0) {
        res.json({
          success: true,
          text: result.number.toString(),
          raw_text: rawText,
          language: languageCode,
          extraction_method: result.method,
          confidence: result.confidence,
          candidates: result.candidates,
          debug: {
            ai_parser_agreement: result.candidates.length > 1 ? result.candidates[0] === result.candidates[1] : null
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          success: false,
          error: "No number detected",
          message: `Could not find a number in the speech. I heard: "${rawText}". Please try again.`,
          raw_text: rawText,
          extraction_method: result.method,
          candidates: result.candidates
        });
      }

    } catch (groqError: any) {
      try {
        unlinkSync(tempFilePath);
      } catch (e) {}

      console.error("❌ Groq Error:", groqError);
      
      let errorMessage = "Transcription failed";
      let statusCode = 500;

      if (groqError?.status === 401) {
        errorMessage = "Invalid API key";
        statusCode = 401;
      } else if (groqError?.status === 429) {
        errorMessage = "Rate limit exceeded";
        statusCode = 429;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? groqError.message : undefined
      });
    }

  } catch (error: any) {
    console.error("❌ STT Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.options("/stt", (req: Request, res: Response) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.status(200).send();
});

export default router;