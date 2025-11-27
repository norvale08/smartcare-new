'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceInputProps {
  onTranscriptionComplete?: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VoiceInput({
  onTranscriptionComplete,
  placeholder = 'Click to record voice',
  className = '',
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Only run on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to convert WebM to WAV
  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    try {
      console.log('🔄 Converting WebM to WAV...');
      
      // Create AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Convert Blob to ArrayBuffer
      const arrayBuffer = await webmBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create WAV file
      const wavBuffer = encodeAudioBufferToWav(audioBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      
      console.log('✓ WebM to WAV conversion successful:', wavBlob.size, 'bytes');
      return wavBlob;
    } catch (err) {
      console.error('❌ WebM to WAV conversion failed:', err);
      throw new Error('Failed to convert audio format');
    }
  };

  // Function to encode AudioBuffer to WAV
  const encodeAudioBufferToWav = (audioBuffer: AudioBuffer): ArrayBuffer => {
    // Use safe defaults with proper type assertions
    const numChannels = audioBuffer.numberOfChannels ?? 1;
    const sampleRate = Math.floor(audioBuffer.sampleRate ?? 16000);
    const length = audioBuffer.length ?? 0;
    
    // Validate audio data
    if (length === 0) {
      throw new Error('Audio buffer is empty');
    }

    // Calculate buffer size safely
    const bufferSize = 44 + length * numChannels * 2;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numChannels * 2, true);
    writeString(8, 'WAVE');
    
    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
    view.setUint16(32, numChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // data chunk
    writeString(36, 'data');
    view.setUint32(40, length * numChannels * 2, true);
    
    // Write PCM data - safely handle channel data
    let offset = 44;
    
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        try {
          const channelData = audioBuffer.getChannelData(channel);
          const sample = Math.max(-1, Math.min(1, channelData[i] ?? 0));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        } catch (err) {
          // If channel data is unavailable, write silence
          view.setInt16(offset, 0, true);
          offset += 2;
        }
      }
    }
    
    return buffer;
  };

  const handleMicClick = async () => {
    if (!isClient) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      console.log('✓ Microphone access granted');
      
      // Try to find the best supported MIME type
      const mimeType = getSupportedMimeType();
      console.log('📹 Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('✓ Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎤 Recording stopped');
        setIsProcessing(true);
        
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('✓ Audio blob created:', audioBlob.size, 'bytes', 'Type:', mimeType);
        
        try {
          let finalBlob = audioBlob;
          let filename = 'recording.webm';
          
          // Convert to WAV if not already in WAV format
          if (!mimeType.includes('wav')) {
            console.log('🔄 Converting to WAV format...');
            finalBlob = await convertWebmToWav(audioBlob);
            filename = 'recording.wav';
          }
          
          const formData = new FormData();
          formData.append('audio', finalBlob, filename);
          
          console.log('📤 Sending to transcription API...');
          
          const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
            method: 'POST',
            body: formData,
          });

          console.log('📨 Response status:', response.status);
          const data = await response.json();
          console.log('📨 Response data:', data);

          if (!response.ok) {
            throw new Error(data.error || 'Transcription failed');
          }

          if (data.text) {
            console.log('✅ Transcription successful:', data.text);
            if (onTranscriptionComplete) {
              onTranscriptionComplete(data.text);
            }
          } else {
            throw new Error(data.error || 'No transcription received');
          }
        } catch (err) {
          console.error('❌ Transcription error:', err);
          setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('✓ Microphone track stopped');
          });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('✅ Recording started');
    } catch (err) {
      console.error('❌ Recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  // Helper function to get supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'audio/wav',
      'audio/wave', 
      'audio/x-wav',
      'audio/webm;codecs=opus',
      'audio/webm'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`✓ Supported MIME type: ${type}`);
        return type;
      }
    }
    
    // Fallback to default
    return 'audio/webm';
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Don't render anything until we're on the client
  if (!isClient) {
    return (
      <button
        type="button"
        disabled
        className="px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm"
      >
        <Mic size={16} className="inline" />
      </button>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleMicClick}
        disabled={isProcessing}
        className={`
          px-3 py-2 rounded-lg font-medium transition-all text-sm
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2 justify-center min-w-[100px]
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        title={isRecording ? 'Click to stop' : placeholder}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline">Processing...</span>
          </>
        ) : isRecording ? (
          <>
            <Square size={16} fill="currentColor" />
            <span className="hidden sm:inline">Stop</span>
          </>
        ) : (
          <>
            <Mic size={16} />
            <span className="hidden sm:inline">Record</span>
          </>
        )}
      </button>
      
      {error && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}