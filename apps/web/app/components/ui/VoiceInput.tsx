"use client";
import React, { useState } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

interface VoiceInputProps {
  onResult: (text: string) => void;
  lang?: string;
  size?: "xs" | "sm" | "md";
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onResult,
  lang = "en-US",
  size = "sm",
}) => {
  const [listening, setListening] = useState(false);

  const sizeClasses = {
    xs: "px-2 py-1 text-xs min-w-12 h-8",
    sm: "px-3 py-2 text-sm min-w-16 h-10 w-full sm:w-auto", // Added responsive width
    md: "px-4 py-2 text-base min-w-20 h-12 w-full sm:w-auto" // Added responsive width
  };

  const iconSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base"
  };

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

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={handleVoiceInput}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 shadow-sm ${
        listening 
          ? "bg-emerald-600 text-white border border-emerald-500" 
          : "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 border border-emerald-500"
      } ${sizeClasses[size]}`}
      title={listening ? "Listening... Click to stop" : "Click to speak"}
    >
      {listening ? (
        <FaMicrophoneSlash className={`${iconSizes[size]} mr-2`} />
      ) : (
        <FaMicrophone className={`${iconSizes[size]} mr-2`} />
      )}
      <span className="sm:hidden">
        {listening ? "Listening..." : "Voice Input"}
      </span>
      <span className="hidden sm:inline">
        {listening ? "Stop" : ""}
      </span>
    </button>
  );
};

export default VoiceInput;