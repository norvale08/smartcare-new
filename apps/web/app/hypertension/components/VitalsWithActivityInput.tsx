"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import ContextAwareAlert, { type ContextAnalysis } from "./ContextAwareAlert"
import { Heart, Activity as ActivityIcon, Clock, Zap, Mic } from "lucide-react"
import { useTranslation } from "../../../lib/hypertension/useTranslation"
import InteractiveVoiceForm from "./InteractiveVoiceForm"
import VoiceControlPanel from "./VoiceControlPanel"
import { 
  startVoiceMode, 
  stopVoiceMode, 
  speak, 
  listenForField,
  pauseVoiceMode,
  resumeVoiceMode,
  VoiceModeState 
} from "../utils/voiceUtils"
import toast from "react-hot-toast";
import { languageContent } from "../utils/formUtils"

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
  const { t } = useTranslation()
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
  const [showVoiceForm, setShowVoiceForm] = useState(false)
  const [voiceModeState, setVoiceModeState] = useState<VoiceModeState>({
    active: false,
    listening: false,
    speaking: false,
    currentField: null,
    muted: false,
    paused: false,
    status: ""
  })
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const languageValue = t.language === "sw-TZ" ? "sw" : "en"
  const currentLanguage = languageContent[languageValue]
  const isProcessingRef = useRef(false)
  const fieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceModeActiveRef = useRef(false)
  const pausedRef = useRef(false)

  // Update voice mode ref when state changes
  useEffect(() => {
    voiceModeActiveRef.current = voiceModeState.active
  }, [voiceModeState.active])

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      voiceModeActiveRef.current = false
    }
  }, [])

  // Text-to-Speech wrapper with pausedRef
  const handleSpeak = useCallback(async (text: string): Promise<void> => {
    return speak(
      text, 
      languageValue, 
      voiceModeState.muted, 
      voiceModeActiveRef,
      pausedRef,
      (state) => setVoiceModeState(prev => ({ ...prev, ...state }))
    )
  }, [languageValue, voiceModeState.muted])

  // Handle pause/resume functionality
  const handlePauseResume = useCallback(() => {
    if (voiceModeState.paused) {
      resumeVoiceMode({
        voiceModeActiveRef,
        pausedRef,
        setVoiceModeState: (state) => setVoiceModeState(prev => ({ ...prev, ...state })),
        handleSpeak,
        languageValue,
        isMuted: voiceModeState.muted,
        currentField: voiceModeState.currentField
      });
    } else {
      pauseVoiceMode({
        voiceModeActiveRef,
        pausedRef,
        mediaRecorderRef,
        setVoiceModeState: (state) => setVoiceModeState(prev => ({ ...prev, ...state })),
        handleSpeak,
        languageValue,
        isMuted: voiceModeState.muted
      });
    }
  }, [voiceModeState.paused, voiceModeState.muted, voiceModeState.currentField, languageValue, handleSpeak])

  // Handle content reading for different sections
  const handleReadContent = useCallback((content: string, type: 'trends' | 'lifestyle' | 'diet' | 'doctor' | 'map') => {
    if (!voiceModeState.active || voiceModeState.paused) return

    // Get the actual content from the page
    let contentToRead = '';
    
    switch (type) {
      case 'trends':
        contentToRead = document.querySelector('[data-content="trends"]')?.textContent || 
                       (languageValue === "sw" 
                        ? "Mabadiliko ya kiafya yanaonyesha shinikizo lako la damu limeongezeka kiasi cha asilimia ishirini katika mwezi uliopita. Inashauriwa upimwe tena baada ya wiki mbili." 
                        : "Health trends show your blood pressure has increased by about twenty percent over the past month. It's recommended to measure again after two weeks.");
        break;
      case 'lifestyle':
        contentToRead = document.querySelector('[data-content="lifestyle"]')?.textContent || 
                       (languageValue === "sw" 
                        ? "Mapendekezo ya maisha: Zungumza kwa kina, tumia mbinu za kupunguza msongo, fanya mazoezi ya kupumzika kila siku, pumzika vizuri usiku." 
                        : "Lifestyle recommendations: Practice deep breathing, use stress reduction techniques, do relaxation exercises daily, get good night sleep.");
        break;
      case 'diet':
        contentToRead = document.querySelector('[data-content="diet"]')?.textContent || 
                       (languageValue === "sw" 
                        ? "Mapendekezo ya chakula: Punguza chumvi, ongeza matunda na mboga, epuka vyakula vyenye mafuta mengi, nywa maji ya kutosha." 
                        : "Diet recommendations: Reduce salt intake, increase fruits and vegetables, avoid fatty foods, drink plenty of water.");
        break;
      case 'doctor':
        contentToRead = document.querySelector('[data-content="doctor"]')?.textContent || 
                       (languageValue === "sw" 
                        ? "Taarifa ya daktari: Daktari wako ana pendekeza ufanyie vipimo vya damu kila wiki na uende kliniki baada ya miezi miwili. Nambari ya daktari: 0712345678." 
                        : "Doctor information: Your doctor recommends weekly blood tests and a clinic visit after two months. Doctor's number: 0712345678.");
        break;
      case 'map':
        contentToRead = document.querySelector('[data-content="map"]')?.textContent || 
                       (languageValue === "sw" 
                        ? "Ramani inaonyesha hospitali ya wilaya iko kilometa tano kutoka hapa, na klinik tatu ziko katika eneo lako. Kituo cha karibu ni klinik ya Aga Khan." 
                        : "The map shows the district hospital is five kilometers away, with three clinics in your area. The nearest facility is Aga Khan Clinic.");
        break;
    }
    
    handleSpeak(contentToRead);
  }, [voiceModeState.active, voiceModeState.paused, languageValue, handleSpeak])

  // Mock form functions for voice mode integration
  const mockSetValue = (name: string, value: any, options?: any) => {
    switch (name) {
      case 'systolic':
        setSystolic(value.toString())
        break
      case 'diastolic':
        setDiastolic(value.toString())
        break
      case 'heartRate':
        setHeartRate(value.toString())
        break
      case 'activityType':
        setActivityType(value)
        break
      case 'duration':
        setDuration(value.toString())
        break
      case 'intensity':
        setIntensity(value)
        break
      case 'timeSinceActivity':
        setTimeSinceActivity(value.toString())
        break
      default:
        break
    }
  }

  const mockGetValues = () => ({
    systolic,
    diastolic,
    heartRate,
    activityType,
    duration,
    intensity,
    timeSinceActivity,
    notes
  })

  // Start voice mode
  const handleStartVoiceMode = async () => {
    await startVoiceMode({
      languageValue,
      currentLanguage,
      voiceModeActiveRef,
      pausedRef,
      voiceModeState,
      setVoiceModeState: (state) => setVoiceModeState(prev => ({ ...prev, ...state })),
      setValue: mockSetValue,
      getValues: mockGetValues,
      toast,
      handleSpeak,
      isProcessingRef,
      mediaRecorderRef,
      API_URL,
      fieldRefs
    });
  }

  // Stop voice mode
  const handleStopVoiceMode = () => {
    stopVoiceMode({
      voiceModeActiveRef,
      pausedRef,
      mediaRecorderRef,
      currentLanguage,
      setVoiceModeState: (state) => setVoiceModeState(prev => ({ ...prev, ...state })),
      handleSpeak,
      isMuted: voiceModeState.muted
    });
  }

  // Toggle mute
  const handleToggleMute = () => {
    setVoiceModeState(prev => ({ ...prev, muted: !prev.muted }))
  }

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
      setMessage(t.vitals.allFieldsRequired)
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
      setMessage(t.language === "en-US" 
        ? "Please enter realistic vital values."
        : "Tafadhali weka maadili halali ya vitali.")
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

      // Call AI analysis with language parameter
      const languageParam = t.language === "sw-TZ" ? "sw-TZ" : "en-US"
      const aiResp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hypertensionVitals/analyze?language=${languageParam}`,
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
      setMessage(t.language === "en-US" 
        ? "✅ Vitals saved & analyzed successfully!"
        : "✅ Vitali zimehifadhiwa na kuchambuliwa kwa mafanikio!")
      if (onAfterSave) onAfterSave()
      reset()
    } catch (e: any) {
      setMessage(e.message || (t.language === "en-US" 
        ? "❌ There was an error. Please try again."
        : "❌ Kulikuwa na hitilafu. Tafadhali jaribu tena."))
      setAnalysis(null)
    } finally {
      setSaving(false)
    }
  }

  const handleVoiceFormComplete = (data: {
    systolic: number
    diastolic: number
    heartRate: number
    activityType?: string
    duration?: number
    intensity?: string
    timeSinceActivity?: number
  }) => {
    setSystolic(data.systolic.toString())
    setDiastolic(data.diastolic.toString())
    setHeartRate(data.heartRate.toString())
    if (data.activityType) {
      setActivityType(data.activityType)
    }
    if (typeof data.duration === "number") {
      setDuration(data.duration ? data.duration.toString() : "")
    }
    if (data.intensity && ["light", "moderate", "vigorous"].includes(data.intensity)) {
      setIntensity(data.intensity)
    }
    if (typeof data.timeSinceActivity === "number") {
      setTimeSinceActivity(data.timeSinceActivity ? data.timeSinceActivity.toString() : "")
    }
    setShowVoiceForm(false)
    
    // Continue with the form, user still needs to fill activity details
    setMessage(t.language === "en-US" 
      ? "✅ Vital values captured! Please complete the activity details below."
      : "✅ Maadili ya vitali yamepokelekwa! Tafadhali kamili maelezo ya shughuli chini.")
  }

  return (
    <>
      {/* Voice Modal */}
      {showVoiceForm && (
        <InteractiveVoiceForm
          language={t.language === "sw-TZ" ? "sw" : "en"}
          onComplete={handleVoiceFormComplete}
          onCancel={() => setShowVoiceForm(false)}
          mode="full"
        />
      )}

      <div className="shadow-lg bg-white w-full max-w-4xl rounded-lg px-6 py-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 p-2 rounded-lg shadow-sm">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            {t.vitals.title}
          </h3>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {t.language === "en-US" 
                ? "Enter your blood pressure, heart rate, and recent activity — see AI-guided feedback instantly after saving. Use voice mode for hands-free entry."
                : "Weka shinikizo la damu, kiwango cha moyo, na shughuli za hivi karibuni — ona maoni ya AI mara tu baada ya kuhifadhi. Tumia hali ya sauti kwa kuingiza bila mikono."
              }
            </p>
          </div>
        </div>

        {/* Enhanced Voice Control Panel */}
        <VoiceControlPanel
          voiceModeState={voiceModeState}
          currentLanguage={currentLanguage}
          languageValue={languageValue}
          onToggleMute={handleToggleMute}
          onToggleVoiceMode={voiceModeState.active ? handleStopVoiceMode : handleStartVoiceMode}
          onPauseResume={handlePauseResume}
          onReadContent={handleReadContent}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Systolic */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t.vitals.systolic}</label>
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
                {voiceModeState.active && !voiceModeState.paused && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSpeak(languageValue === "sw" 
                        ? `Thamani ya systolic ni ${systolic || 'haijawekwa'} mmHg.` 
                        : `Systolic value is ${systolic || 'not set'} mmHg.`)
                    }}
                    className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {t.language === "en-US" ? "Upper number" : "Nambari ya juu"}
              </p>
            </div>

            {/* Diastolic */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t.vitals.diastolic}</label>
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
                {voiceModeState.active && !voiceModeState.paused && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSpeak(languageValue === "sw" 
                        ? `Thamani ya diastolic ni ${diastolic || 'haijawekwa'} mmHg.` 
                        : `Diastolic value is ${diastolic || 'not set'} mmHg.`)
                    }}
                    className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {t.language === "en-US" ? "Lower number" : "Nambari ya chini"}
              </p>
            </div>

            {/* Heart Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t.vitals.heartRate}</label>
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
                {voiceModeState.active && !voiceModeState.paused && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSpeak(languageValue === "sw" 
                        ? `Kiwango cha mapigo ya moyo ni ${heartRate || 'hakijajazwa'} kwa dakika.` 
                        : `Heart rate is ${heartRate || 'not set'} beats per minute.`)
                    }}
                    className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {t.language === "en-US" ? "Beats/min" : "Mipigo/dakika"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4" />
                {t.language === "en-US" ? "Recent Activity Type" : "Aina ya Shughuli ya Hivi Karibuni"}
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {activityOptions.map((opt) => (
                  <option value={opt.value} key={opt.value}>
                    {t.language === "en-US" ? opt.label : 
                      opt.value === "none" ? "Hakuna shughuli ya hivi karibuni" :
                      opt.value === "exercise" ? "Zoezi/Mazoezi" :
                      opt.value === "walking" ? "Kutembea" :
                      opt.value === "eating" ? "Kula/Chakula" :
                      opt.value === "stress" ? "Mkazo/Wasiwasi" :
                      opt.value === "sleep_deprivation" ? "Upungufu wa Usingizi" :
                      opt.value === "caffeine" ? "Kunywa Kahawa" :
                      opt.value === "medication" ? "Dawa ya Hivi Karibuni" :
                      opt.value === "illness" ? "Ugonjwa/Homa" :
                      "Nyingine"
                    }
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t.language === "en-US" ? "Duration (minutes)" : "Muda (dakika)"}
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
                {t.language === "en-US" ? "Intensity" : "Ukali"}
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
                    {t.language === "en-US" 
                      ? level.charAt(0).toUpperCase() + level.slice(1)
                      : level === "light" ? "Nyepesi" :
                        level === "moderate" ? "Wastani" :
                        "Kali"
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Time Since Activity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t.language === "en-US" ? "How long ago? (minutes)" : "Muda uliopita? (dakika)"}
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
                {t.language === "en-US" ? "Notes (optional)" : "Maelezo (hiari)"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
                rows={2}
                placeholder={t.language === "en-US" 
                  ? "E.g., Just finished a walk, or feeling stressed out this morning..."
                  : "Mf., Nimeimaliza matembezi, au nahisi mkazo asubuhi hii..."
                }
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
                {t.language === "en-US" ? "Saving..." : "Inahifadhi..."}
              </div>
            ) : (
              t.vitals.saveButton
            )}
          </button>
        </form>

        {analysis && lastAnalyzedVitals && (
          <div className="mt-6">
            <ContextAwareAlert analysis={analysis} vitals={lastAnalyzedVitals} />
          </div>
        )}
      </div>
    </>
  )
}