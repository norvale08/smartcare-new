"use client";
import React, { useState } from "react";

interface VoiceInputProps {
  onResult: (text: string) => void;
  placeholder?: string;
  lang?: string; // e.g. "en-US" or "sw-KE"
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onResult,
  placeholder = "Click mic and speak...",
  lang = "en-US",
}) => {
  const [listening, setListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    // ✅ Use `any` to avoid TS error
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.start();
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={handleVoiceInput}
        className={`px-3 py-1 rounded-md ${
          listening ? "bg-red-500 text-white" : "bg-blue-500 text-white"
        }`}
      >
        {listening ? "Listening..." : "🎤 Speak"}
      </button>
      <span className="text-gray-500 text-sm">{placeholder}</span>
    </div>
  );
};

export default VoiceInput;
