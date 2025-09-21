"use client"
import React from "react";
import { MicVocal } from "lucide-react";

export default function VitalsEntry({
  systolic,
  diastolic,
  heartRate,
  setSystolic,
  setDiastolic,
  setHeartRate,
  listening,
  transcript,
  error,
  onVoiceSystolic,
  onVoiceDiastolic,
  onVoiceHeartRate,
  canSave,
  onSave,
  statusText
}: any) {
  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Enter Your Vitals</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">Blood Pressure (mmHg)</label>
          <div className="flex gap-2 mb-3">
            <input type="number" placeholder="Systolic (120)" value={systolic} onChange={(e) => setSystolic(e.target.value)} className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-400 focus:outline-none flex-1 w-1/2" />
            <span className="flex items-center text-gray-500 px-2">/</span>
            <input type="number" placeholder="Diastolic (80)" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-400 focus:outline-none flex-1 w-1/2" />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={onVoiceSystolic} disabled={listening} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 flex-1">
              <MicVocal size={16} />
              Voice Systolic
            </button>
            <button onClick={onVoiceDiastolic} disabled={listening} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 flex-1">
              <MicVocal size={16} />
              Voice Diastolic
            </button>
          </div>
          <div className="flex gap-2 items-center mt-2">
            {listening && <span className="text-xs text-emerald-700">Listening…</span>}
            {transcript && <span className="text-xs text-gray-600">"{transcript}"</span>}
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-2">Heart Rate (BPM)</label>
          <input type="number" placeholder="72" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className="border-2 border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-emerald-400 focus:outline-none" />
          <button onClick={onVoiceHeartRate} disabled={listening} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 py-2 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50">
            <MicVocal size={16} />
            Voice Heart Rate
          </button>
          <div className="flex items-center gap-2 mt-2">
            {listening && <span className="text-xs text-emerald-700">Listening…</span>}
            {transcript && <span className="text-xs text-gray-600">"{transcript}"</span>}
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors" disabled={!canSave}>
          {statusText}
        </button>
      </div>
    </div>
  );
}


