"use client";

import { useState, useEffect, useRef } from "react";

type Lang = "en-US" | "sw-KE" | "sw-TZ";

export type VoiceHook = {
  listening: boolean;
  transcript: string;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  setTranscript: (t: string) => void;
  error: string | null;
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: ((event: any) => void) | null;
    onend: (() => void) | null;
  }
}

export function useVoiceInput(defaultLang: Lang = "en-US"): VoiceHook {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    // only create once
    if (!recognitionRef.current) {
      const recognition: SpeechRecognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = defaultLang; // 👈 default language
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult?.isFinal) {
          setTranscript(lastResult[0].transcript);
        }
      };

      recognition.onend = () => setListening(false);
      // optional but helpful
      // @ts-expect-error vendor types
      recognition.onerror = (e: any) => {
        setError(e?.error || "speech_error");
        setListening(false);
      };
      // @ts-expect-error vendor types
      recognition.onstart = () => {
        setError(null);
        setListening(true);
      };

      recognitionRef.current = recognition;
    }
  }, [defaultLang]);

  const startListening = (lang?: string) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      if (lang) {
        recognition.lang = lang;
      }
      setTranscript("");
      setError(null);
      recognition.start();
      setListening(true);
    } catch (e) {
      console.error("SpeechRecognition start error:", e);
      setError("start_error");
    }
  };

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
      setListening(false);
    } catch (e) {
      console.error("SpeechRecognition stop error:", e);
      setError("stop_error");
    }
  };

  return { listening, transcript, startListening, stopListening, setTranscript, error };
}
