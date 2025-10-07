"use client";

import React from "react";
import { MicVocal } from "lucide-react";
import { wordsToNumbers } from "./words-to-numbers";

interface VitalsInputProps {
  systolic: string;
  onSystolicChange: (value: string) => void;
  diastolic: string;
  onDiastolicChange: (value: string) => void;
  heartRate: string;
  onHeartRateChange: (value: string) => void;
  message: string;
  onSubmit: () => Promise<void>;
  hasToken: boolean;
  status: "authenticated" | "loading" | "unauthenticated";
  listening: boolean;
  transcript: string;
  error?: string | null;
  language: string;
  onStartListening: (field: "systolic" | "diastolic" | "heartRate") => void;
}

const VitalsInput: React.FC<VitalsInputProps> = ({
  systolic,
  onSystolicChange,
  diastolic,
  onDiastolicChange,
  heartRate,
  onHeartRateChange,
  message,
  onSubmit,
  hasToken,
  status,
  listening,
  transcript,
  error,
  language,
  onStartListening,
}) => {

  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Enter Your Vitals
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Blood Pressure (mmHg)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              placeholder="Systolic (120)"
              value={systolic}
              onChange={(e) => onSystolicChange(e.target.value)}
              className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-400 focus:outline-none flex-1 w-1/2"
            />
            <span className="flex items-center text-gray-500 px-2">/</span>
            <input
              type="number"
              placeholder="Diastolic (80)"
              value={diastolic}
              onChange={(e) => onDiastolicChange(e.target.value)}
              className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-400 focus:outline-none flex-1 w-1/2"
            />
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onStartListening("systolic")}
              disabled={listening}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 flex-1"
            >
              <MicVocal size={16} />
              Voice Systolic
            </button>
            <button
              onClick={() => onStartListening("diastolic")}
              disabled={listening}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 flex-1"
            >
              <MicVocal size={16} />
              Voice Diastolic
            </button>
          </div>
          <div className="flex gap-2 items-center mt-2">
            {listening && (
              <span className="text-xs text-emerald-700">Listening…</span>
            )}
            {transcript && (
              <span className="text-xs text-gray-600">"{transcript}"</span>
            )}
            {error && (
              <span className="text-xs text-red-600">{error}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">
            Heart Rate (BPM)
          </label>
          <input
            type="number"
            placeholder="72"
            value={heartRate}
            onChange={(e) => onHeartRateChange(e.target.value)}
            className="border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-emerald-400 focus:outline-none"
          />
          <button
            onClick={() => onStartListening("heartRate")}
            disabled={listening}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
          >
            <MicVocal size={16} />
            Voice Heart Rate
          </button>
          <div className="flex items-center gap-2 mt-2">
            {listening && (
              <span className="text-xs text-emerald-700">Listening…</span>
            )}
            {transcript && (
              <span className="text-xs text-gray-600">"{transcript}"</span>
            )}
            {error && (
              <span className="text-xs text-red-600">{error}</span>
            )}
          </div>
        </div>
      </div>

      {message && (
        <p className="text-sm mb-4 text-gray-700 font-medium">{message}</p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          disabled={!hasToken || !systolic || !diastolic || !heartRate}
        >
          {status === "loading" ? "Checking login..." : "Save Vitals"}
        </button>
      </div>
    </div>
  );
};

export default VitalsInput;
