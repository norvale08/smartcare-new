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

// Helper function to safely extract error info
function getErrorInfo(error: any) {
  return {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data
  };
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
    console.error('Python service health check failed:', error.message);
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
    const language = req.body.language || 'en-US';
    
    console.log('Received audio file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: filePath,
      language: language
    });

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(filePath), {
      filename: req.file.originalname || 'audio.wav',
      contentType: req.file.mimetype,
    });
    formData.append('language', language);

    const response = await axios.post<TranscriptionResponse>(
      `${PYTHON_SERVICE_URL}/transcribe`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000,
      }
    );

    console.log('Python service response:', response.data);

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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

    const errorInfo = getErrorInfo(error);
    console.error('Transcription error:', errorInfo);

    // Handle rate limiting
    if (errorInfo.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: error.response?.headers['retry-after'] || 60
      });
    }

    res.status(errorInfo.status || 500).json({
      success: false,
      error: 'Failed to transcribe audio',
      details: errorInfo.data || errorInfo.message,
    });
  }
});

// Text to speech endpoint with retry logic
async function synthesizeSpeechWithRetry(text: string, language: string, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
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
      return response;
    } catch (error: any) {
      // If rate limited and not last attempt, wait and retry
      if (error.response?.status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '2');
        const waitTime = Math.min(retryAfter * 1000, 5000); // Max 5 seconds
        
        console.log(`Rate limited. Retrying after ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If not rate limit error or last attempt, throw
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

router.post('/synthesize', express.json(), async (req: Request, res: Response) => {
  try {
    const { text, language = 'en' }: SynthesisRequest = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'No text provided',
      });
    }

    console.log('Text to speech request:', { text, language });

    // Use retry logic
    const response = await synthesizeSpeechWithRetry(text, language);

    console.log('Synthesis response received');

    // Stream the audio back to client
    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
    
  } catch (error: any) {
    const errorInfo = getErrorInfo(error);
    console.error('Synthesis error:', errorInfo);

    // Don't try to send JSON if headers already sent (stream started)
    if (res.headersSent) {
      return res.end();
    }

    // Handle rate limiting
    if (errorInfo.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Speech service is currently busy. Please try again in a moment.',
        retryAfter: error.response?.headers['retry-after'] || 60
      });
    }

    res.status(errorInfo.status || 500).json({
      success: false,
      error: 'Failed to synthesize speech',
      details: errorInfo.data || errorInfo.message,
    });
  }
});

export default router;