import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const router: Router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/webm', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only WAV, WebM, and OGG audio files are allowed.'));
    }
  },
});

// Python service URL
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';


// Interfaces
interface TranscriptionResponse {
  success: boolean;
  text?: string;
  language?: string;
  error?: string;
}

interface SynthesisRequest {
  text: string;
  language?: string;
}

interface HealthResponse {
  status: string;
  pythonService?: any;
  message?: string;
  error?: string;
}

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`);
    
    const healthResponse: HealthResponse = {
      status: 'ok',
      pythonService: response.data,
    };
    
   
    res.json(healthResponse);
  } catch (error: any) {
    console.error(' Python service health check failed:', error.message);
    const errorResponse: HealthResponse = {
      status: 'error',
      message: 'Python service unavailable',
      error: error.message,
    };
    res.status(503).json(errorResponse);
  }
});

// Speech to text endpoint
router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
  let filePath: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    filePath = req.file.path;
    
    // Get language from request body (sent as form field)
    const language = req.body.language || 'en-US';
    
    console.log('Received audio file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: filePath,
      language: language
    });

    // Create form data to send to Python service
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(filePath), {
      filename: req.file.originalname || 'audio.wav',
      contentType: req.file.mimetype,
    });
    // Add language to form data
    formData.append('language', language);

    
    // Forward to Python service
    const response = await axios.post<TranscriptionResponse>(
      `${PYTHON_SERVICE_URL}/transcribe`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000, // 30 second timeout
      }
    );

    console.log(' Python service response:', response.data);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (response.data.success) {
      res.json(response.data);
    } else {
      res.status(400).json(response.data);
    }
  } catch (error: any) {
    // Clean up file if it exists
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    console.error(' Transcription error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio',
      details: error.response?.data || error.message,
    });
  }
});

// Text to speech endpoint
router.post('/synthesize', express.json(), async (req: Request, res: Response) => {
  try {
    const { text, language = 'en' }: SynthesisRequest = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'No text provided',
      });
    }

    console.log(' Text to speech request:', { text, language });

    // Forward to Python service
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/synthesize`,
      { text, language },
      {
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('Synthesis response received');

    // Stream the audio back to client (MP3 from gTTS)
    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error: any) {
    console.error(' Synthesis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to synthesize speech',
      details: error.response?.data || error.message,
    });
  }
});

export default router;