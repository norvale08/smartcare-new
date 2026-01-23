"use client"
import { Activity, HeartPulse, Heart, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"
import { useTranslation } from "../../../lib/hypertension/useTranslation"

export type AlertSeverity = "green" | "yellow" | "red"

export interface ContextAnalysis {
  severity: AlertSeverity
  title: string
  description: string
  recommendation: string
  activityInfluence: string
  shouldNotifyDoctor: boolean
  confidence: number // 0-100
}

interface SidebarAlertProps {
  analysis: ContextAnalysis
  vitals: {
    systolic: number
    diastolic: number
    heartRate: number
  }
}

export default function SidebarAlert({ analysis, vitals }: SidebarAlertProps) {
  const { t, language } = useTranslation();

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case "green":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          border: "border-emerald-200 dark:border-emerald-800",
          iconBg: "bg-emerald-100 dark:bg-emerald-900",
          icon: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          title: "text-emerald-900 dark:text-emerald-100",
          text: "text-emerald-800 dark:text-emerald-200",
          badge: "bg-emerald-500 text-white",
        }
      case "yellow":
        return {
          bg: "bg-cyan-50 dark:bg-cyan-950/30",
          border: "border-cyan-200 dark:border-cyan-800",
          iconBg: "bg-cyan-100 dark:bg-cyan-900",
          icon: <AlertTriangle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
          title: "text-cyan-900 dark:text-cyan-100",
          text: "text-cyan-800 dark:text-cyan-200",
          badge: "bg-cyan-500 text-white",
        }
      case "red":
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-200 dark:border-blue-800",
          iconBg: "bg-blue-100 dark:bg-blue-900",
          icon: <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          title: "text-blue-900 dark:text-blue-100",
          text: "text-blue-800 dark:text-blue-200",
          badge: "bg-blue-500 text-white",
        }
    }
  }

  const styles = getSeverityStyles(analysis.severity)

  return (
    <div className={`w-full border ${styles.border} ${styles.bg} rounded-lg p-3 shadow-sm`}>
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded-md ${styles.iconBg}`}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-semibold ${styles.title} truncate`}>
              {analysis.title}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles.badge}`}>
              {analysis.confidence}%
            </span>
          </div>
          <p className={`text-xs ${styles.text} mb-2 line-clamp-2`}>
            {analysis.description}
          </p>

          {/* Compact vitals display */}
          <div className="flex items-center gap-3 text-xs mb-2">
            <div className="flex items-center gap-1">
              <HeartPulse className="w-3 h-3 text-blue-600" />
              <span className="font-medium">{vitals.systolic}/{vitals.diastolic} mmHg</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-emerald-600" />
              <span className="font-medium">{vitals.heartRate} bpm</span>
            </div>
          </div>

          {/* Compact recommendation */}
          <div className="bg-white/50 dark:bg-gray-900/50 rounded-md p-2 text-xs">
            <div className="flex items-start gap-1.5">
              <Info className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className={`leading-relaxed ${styles.text} line-clamp-2`}>
                {analysis.recommendation}
              </p>
            </div>
          </div>

          {/* Doctor notification indicator */}
          {analysis.shouldNotifyDoctor && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <AlertCircle className="w-3 h-3 text-red-600" />
              <span className="text-red-700 dark:text-red-300 font-medium">
                {language === "sw-TZ" ? "Daktari atataarifiwa" : "Doctor will be notified"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}