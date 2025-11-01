"use client"

import React, { useState } from "react"
import ContextAwareAlert, { type ContextAnalysis } from "./ContextAwareAlert"
import { Heart, Activity as ActivityIcon, Clock, Zap, Mic } from "lucide-react"

// Voice input component
const VoiceInput = ({
  onResult,
  placeholder = "Click mic and speak...",
  lang = "en-US",
  disabled = false,
}: {
  onResult: (text: string) => void
  placeholder?: string
  lang?: string
  disabled?: boolean
}) => {
  const [listening, setListening] = useState(false)

  const handleVoiceInput = async () => {
    if (disabled) return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }

    recognition.start()
  }

  return (
    <button
      type="button"
      onClick={handleVoiceInput}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
        listening
          ? "bg-red-500 text-white"
          : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
      }`}
      title={placeholder}
    >
      <Mic className="w-4 h-4" />
    </button>
  )
}

// Number normalization function
const normalizeNumber = (text: string): number | null => {
  text = text.toLowerCase().trim()

  if (!text) return null

  // Try to extract numbers from text
  const digitMatch = text.match(/\d{1,3}(?:\.\d+)?/)
  if (digitMatch) {
    const parsed = parseFloat(digitMatch[0])
    if (!Number.isNaN(parsed)) return Math.round(parsed)
  }

  return null
}

const activityOptions = [
  { value: "none", label: "No recent activity" },
  { value: "exercise", label: "Exercise/Workout" },
  { value: "walking", label: "Walking" },
  { value: "eating", label: "Eating/Meal" },
  { value: "stress", label: "Stress/Anxiety" },
  { value: "sleep_deprivation", label: "Sleep Deprivation" },
  { value: "caffeine", label: "Caffeine Intake" },
  { value: "medication", label: "Recent Medication" },
  { value: "illness", label: "Illness/Fever" },
  { value: "other", label: "Other" },
]

interface VitalsWithActivityInputProps {
  onAfterSave?: () => void
}

export default function VitalsWithActivityInput({
  onAfterSave,
}: VitalsWithActivityInputProps) {
  const [systolic, setSystolic] = useState("")
  const [diastolic, setDiastolic] = useState("")
  const [heartRate, setHeartRate] = useState("")
  const [activityType, setActivityType] = useState("none")
  const [duration, setDuration] = useState("")
  const [intensity, setIntensity] = useState("moderate")
  const [timeSinceActivity, setTimeSinceActivity] = useState("")
  const [notes, setNotes] = useState("")
  const [message, setMessage] = useState("")
  const [analysis, setAnalysis] = useState<ContextAnalysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastAnalyzedVitals, setLastAnalyzedVitals] = useState<{
    systolic: number
    diastolic: number
    heartRate: number
  } | null>(null)

  const reset = () => {
    setSystolic("")
    setDiastolic("")
    setHeartRate("")
    setActivityType("none")
    setDuration("")
    setIntensity("moderate")
    setTimeSinceActivity("")
    setNotes("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setAnalysis(null)

    if (!systolic || !diastolic || !heartRate) {
      setMessage("Please enter all vital sign values.")
      return
    }

    if (
      Number(systolic) < 50 ||
      Number(systolic) > 250 ||
      Number(diastolic) < 30 ||
      Number(diastolic) > 150 ||
      Number(heartRate) < 30 ||
      Number(heartRate) > 200
    ) {
      setMessage("Please enter realistic vital values.")
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("User not authenticated.")

      // Save vitals + activity to backend
      const saveResp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hypertensionVitals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            systolic: Number(systolic),
            diastolic: Number(diastolic),
            heartRate: Number(heartRate),
            activityType,
            duration: Number(duration) || 0,
            intensity,
            timeSinceActivity: Number(timeSinceActivity) || 0,
            notes,
          }),
        }
      )

      if (!saveResp.ok) throw new Error("Failed to save vitals")

      // Call AI analysis
      const aiResp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hypertensionVitals/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            vitals: {
              systolic: Number(systolic),
              diastolic: Number(diastolic),
              heartRate: Number(heartRate),
            },
            activity: {
              activityType,
              duration: Number(duration) || 0,
              intensity,
              timeSinceActivity: Number(timeSinceActivity) || 0,
              notes,
            },
          }),
        }
      )

      if (!aiResp.ok) throw new Error("AI analysis failed")

      const aiJson = await aiResp.json()
      setAnalysis(aiJson)
      setLastAnalyzedVitals({
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        heartRate: Number(heartRate),
      })
      setMessage("✅ Vitals saved & analyzed successfully!")
      if (onAfterSave) onAfterSave()
      reset()
    } catch (e: any) {
      setMessage(e.message || "There was an error. Please try again.")
      setAnalysis(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 p-2 rounded-lg shadow-sm">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Enter Vitals & Activity Context
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Enter your blood pressure, heart rate, and recent activity — see AI-guided feedback instantly after saving.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Systolic */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Systolic (mmHg)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                min={50}
                max={250}
                placeholder="e.g. 120"
                disabled={saving}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <VoiceInput
                lang="en-US"
                placeholder="Say your systolic value..."
                onResult={(text) => {
                  const num = normalizeNumber(text)
                  if (num !== null && num >= 50 && num <= 250) {
                    setSystolic(num.toString())
                  } else {
                    setMessage("Please say a valid systolic value between 50–250")
                  }
                }}
                disabled={saving}
              />
            </div>
            <p className="text-xs text-gray-500">Upper number</p>
          </div>

          {/* Diastolic */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Diastolic (mmHg)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                min={30}
                max={150}
                placeholder="e.g. 80"
                disabled={saving}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <VoiceInput
                lang="en-US"
                placeholder="Say your diastolic value..."
                onResult={(text) => {
                  const num = normalizeNumber(text)
                  if (num !== null && num >= 30 && num <= 150) {
                    setDiastolic(num.toString())
                  } else {
                    setMessage("Please say a valid diastolic value between 30–150")
                  }
                }}
                disabled={saving}
              />
            </div>
            <p className="text-xs text-gray-500">Lower number</p>
          </div>

          {/* Heart Rate */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Heart Rate (bpm)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                min={30}
                max={200}
                placeholder="e.g. 72"
                disabled={saving}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <VoiceInput
                lang="en-US"
                placeholder="Say your heart rate..."
                onResult={(text) => {
                  const num = normalizeNumber(text)
                  if (num !== null && num >= 30 && num <= 200) {
                    setHeartRate(num.toString())
                  } else {
                    setMessage("Please say a valid heart rate between 30–200")
                  }
                }}
                disabled={saving}
              />
            </div>
            <p className="text-xs text-gray-500">Beats/min</p>
          </div>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activity Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4" />
              Recent Activity Type
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {activityOptions.map((opt) => (
                <option value={opt.value} key={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration (minutes)
            </label>
            <input
              type="number"
              min={0}
              max={480}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Intensity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intensity
            </label>
            <div className="flex gap-2">
              {(["light", "moderate", "vigorous"] as const).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setIntensity(level)}
                  disabled={saving}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    intensity === level
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Since Activity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              How long ago? (minutes)
            </label>
            <input
              type="number"
              min={0}
              max={1440}
              value={timeSinceActivity}
              onChange={(e) => setTimeSinceActivity(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              rows={2}
              placeholder="E.g., Just finished a walk, or feeling stressed out this morning..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.includes("✅")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            "Save Vitals & Analyze"
          )}
        </button>
      </form>

      {analysis && lastAnalyzedVitals && (
        <div className="mt-6">
          <ContextAwareAlert analysis={analysis} vitals={lastAnalyzedVitals} />
        </div>
      )}
    </div>
  )
}
