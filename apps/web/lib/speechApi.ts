import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TranscriptionResponse {
  success: boolean;
  text?: string;
  language?: string;
  error?: string;
}

export interface SynthesisRequest {
  text: string;
  language?: string;
}

class SpeechAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/python-speech`;
    console.log('🔧 SpeechAPI initialized with URL:', this.baseUrl);
  }

  /**
   * Check if the speech service is healthy
   */
  async checkHealth(): Promise<{ status: string; pythonService?: any }> {
    try {
      console.log('🔍 Checking health at:', `${this.baseUrl}/health`);
      const response = await axios.get(`${this.baseUrl}/health`);
      console.log('✅ Health check successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Health check failed:', {
        message: error.message,
        url: `${this.baseUrl}/health`,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Speech service unavailable');
    }
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(audioBlob: Blob): Promise<TranscriptionResponse> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      console.log('🎯 Sending audio to:', `${this.baseUrl}/transcribe`);
      console.log('📊 Audio details:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      const response = await axios.post<TranscriptionResponse>(
        `${this.baseUrl}/transcribe`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      console.log('✅ Transcription successful:', response.data);
      return response.data;
    } catch (error: any) {
      // Enhanced error handling for different error formats
      console.error('❌ Transcription failed - Full error details:', {
        message: error.message,
        url: `${this.baseUrl}/transcribe`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        requestHeaders: error.config?.headers,
        fullError: error
      });

      // Handle different error response formats
      let errorMessage = 'Failed to transcribe audio';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.details) {
          errorMessage = error.response.data.details;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(request: SynthesisRequest): Promise<Blob> {
    try {
      console.log('🔊 Synthesizing speech:', request);
      const response = await axios.post(
        `${this.baseUrl}/synthesize`,
        request,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('✅ Synthesis successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Synthesis failed:', error);
      throw new Error(
        error.response?.data?.error || 'Failed to synthesize speech'
      );
    }
  }
}

export const speechAPI = new SpeechAPI();