// components/ui/GroqTextToSpeech.tsx - COMPLETE FIXED VERSION
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface GroqTextToSpeechProps {
  text: string;
  voice?: string;
  language?: "en" | "sw";
  autoPlay?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const GroqTextToSpeech: React.FC<GroqTextToSpeechProps> = ({
  text,
  voice = "alloy",
  language = "en",
  autoPlay = false,
  className = "",
  size = "md",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  const generateAndPlaySpeech = async () => {
    if (!text || text.trim().length === 0) {
      const msg = language === "sw" ? "Hakuna maandishi ya kusema" : "No text to speak";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("🔊 Generating speech for:", text);
      console.log("🌍 Language:", language);
      console.log("🎵 Voice:", voice);

      // Clean up previous audio
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Call backend TTS endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_URL}/api/speech/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: text.trim(), 
          voice,
          language,
          model: "distil-whisper-large-v3-en"
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("📥 TTS Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ TTS Error response:", errorText);
        throw new Error("Failed to generate speech");
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      console.log("🎵 Audio blob received:", audioBlob.size, "bytes");

      if (audioBlob.size < 100) {
        throw new Error("Audio file too small");
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.onloadeddata = () => {
        console.log("✅ Audio loaded successfully");
      };

      audio.onplay = () => {
        console.log("▶️ Audio playing");
        setIsPlaying(true);
      };

      audio.onpause = () => {
        console.log("⏸️ Audio paused");
        setIsPlaying(false);
      };

      audio.onended = () => {
        console.log("⏹️ Audio ended");
        setIsPlaying(false);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };

      audio.onerror = (e) => {
        console.error("❌ Audio playback error:", e);
        const msg = language === "sw" 
          ? "Imeshindwa kucheza sauti" 
          : "Failed to play audio";
        setError(msg);
        setIsPlaying(false);
        toast.error(msg);
      };

      // Play the audio
      try {
        await audio.play();
        console.log("🔊 Audio playback started");
      } catch (playError) {
        console.error("❌ Play error:", playError);
        throw new Error("Failed to play audio");
      }

    } catch (err: any) {
      console.error("❌ TTS Error:", err);
      
      let errorMessage = language === "sw"
        ? "Imeshindwa kutengeneza sauti"
        : "Failed to generate speech";

      if (err.name === "AbortError") {
        errorMessage = language === "sw"
          ? "Muda umeisha. Jaribu tena."
          : "Request timed out. Please try again.";
      }

      setError(errorMessage);
      setIsPlaying(false);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      console.log("🛑 Audio stopped");
    }
  };

  const handleToggle = () => {
    if (isPlaying) {
      stopSpeech();
    } else if (!isLoading) {
      generateAndPlaySpeech();
    }
  };

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && text && text.trim().length > 0) {
      generateAndPlaySpeech();
    }
  }, [autoPlay]); // Only run on mount

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={handleToggle}
        disabled={isLoading || !text || text.trim().length === 0}
        className={`${sizeClasses[size]} rounded-full ${
          isPlaying 
            ? "bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" 
            : "bg-gradient-to-r from-blue-500 to-purple-500"
        } text-white flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        title={
          isPlaying 
            ? (language === "sw" ? "Simamisha" : "Stop")
            : (language === "sw" ? "Sikiliza" : "Listen")
        }
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={iconSizes[size]} />
        ) : isPlaying ? (
          <VolumeX size={iconSizes[size]} />
        ) : (
          <Volume2 size={iconSizes[size]} />
        )}
      </button>

      {error && (
        <span className="text-xs text-red-500 font-medium max-w-[100px] truncate">
          {error}
        </span>
      )}
    </div>
  );
};

export default GroqTextToSpeech;