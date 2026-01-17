'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Globe } from 'lucide-react';

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
  const [language, setLanguage] = useState<'en-US' | 'sw'>('en-US'); // DEFAULT: English

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const encodeWav = (audioBuffer: AudioBuffer): ArrayBuffer => {
    const numChannels = audioBuffer.numberOfChannels || 1;
    const sampleRate = audioBuffer.sampleRate || 16000;
    const length = audioBuffer.length;

    if (length === 0) {
      throw new Error('Audio buffer is empty');
    }

    const buffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(buffer);

    const writeString = (off: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(off + i, str.charCodeAt(i));
      }
    };

    // WAV Header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numChannels * 2, true);
    writeString(8, 'WAVE');

    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);

    writeString(36, 'data');
    view.setUint32(40, length * numChannels * 2, true);

    // PCM Samples
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i] || 0;
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
    }

    return buffer;
  };

  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await webmBlob.arrayBuffer();

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    if (!audioBuffer) {
      throw new Error('Failed to decode audio');
    }

    const wavArrayBuffer = encodeWav(audioBuffer);
    return new Blob([wavArrayBuffer], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm; codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => handleStopRecording(stream);

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to start recording');
    }
  };

  const handleStopRecording = async (stream: MediaStream) => {
    setIsProcessing(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: 'audio/webm',
      });

      const wavBlob = await convertWebmToWav(audioBlob);

      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      formData.append('language', language); // Send selected language to Express

      const response = await fetch(`${API_URL}/api/python-speech/transcribe`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      if (data.text && onTranscriptionComplete) {
        onTranscriptionComplete(data.text);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process audio');
    } finally {
      stream.getTracks().forEach((track) => track.stop());
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (!isClient) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en-US' ? 'sw' : 'en-US');
  };

  if (!isClient) {
    return (
      <button
        disabled
        className="px-3 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm"
      >
        <Mic size={16} />
      </button>
    );
  }

  return (
    <div className={`${className} flex items-center gap-2`}>
      {/* Language Toggle */}
      <button
        type="button"
        onClick={toggleLanguage}
        disabled={isRecording || isProcessing}
        className={`
          px-3 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2
          bg-gray-100 hover:bg-gray-200 text-gray-700
          ${(isRecording || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={`Switch to ${language === 'en-US' ? 'Swahili' : 'English'}`}
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{language === 'en-US' ? '🇺🇸 English' : '🇰🇪 Swahili'}</span>
        <span className="sm:hidden">{language === 'en-US' ? 'EN' : 'SW'}</span>
      </button>

      {/* Record Button */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={isProcessing}
        className={`
          px-3 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2
          ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white hover:bg-blue-600'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline">Processing...</span>
          </>
        ) : isRecording ? (
          <>
            <Square size={16} />
            <span className="hidden sm:inline">Stop</span>
          </>
        ) : (
          <>
            <Mic size={16} />
            <span className="hidden sm:inline">Record</span>
          </>
        )}
      </button>

      {error && <p className="text-red-600 text-xs mt-1 absolute top-full left-0">{error}</p>}
    </div>
  );
}