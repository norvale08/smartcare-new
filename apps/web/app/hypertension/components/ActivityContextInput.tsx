"use client"

import React, { useState } from "react"
import { Activity, Clock, Zap } from "lucide-react"

export interface ActivityContext {
  activityType: string
  duration: number // minutes
  intensity: "light" | "moderate" | "vigorous"
  timeSinceActivity: number // minutes ago
  notes?: string
}

interface ActivityContextInputProps {
  onSubmit: (context: ActivityContext) => void
  loading?: boolean
}

const ACTIVITY_OPTIONS = [
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

export default function ActivityContextInput({ onSubmit, loading = false }: ActivityContextInputProps) {
  const [activityType, setActivityType] = useState("none")
  const [duration, setDuration] = useState("30")
  const [intensity, setIntensity] = useState<"light" | "moderate" | "vigorous">("moderate")
  const [timeSinceActivity, setTimeSinceActivity] = useState("5")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    if (activityType === "none") {
      onSubmit({
        activityType: "none",
        duration: 0,
        intensity: "light",
        timeSinceActivity: 0,
        notes: "",
      })
    } else {
      onSubmit({
        activityType,
        duration: Number.parseInt(duration) || 0,
        intensity,
        timeSinceActivity: Number.parseInt(timeSinceActivity) || 0,
        notes,
      })
    }
  }

  return (
    <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-sm">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Activity Context
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Tell us what you were doing before taking your vitals. This helps us determine if your BP reading is
        activity-related.
      </p>
      
      <div className="space-y-6">
        {/* Activity Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">What were you doing?</label>
          <select
            value={activityType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActivityType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            {ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Show additional fields only if activity is selected */}
        {activityType !== "none" && (
          <>
            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="480"
                value={duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Intensity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Intensity Level
              </label>
              <div className="flex gap-2">
                {(["light", "moderate", "vigorous"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    disabled={loading}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      intensity === level
                        ? "bg-blue-600 text-white"
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
              <label className="text-sm font-medium text-gray-700">How long ago? (minutes)</label>
              <input
                type="number"
                min="0"
                max="1440"
                value={timeSinceActivity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeSinceActivity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Additional notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="E.g., 'Felt anxious during workout' or 'Just had salty food'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-20 resize-none"
                disabled={loading}
              />
            </div>
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing...
            </div>
          ) : (
            "Submit Activity Context"
          )}
        </button>
      </div>
    </div>
  )
}
