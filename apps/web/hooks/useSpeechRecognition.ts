'use client';

import { useState, useRef, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcription: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscription: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscription(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        } 
      });
      
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      console.log('🎤 Recording started');
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    console.log('🛑 Stopping recording...');
    setIsRecording(false);
    setIsProcessing(true);

    mediaRecorderRef.current.stop();
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Wait for all data to be available
    setTimeout(async () => {
      try {
        const blob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm' 
        });

        console.log('📦 Audio blob created:', {
          size: blob.size,
          type: blob.type
        });

        if (blob.size === 0) {
          throw new Error('Recorded audio is empty');
        }

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        console.log('🚀 Sending to speech API...');
        
        // CORRECT ENDPOINT - using python-speech
        const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
          method: 'POST',
          body: formData,
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Transcription result:', result);

        if (result.success && result.text) {
          setTranscription(result.text);
          setError(null);
        } else {
          throw new Error(result.error || 'Transcription failed');
        }
      } catch (err: any) {
        console.error('💥 Error processing recording:', err);
        setError(err.message || 'Failed to process recording');
      } finally {
        setIsProcessing(false);
        mediaRecorderRef.current = null;
        streamRef.current = null;
        audioChunksRef.current = [];
      }
    }, 500);
  }, [isRecording, API_URL]);

  const clearTranscription = useCallback(() => {
    setTranscription(null);
    setError(null);
  }, []);

  return {
    isRecording,
    isProcessing,
    transcription,
    error,
    startRecording,
    stopRecording,
    clearTranscription,
  };
}