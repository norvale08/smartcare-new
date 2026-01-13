"use client";
import React, { useState, useRef, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TTSReaderProps {
  text: string; // The text to read
  language?: "en" | "sw";
  autoPlay?: boolean;
  showControls?: boolean;
  onComplete?: () => void;
}

const TTSReader: React.FC<TTSReaderProps> = ({
  text,
  language = "en",
  autoPlay = false,
  showControls = true,
  onComplete,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const sentencesRef = useRef<string[]>([]);
  const isReadingRef = useRef(false);

  // Split text into sentences
  useEffect(() => {
    if (text) {
      sentencesRef.current = text
        .split(/(?<=[.!?])\s+/)
        .filter((s: string) => s.trim().length > 0);
      
      if (autoPlay && sentencesRef.current.length > 0) {
        setTimeout(() => startReading(), 500);
      }
    }
  }, [text, autoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading();
    };
  }, []);

  // Speak a single sentence using your existing TTS API
  const speakSentence = async (sentence: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const synthesisLang = language === "sw" ? "sw" : "en";
        
        const response = await fetch(`${API_URL}/api/python-speech/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sentence, language: synthesisLang }),
        });

        if (!response.ok) {
          reject(new Error("Synthesis failed"));
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(new Error("Audio playback error"));
        };

        await audio.play();
      } catch (error) {
        reject(error);
      }
    });
  };

  // Start reading from current position
  const startReading = async () => {
    if (isReadingRef.current || !sentencesRef.current.length) return;
    
    isReadingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    
    try {
      for (let i = currentIndex; i < sentencesRef.current.length; i++) {
        if (!isReadingRef.current) break;
        
        setCurrentIndex(i);
        const sentence = sentencesRef.current[i];
        if (sentence) {
          await speakSentence(sentence);
        }
        
        // Small pause between sentences
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      // Completed reading all sentences
      if (isReadingRef.current) {
        stopReading();
        onComplete?.();
      }
    } catch (error) {
      console.error("Error reading text:", error);
      stopReading();
    }
  };

  // Pause reading
  const pauseReading = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    isReadingRef.current = false;
    setIsPaused(true);
    setIsPlaying(false);
  };

  // Resume reading
  const resumeReading = () => {
    setIsPaused(false);
    startReading();
  };

  // Stop reading completely and reset
  const stopReading = () => {
    isReadingRef.current = false;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
  };

  // Toggle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      pauseReading();
    } else if (isPaused) {
      resumeReading();
    } else {
      startReading();
    }
  };

  if (!showControls) {
    return null;
  }

  return (
    <div className="flex gap-3 items-center flex-wrap">
      {/* Play/Pause/Resume Button */}
      <button
        onClick={togglePlayback}
        disabled={!text}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        {isPlaying ? (
          <>
            <span className="text-lg">⏸️</span>
            <span className="hidden sm:inline">Pause</span>
          </>
        ) : isPaused ? (
          <>
            <span className="text-lg">▶️</span>
            <span className="hidden sm:inline">Resume</span>
          </>
        ) : (
          <>
            <span className="text-lg">🔊</span>
            <span className="hidden sm:inline">Listen</span>
          </>
        )}
      </button>

      {/* Stop Button (only show when playing or paused) */}
      {(isPlaying || isPaused) && (
        <button
          onClick={stopReading}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          <span className="text-lg">⏹️</span>
          <span className="hidden sm:inline">Stop</span>
        </button>
      )}

      {/* Status Indicator */}
      {isPlaying && (
        <div className="flex items-center gap-2 text-green-600 font-medium">
          <span className="text-lg animate-pulse">🔊</span>
          <span className="hidden sm:inline">Reading...</span>
        </div>
      )}

      {isPaused && (
        <div className="flex items-center gap-2 text-yellow-600 font-medium">
          <span className="text-lg">⏸️</span>
          <span className="hidden sm:inline">Paused</span>
        </div>
      )}
    </div>
  );
};

export default TTSReader;