'use client';

import React from 'react';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';

interface VoiceInputProps {
  onTranscriptionComplete?: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VoiceInput({
  onTranscriptionComplete,
  placeholder = 'Click the microphone to start speaking...',
  className = '',
}: VoiceInputProps) {
  const {
    isRecording,
    isProcessing,
    transcription,
    error,
    startRecording,
    stopRecording,
    clearTranscription,
  } = useSpeechRecognition();

  React.useEffect(() => {
    if (transcription && onTranscriptionComplete) {
      onTranscriptionComplete(transcription);
    }
  }, [transcription, onTranscriptionComplete]);

  const handleMicClick = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className={`voice-input-container ${className}`}>
      <div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
        {/* Microphone Button */}
        <div className="flex justify-center">
          <button
            onClick={handleMicClick}
            disabled={isProcessing}
            className={`
              relative w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-300 transform hover:scale-110
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isProcessing ? (
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="text-center">
          {isRecording && (
            <p className="text-red-600 font-medium animate-pulse">
              🎤 Recording... Click to stop
            </p>
          )}
          {isProcessing && (
            <p className="text-blue-600 font-medium">
              ⏳ Processing your speech...
            </p>
          )}
          {!isRecording && !isProcessing && !transcription && !error && (
            <p className="text-gray-600">{placeholder}</p>
          )}
        </div>

        {/* Transcription Result */}
        {transcription && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-green-800 font-semibold">Transcription:</h3>
              <button
                onClick={clearTranscription}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Clear
              </button>
            </div>
            <p className="text-gray-800">{transcription}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">Error:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}