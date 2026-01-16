"use client"
import { Activity, HeartPulse, Heart, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"
import { useTranslation } from "../../../lib/hypertension/useTranslation"

// Stand-in UI components for dev/testing (replace with real UI lib if you have it)
const Card = (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} style={{border: '1px solid #eee', borderRadius: '8px', padding: 16, margin: 8, ...props.style}}/>;
const CardContent = (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props}/>;
const CardHeader = (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props}/>;
const CardTitle = (props: React.HTMLAttributes<HTMLDivElement>) => <h3 {...props}/>;
const CardDescription = (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} style={{color: '#888'}}/>;

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

interface ContextAwareAlertProps {
  analysis: ContextAnalysis
  vitals: {
    systolic: number
    diastolic: number
    heartRate: number
  }
}

export default function ContextAwareAlert({ analysis, vitals }: ContextAwareAlertProps) {
  const { t, language } = useTranslation();
  
  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case "green":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          border: "border-emerald-200 dark:border-emerald-800",
          iconBg: "bg-emerald-100 dark:bg-emerald-900",
          icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          title: "text-emerald-900 dark:text-emerald-100",
          text: "text-emerald-800 dark:text-emerald-200",
          badge: "bg-emerald-500 text-white",
        }
      case "yellow":
        return {
          bg: "bg-cyan-50 dark:bg-cyan-950/30",
          border: "border-cyan-200 dark:border-cyan-800",
          iconBg: "bg-cyan-100 dark:bg-cyan-900",
          icon: <AlertTriangle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
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
          icon: <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          title: "text-blue-900 dark:text-blue-100",
          text: "text-blue-800 dark:text-blue-200",
          badge: "bg-blue-500 text-white",
        }
    }
  }

  // Determine vitals status indicators
  const getSystolicStatus = () => {
    if (vitals.systolic >= 180) return { color: "text-red-600", status: "Critical" };
    if (vitals.systolic >= 140) return { color: "text-orange-600", status: "High" };
    if (vitals.systolic >= 130) return { color: "text-yellow-600", status: "Elevated" };
    if (vitals.systolic >= 120) return { color: "text-cyan-600", status: "Borderline" };
    return { color: "text-emerald-600", status: "Normal" };
  };

  const getDiastolicStatus = () => {
    if (vitals.diastolic >= 120) return { color: "text-red-600", status: "Critical" };
    if (vitals.diastolic >= 90) return { color: "text-orange-600", status: "High" };
    if (vitals.diastolic >= 80) return { color: "text-yellow-600", status: "Elevated" };
    return { color: "text-emerald-600", status: "Normal" };
  };

  const getHeartRateStatus = () => {
    if (vitals.heartRate < 60) return { color: "text-blue-600", status: "Low" };
    if (vitals.heartRate > 100) return { color: "text-orange-600", status: "High" };
    return { color: "text-emerald-600", status: "Normal" };
  };

  const systolicStatus = getSystolicStatus();
  const diastolicStatus = getDiastolicStatus();
  const heartRateStatus = getHeartRateStatus();

  const styles = getSeverityStyles(analysis.severity)

  return (
    <Card data-content="context-alert" className={`w-full max-w-2xl border-2 ${styles.border} ${styles.bg} shadow-lg`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className={`text-lg font-bold ${styles.title}`}>
                {analysis.title}
              </CardTitle>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles.badge}`}>
                {analysis.confidence}% Confidence
              </span>
            </div>
            <CardDescription className={`${styles.text} text-sm leading-relaxed`}>
              {analysis.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enhanced Vitals Display */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <HeartPulse className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              {language === "sw-TZ" ? "Vitali za Sasa" : "Current Vitals"}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Systolic */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language === "sw-TZ" ? "Sistolic" : "Systolic"}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${systolicStatus.color.replace('text-', 'bg-').replace('-600', '-100')} ${systolicStatus.color}`}>
                  {systolicStatus.status}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vitals.systolic}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">mmHg</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {language === "sw-TZ" ? "Shinikizo la juu la damu" : "Upper blood pressure"}
              </div>
            </div>

            {/* Diastolic */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-md">
                    <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language === "sw-TZ" ? "Diastolic" : "Diastolic"}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${diastolicStatus.color.replace('text-', 'bg-').replace('-600', '-100')} ${diastolicStatus.color}`}>
                  {diastolicStatus.status}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vitals.diastolic}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">mmHg</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {language === "sw-TZ" ? "Shinikizo la chini la damu" : "Lower blood pressure"}
              </div>
            </div>

            {/* Heart Rate */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                    <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language === "sw-TZ" ? "Kasi ya Moyo" : "Heart Rate"}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${heartRateStatus.color.replace('text-', 'bg-').replace('-600', '-100')} ${heartRateStatus.color}`}>
                  {heartRateStatus.status}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vitals.heartRate}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">bpm</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {language === "sw-TZ" ? "Mipigo kwa dakika" : "Beats per minute"}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Influence - Enhanced */}
        <div className={`rounded-xl p-4 border ${styles.border} bg-white dark:bg-gray-900`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
              <Activity className="w-5 h-5" style={{ 
                color: analysis.severity === 'green' ? '#059669' : 
                       analysis.severity === 'yellow' ? '#0891b2' : 
                       '#3b82f6' 
              }} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                {language === "sw-TZ" ? "Athari ya Shughuli" : "Activity Influence"}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === "sw-TZ" 
                  ? "Jinsi shughuli za hivi karibuni zinavyoathiri usomaji wako"
                  : "How recent activities affect your reading"}
              </p>
            </div>
          </div>
          <div className={`text-sm leading-relaxed pl-11 ${styles.text}`}>
            {analysis.activityInfluence}
          </div>
        </div>

        {/* Recommendation - Enhanced */}
        <div className="rounded-xl p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  {language === "sw-TZ" ? "Mapendekezo ya Kitaalamu" : "Professional Recommendations"}
                </h4>
                <span className="text-xs font-semibold px-2 py-1 bg-blue-500 text-white rounded-full">
                  AI-Powered
                </span>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg">
                {analysis.recommendation}
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Notification Status - Enhanced */}
        {analysis.shouldNotifyDoctor && (
          <div className="rounded-xl p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100">
                    {language === "sw-TZ" ? "Taarifa Muhimu" : "Important Notification"}
                  </h4>
                  <span className="text-xs font-semibold px-2 py-1 bg-red-500 text-white rounded-full">
                    {language === "sw-TZ" ? "Ya Haraka" : "Urgent"}
                  </span>
                </div>
                <p className="text-sm text-red-800 dark:text-red-200">
                  ⚠️ {language === "sw-TZ" 
                    ? "Daktari wako atapokea taarifa hii kwa uhakika. Usomaji wako unahitaji umakini wa ziada." 
                    : "Your doctor will be automatically notified about this reading. Your vitals require additional attention."}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}