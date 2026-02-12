"use client";
import React, { useState, useRef, useEffect } from "react";
import { Volume2, Pause, Square, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TTSReaderProps {
  text: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && text) {
      setTimeout(() => speak(), 500);
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, [text, autoPlay]);

  // ✅ Speak COMPLETE text at once (no splitting)
  const speak = async () => {
    if (!text) return;

    try {
      setIsLoading(true);

      const synthesisLang = language === "sw" ? "sw" : "en";

      // ✅ Send COMPLETE text in ONE request
      const response = await fetch(`${API_URL}/api/python-speech/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: text, // ✅ Full text, not split into sentences
          language: synthesisLang 
        }),
      });

      if (!response.ok) {
        throw new Error("TTS failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      // Create and play new audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadeddata = () => {
        setIsLoading(false);
      };

      audio.onplay = () => {
        setIsPlaying(true);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        onComplete?.();
      };

      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
        console.error("Audio playback error");
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  // Stop and reset
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Pause/Resume
  const togglePlayback = () => {
    if (!audioRef.current) {
      speak();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  if (!showControls) {
    return null;
  }

  return (
    <div className="flex gap-3 items-center flex-wrap">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayback}
        disabled={!text || isLoading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Loading...</span>
          </>
        ) : isPlaying ? (
          <>
            <Pause className="h-4 w-4" />
            <span className="hidden sm:inline">Pause</span>
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            <span className="hidden sm:inline">Listen</span>
          </>
        )}
      </button>

      
      {isPlaying && (
        <button
          onClick={stop}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          <Square className="h-4 w-4" />
          <span className="hidden sm:inline">Stop</span>
        </button>
      )}

      {/* Status Indicator */}
      {isPlaying && (
        <div className="flex items-center gap-2 text-green-600 font-medium">
          <Volume2 className="h-4 w-4 animate-pulse" />
          <span className="hidden sm:inline">Playing...</span>
        </div>
      )}
    </div>
  );
};

export default TTSReader;