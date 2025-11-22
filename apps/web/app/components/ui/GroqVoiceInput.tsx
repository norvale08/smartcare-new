// components/ui/GroqVoiceInput.tsx - COMPLETE FIXED VERSION
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface GroqVoiceInputProps {
  onResult: (text: string) => void;
  language?: "en" | "sw";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const GroqVoiceInput: React.FC<GroqVoiceInputProps> = ({
  onResult,
  language = "en",
  size = "md",
  className = "",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Check for browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(
          language === "sw"
            ? "Kivinjari chako hakitumii kurekodi sauti"
            : "Your browser doesn't support audio recording"
        );
        return;
      }

      // Request microphone access with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      // Check for supported mime types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      let selectedMimeType = 'audio/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      console.log("🎙️ Using MIME type:", selectedMimeType);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("📦 Audio chunk received:", event.data.size, "bytes");
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        console.log("⏹️ Recording stopped, processing audio...");
        
        // Stop all tracks
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log("🛑 Track stopped:", track.kind);
        });

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: selectedMimeType,
        });

        console.log("🎵 Audio blob created:", audioBlob.size, "bytes");

        if (audioBlob.size < 100) {
          toast.error(
            language === "sw"
              ? "Rekodi ni fupi sana. Jaribu tena."
              : "Recording too short. Please try again."
          );
          setIsProcessing(false);
          return;
        }

        // Send to backend for transcription
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error("❌ MediaRecorder error:", event);
        toast.error(
          language === "sw"
            ? "Hitilafu wakati wa kurekodi"
            : "Error during recording"
        );
        stopRecording();
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success(
        language === "sw" ? "🎙️ Kurekodi..." : "🎙️ Recording..."
      );

      console.log("✅ Recording started successfully");
    } catch (error: any) {
      console.error("❌ Recording error:", error);
      
      let errorMessage = language === "sw"
        ? "Imeshindwa kupata maikrofoni"
        : "Failed to access microphone";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = language === "sw"
          ? "Ruhusu programu kutumia maikrofoni"
          : "Please allow microphone access";
      } else if (error.name === "NotFoundError") {
        errorMessage = language === "sw"
          ? "Hakuna maikrofoni iliyopatikana"
          : "No microphone found";
      }

      toast.error(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("🛑 Stopping recording...");
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log("🔄 Starting transcription...");
      console.log("📊 Audio size:", audioBlob.size, "bytes");
      console.log("📋 Audio type:", audioBlob.type);

      // Create form data
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", language);

      console.log("📤 Sending to:", `${API_URL}/api/speech/stt`);

      // Send to backend with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_URL}/api/speech/stt`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Transcription failed");
      }

      const data = await response.json();
      console.log("✅ Transcription result:", data);
      
      if (data.success && data.text) {
        const transcribedText = data.text.trim();
        console.log("📝 Final text:", transcribedText);
        
        onResult(transcribedText);
        
        toast.success(
          language === "sw"
            ? `✅ Imerekodiwa: "${transcribedText}"`
            : `✅ Captured: "${transcribedText}"`,
          { duration: 3000 }
        );
      } else {
        throw new Error("No transcription result");
      }
    } catch (error: any) {
      console.error("❌ Transcription error:", error);
      
      let errorMessage = language === "sw"
        ? "Imeshindwa kubadilisha sauti"
        : "Failed to transcribe audio";

      if (error.name === "AbortError") {
        errorMessage = language === "sw"
          ? "Muda umeisha. Jaribu tena."
          : "Request timed out. Please try again.";
      }

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  const handleToggle = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
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
            : "bg-gradient-to-r from-green-500 to-emerald-500"
        } text-white flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative`}
        title={
          isRecording
            ? language === "sw"
              ? "Komesha kurekodi"
              : "Stop recording"
            : language === "sw"
            ? "Anza kurekodi"
            : "Start recording"
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
      
      {/* Recording timer */}
      {isRecording && recordingTime > 0 && (
        <span className="text-xs font-mono text-red-500 font-bold">
          {recordingTime}s
        </span>
      )}
    </div>
  );
};

export default GroqVoiceInput;