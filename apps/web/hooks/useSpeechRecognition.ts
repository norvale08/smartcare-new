'use client';

import { useState, useRef, useCallback } from 'react';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';
import { speechAPI, TranscriptionResponse } from '@/lib/speechApi';

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
  
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscription(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Standard for speech recognition
          channelCount: 1,   // Mono for better compatibility
        } 
      });
      
      streamRef.current = stream;

      // Initialize recorder with WAV format
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav', // Force WAV format
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1, // Mono
        desiredSampRate: 16000, // 16kHz sample rate
        bufferSize: 4096,
        timeSlice: 1000, // Optional: get blob every second
        ondataavailable: (blob) => {
          console.log('Audio data available:', blob.size, 'bytes');
        }
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
      
      console.log('🎤 Recording started in WAV format');
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    setIsRecording(false);
    setIsProcessing(true);

    console.log('🛑 Stopping recording...');

    recorderRef.current.stopRecording(async () => {
      try {
        const blob = recorderRef.current!.getBlob();
        
        console.log('📦 Audio blob created:', {
          size: blob.size,
          type: blob.type,
          format: 'WAV'
        });

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('🎯 Stopped track:', track.kind);
          });
        }

        // Send to backend for transcription
        console.log('🚀 Sending to speech API...');
        const result: TranscriptionResponse = await speechAPI.transcribe(blob);

        if (result.success && result.text) {
          console.log('✅ Transcription successful:', result.text);
          setTranscription(result.text);
          setError(null);
        } else {
          const errorMsg = result.error || 'Failed to transcribe audio';
          console.error('❌ Transcription failed:', errorMsg);
          setError(errorMsg);
        }
      } catch (err: any) {
        console.error('💥 Error processing recording:', err);
        setError(err.message || 'Failed to process recording');
      } finally {
        setIsProcessing(false);
        recorderRef.current = null;
        streamRef.current = null;
        console.log('🧹 Cleanup complete');
      }
    });
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscription(null);
    setError(null);
    console.log('🗑️ Transcription cleared');
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