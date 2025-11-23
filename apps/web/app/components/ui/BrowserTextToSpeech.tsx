// apps/web/app/components/ui/BrowserTextToSpeech.tsx - COMPLETE
"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface BrowserTextToSpeechProps {
  text: string;
  language?: "en" | "sw";
  autoPlay?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const BrowserTextToSpeech: React.FC<BrowserTextToSpeechProps> = ({
  text,
  language = "en",
  autoPlay = false,
  className = "",
  size = "md",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError("Speech synthesis not supported");
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        console.log(`🔊 Loaded ${availableVoices.length} voices`);
      }
    };

    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = () => {
    if (!text || text.trim().length === 0) {
      const msg = language === "sw" ? "Hakuna maandishi ya kusema" : "No text to speak";
      toast.error(msg);
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error("Speech not supported in this browser");
      return;
    }

    try {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language with fallbacks
      if (language === "sw") {
        utterance.lang = "sw-KE"; // Swahili (Kenya)
      } else {
        utterance.lang = "en-US"; // English (US)
      }
      
      // Try to find the best voice for the language
      let selectedVoice: SpeechSynthesisVoice | null = null;

      if (voices.length > 0) {
        // Priority 1: Exact language match (e.g., "sw-KE" or "en-US")
        selectedVoice = voices.find(voice => 
          voice.lang === utterance.lang
        ) || null;

        // Priority 2: Language code match (e.g., "sw" or "en")
        if (!selectedVoice) {
          const langCode = language === "sw" ? "sw" : "en";
          selectedVoice = voices.find(voice => 
            voice.lang.startsWith(langCode)
          ) || null;
        }

        // Priority 3: Any English voice for Swahili (fallback)
        if (!selectedVoice && language === "sw") {
          selectedVoice = voices.find(voice => 
            voice.lang.startsWith("en")
          ) || null;
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log(`🎙️ Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        }
      }

      // Configure speech parameters
      utterance.rate = 0.85; // Slightly slower for medical data clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        console.log("🔊 Speech started");
        setIsPlaying(true);
        setIsLoading(false);
        setError(null);
      };

      utterance.onend = () => {
        console.log("🔊 Speech ended");
        setIsPlaying(false);
      };

      utterance.onerror = (event) => {
        console.error("❌ Speech error:", event);
        setIsPlaying(false);
        setIsLoading(false);
        
        const msg = language === "sw" 
          ? "Imeshindwa kucheza sauti" 
          : "Failed to play audio";
        setError(msg);
        toast.error(msg);
      };

      setIsLoading(true);
      window.speechSynthesis.speak(utterance);

    } catch (err) {
      console.error("❌ Speech error:", err);
      setIsPlaying(false);
      setIsLoading(false);
      
      const msg = language === "sw" 
        ? "Hitilafu imetokea" 
        : "An error occurred";
      setError(msg);
      toast.error(msg);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      console.log("🛑 Speech stopped");
    }
  };

  const handleToggle = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      speak();
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && text && text.trim().length > 0 && voices.length > 0) {
      // Small delay to ensure voices are fully loaded
      const timer = setTimeout(() => {
        speak();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, voices.length]);

  // Show error state if browser doesn't support speech
  if (error && error.includes("not supported")) {
    return null; // Don't show button if not supported
  }

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

      {error && !error.includes("not supported") && (
        <span className="text-xs text-red-500 font-medium max-w-[100px] truncate">
          {error}
        </span>
      )}
    </div>
  );
};

export default BrowserTextToSpeech;