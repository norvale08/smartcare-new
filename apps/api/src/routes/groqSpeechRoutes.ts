import express, { Request, Response } from "express";
import Groq from "groq-sdk";
import multer from "multer";

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Define types
interface TTSRequest {
  text: string;
  voice?: string;
  model?: string;
  language?: string;
}

interface STTResponse {
  success: boolean;
  text: string;
  language: string;
}

interface Voice {
  id: string;
  name: string;
  language: string;
  description: string;
}

// Configure multer with larger size limit and better configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 1 
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedMimes = [
      'audio/webm',
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/m4a',
      'audio/ogg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// ============================================
// TEXT-TO-SPEECH ENDPOINT - ENHANCED
// ============================================
router.post("/tts", async (req: Request<{}, {}, TTSRequest>, res: Response) => {
  try {
    const { text, voice = "alloy", model = "distil-whisper-large-v3-en", language = "en" } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: "Text is required",
        message: "Please provide text to convert to speech"
      });
    }

    console.log("🎤 Generating speech for:", text.substring(0, 50) + "...");
    console.log("🌍 Language:", language);
    console.log("🎵 Voice:", voice);

    // Use Groq's TTS endpoint
    const response = await groq.audio.speech.create({
      model: model,
      input: text,
      voice: voice as any,
      response_format: "mp3",
      speed: 1.0,
    });

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.length.toString(),
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });

    res.send(audioBuffer);
    console.log("✅ Speech generated successfully");
  } catch (error: unknown) {
    console.error("❌ TTS Error:", error);
    res.status(500).json({
      error: "Text-to-speech failed",
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

// ============================================
// SPEECH-TO-TEXT ENDPOINT - ENHANCED WITH SWAHILI
// ============================================
router.post("/stt", upload.single("audio"), async (req: Request, res: Response<STTResponse | { error: string; message: string }>) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: "Audio file is required",
        message: "Please upload an audio file to transcribe"
      });
    }

    console.log("🎧 Transcribing audio with Groq Whisper...");
    console.log("📁 File size:", req.file.size, "bytes");
    console.log("📋 File type:", req.file.mimetype);

    // Get language from request body - support both English and Swahili
    const { language = "en" } = req.body;
    const languageCode = language === "sw" ? "sw" : "en";

    console.log("🌍 Target language:", languageCode);

    // Validate file size (minimum 100 bytes)
    if (req.file.size < 100) {
      return res.status(400).json({
        error: "Audio file too small",
        message: "The audio recording is too short. Please record for at least 1 second."
      });
    }

    // Convert Buffer to File object for Groq API
    const uint8Array = new Uint8Array(req.file.buffer);
    
    // Determine file extension from mimetype
    let extension = 'webm';
    if (req.file.mimetype.includes('wav')) extension = 'wav';
    if (req.file.mimetype.includes('mp3') || req.file.mimetype.includes('mpeg')) extension = 'mp3';
    if (req.file.mimetype.includes('m4a')) extension = 'm4a';
    if (req.file.mimetype.includes('mp4')) extension = 'mp4';
    if (req.file.mimetype.includes('ogg')) extension = 'ogg';

    // Create File object with proper typing
    const audioFile = new File(
      [uint8Array], 
      `audio.${extension}`,
      { type: req.file.mimetype }
    );

    console.log(`📁 Created file: ${audioFile.name}, type: ${audioFile.type}, size: ${audioFile.size} bytes`);

    // Use Groq's Whisper model with language specification
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3", // This model supports multiple languages including Swahili
      language: languageCode, // Specify language for better accuracy
      response_format: "json",
      temperature: 0.0,
      prompt: languageCode === "sw" ? "Andika nambari kwa Kiswahili" : "Transcribe numbers in English", // Language hint
    });

    console.log("✅ Transcription completed:", transcription.text?.substring(0, 100) + "...");

    if (!transcription.text || transcription.text.trim().length === 0) {
      return res.status(400).json({
        error: "No speech detected",
        message: "Could not detect any speech in the audio. Please try again."
      });
    }

    res.json({
      success: true,
      text: transcription.text.trim(),
      language: languageCode,
    });
  } catch (error: unknown) {
    console.error("❌ STT Error:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }

    res.status(500).json({
      error: "Speech-to-text failed",
      message: error instanceof Error ? error.message : "Unknown error occurred. Please try recording again.",
    });
  }
});

// ============================================
// GET AVAILABLE VOICES - WITH LANGUAGE INFO
// ============================================
router.get("/voices", (req: Request, res: Response<{ voices: Voice[] }>) => {
  const voices: Voice[] = [
    { id: "alloy", name: "Alloy", language: "multi", description: "Balanced and clear voice (supports multiple languages)" },
    { id: "echo", name: "Echo", language: "multi", description: "Clear and professional voice" },
    { id: "fable", name: "Fable", language: "multi", description: "Storytelling style voice" },
    { id: "onyx", name: "Onyx", language: "multi", description: "Deep and authoritative voice" },
    { id: "nova", name: "Nova", language: "multi", description: "Bright and cheerful voice (great for Swahili)" },
    { id: "shimmer", name: "Shimmer", language: "multi", description: "Soft and calming voice" },
  ];

  res.json({ voices });
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
router.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "healthy", 
    services: {
      tts: "available",
      stt: "available",
      voices: "available",
      supportedLanguages: ["en", "sw"]
    },
    timestamp: new Date().toISOString()
  });
});

export default router;