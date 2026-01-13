// apps/web/app/components/ui/GroqVoiceInput.tsx - ENHANCED WITH COMPOUND PARSER
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

// Import your enhanced local parser
import { normalizeVoiceNumber, parseCompoundNumber } from "../utils/swahiliParser";

interface GroqVoiceInputProps {
  onResult: (text: string) => void;
  language?: "en" | "sw";
  size?: "sm" | "md" | "lg";
  className?: string;
  recordingDuration?: number;
  enableLocalParser?: boolean; // Option to use local parser first
  validationRange?: { min: number; max: number }; // Optional validation
}

const GroqVoiceInput: React.FC<GroqVoiceInputProps> = ({
  onResult,
  language = "en",
  size = "md",
  className = "",
  recordingDuration = 5,
  enableLocalParser = true,
  validationRange,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingStage, setProcessingStage] = useState<"idle" | "transcribing" | "parsing" | "validating">("idle");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(
          language === "sw"
            ? "Kivinjari chako hakitumii kurekodi sauti"
            : "Your browser doesn't support audio recording"
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ];

      let selectedMimeType = 'audio/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      console.log("🎙️ Using MIME type:", selectedMimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("📦 Chunk:", event.data.size, "bytes");
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("⏹️ Recording stopped");
        
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: selectedMimeType,
        });

        console.log("🎵 Audio blob:", audioBlob.size, "bytes");

        if (audioBlob.size < 500) {
          toast.error(
            language === "sw"
              ? "Rekodi ni fupi sana"
              : "Recording too short"
          );
          setIsProcessing(false);
          return;
        }

        await transcribeAudio(audioBlob);
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error("❌ MediaRecorder error:", event);
        stopRecording();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, recordingDuration * 1000);

      toast.success(
        language === "sw" 
          ? `🎙️ Kurekodi... (${recordingDuration}s)` 
          : `🎙️ Recording... (${recordingDuration}s)`,
        { duration: 1500 }
      );

      console.log("✅ Recording started");
    } catch (error: any) {
      console.error("❌ Recording error:", error);
      
      let errorMessage = language === "sw"
        ? "Imeshindwa kupata maikrofoni"
        : "Failed to access microphone";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = language === "sw"
          ? "Ruhusu matumizi ya maikrofoni"
          : "Please allow microphone access";
      } else if (error.name === "NotFoundError") {
        errorMessage = language === "sw"
          ? "Hakuna maikrofoni"
          : "No microphone found";
      }

      toast.error(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("🛑 Stopping...");
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const validateNumber = (num: number): { isValid: boolean; message?: string } => {
    if (!validationRange) return { isValid: true };
    
    if (num < validationRange.min || num > validationRange.max) {
      return {
        isValid: false,
        message: language === "sw"
          ? `Nambari lazima iwe kati ya ${validationRange.min} na ${validationRange.max}`
          : `Number must be between ${validationRange.min} and ${validationRange.max}`
      };
    }
    
    return { isValid: true };
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log("🔄 Starting transcription process...");
      setProcessingStage("transcribing");

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", language);

      console.log("📤 Sending to backend...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_URL}/api/speech/stt`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("📥 Response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Server error:", errorData);
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Backend result:", data);
      
      // Backend returned success with a number
      if (data.success && data.text) {
        const number = data.text.trim();
        console.log("📝 Backend extracted:", number);
        
        const parsed = parseInt(number, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setProcessingStage("validating");
          
          // Validate the number
          const validation = validateNumber(parsed);
          
          if (validation.isValid) {
            onResult(number);
            
            // Show confidence info if available
            const confidenceEmoji = data.confidence === 'high' ? '✅' : 
                                   data.confidence === 'medium' ? '⚠️' : '❓';
            
            toast.success(
              language === "sw"
                ? `${confidenceEmoji} ${number} imepatikana (${data.extraction_method || 'hybrid'})`
                : `${confidenceEmoji} Got ${number} (${data.extraction_method || 'hybrid'})`,
              { duration: 3000 }
            );
            
            // Log debug info
            if (data.candidates && data.candidates.length > 1) {
              console.log("🤖 AI+Parser candidates:", data.candidates);
            }
          } else {
            toast.error(validation.message || "Invalid number", { duration: 4000 });
          }
          
          return;
        }
      }
      
      // Backend couldn't extract a number - try local parser if enabled
      const rawText = data.raw_text || data.debug?.transcription || "";
      console.log("❌ Backend failed. Raw text:", rawText);
      
      if (enableLocalParser && rawText) {
        console.log("🔧 Trying local COMPOUND parser...");
        setProcessingStage("parsing");
        
        // Use enhanced compound parser
        const localNumber = normalizeVoiceNumber(rawText, language);
        console.log("📝 Local compound parser result:", localNumber);
        
        if (localNumber !== null) {
          const validation = validateNumber(localNumber);
          
          if (validation.isValid) {
            onResult(localNumber.toString());
            
            toast.success(
              language === "sw"
                ? `✅ ${localNumber} imepatikana (local compound parser)`
                : `✅ Got ${localNumber} (local compound parser)`,
              { duration: 3000 }
            );
            
            return;
          } else {
            toast.error(validation.message || "Invalid number", { duration: 4000 });
            return;
          }
        }
      }
      
      // Both methods failed
      toast.error(
        language === "sw"
          ? `❌ Sikuelewa nambari. Nilisikia: "${rawText}"`
          : `❌ Couldn't understand number. I heard: "${rawText}"`,
        { duration: 5000 }
      );
      
    } catch (error: any) {
      console.error("❌ Transcription error:", error);
      
      let errorMessage = language === "sw"
        ? "Imeshindwa"
        : "Failed";

      if (error.name === "AbortError") {
        errorMessage = language === "sw"
          ? "Muda umeisha"
          : "Timed out";
      } else if (error.message.includes("network")) {
        errorMessage = language === "sw"
          ? "Tatizo la mtandao"
          : "Network error";
      }

      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
      setProcessingStage("idle");
    }
  };

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  const getProcessingMessage = () => {
    switch (processingStage) {
      case "transcribing":
        return language === "sw" ? "Inasikia..." : "Listening...";
      case "parsing":
        return language === "sw" ? "Inachakata nambari mchanganyiko..." : "Parsing compound number...";
      case "validating":
        return language === "sw" ? "Inathibitisha..." : "Validating...";
      default:
        return language === "sw" ? "Inachakata..." : "Processing...";
    }
  };

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <button
        onClick={handleToggle}
        disabled={isProcessing}
        className={`${sizeClasses[size]} rounded-full ${
          isRecording
            ? "bg-gradient-to-r from-red-500 to-pink-500 animate-pulse"
            : isProcessing
            ? "bg-gradient-to-r from-blue-500 to-purple-500"
            : "bg-gradient-to-r from-green-500 to-emerald-500"
        } text-white flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        title={
          isRecording
            ? language === "sw" ? "Komesha" : "Stop"
            : language === "sw" ? "Anza" : "Start"
        }
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" size={iconSizes[size]} />
        ) : isRecording ? (
          <Square size={iconSizes[size]} />
        ) : (
          <Mic size={iconSizes[size]} />
        )}
      </button>
      
      {isRecording && recordingTime > 0 && (
        <span className="text-xs font-mono text-red-500 font-bold animate-pulse">
          {recordingTime}s
        </span>
      )}
      
      {isProcessing && (
        <span className="text-xs text-gray-500 animate-pulse">
          {getProcessingMessage()}
        </span>
      )}
    </div>
  );
};

export default GroqVoiceInput;