"use client"
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react"
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
          bg: "bg-green-50 dark:bg-green-950",
          border: "border-green-200 dark:border-green-800",
          icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
          title: "text-green-900 dark:text-green-100",
          text: "text-green-800 dark:text-green-200",
        }
      case "yellow":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950",
          border: "border-yellow-200 dark:border-yellow-800",
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
          title: "text-yellow-900 dark:text-yellow-100",
          text: "text-yellow-800 dark:text-yellow-200",
        }
      case "red":
        return {
          bg: "bg-red-50 dark:bg-red-950",
          border: "border-red-200 dark:border-red-800",
          icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
          title: "text-red-900 dark:text-red-100",
          text: "text-red-800 dark:text-red-200",
        }
    }
  }

  const styles = getSeverityStyles(analysis.severity)

  return (
    <Card data-content="context-alert" className={`w-full max-w-2xl border-2 ${styles.border} ${styles.bg}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {styles.icon}
          <div className="flex-1">
            <CardTitle className={styles.title}>{analysis.title}</CardTitle>
            <CardDescription className={styles.text}>{analysis.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">Confidence</div>
            <div className="text-lg font-bold">{analysis.confidence}%</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vitals Display */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-background/50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{language === "sw-TZ" ? "Sistolic" : "Systolic"}</div>
            <div className="text-xl font-bold">{vitals.systolic}</div>
            <div className="text-xs text-muted-foreground">mmHg</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{language === "sw-TZ" ? "Diastolic" : "Diastolic"}</div>
            <div className="text-xl font-bold">{vitals.diastolic}</div>
            <div className="text-xs text-muted-foreground">mmHg</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{language === "sw-TZ" ? "Kasi ya Moyo" : "Heart Rate"}</div>
            <div className="text-xl font-bold">{vitals.heartRate}</div>
            <div className="text-xs text-muted-foreground">bpm</div>
          </div>
        </div>

        {/* Activity Influence */}
        <div className={`p-3 rounded-lg border ${styles.border} bg-background/50`}>
          <div className="text-sm font-semibold mb-1">
            {language === "sw-TZ" ? "Athari ya Shughuli" : "Activity Influence"}
          </div>
          <div className="text-sm">{analysis.activityInfluence}</div>
        </div>

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {language === "sw-TZ" ? "Mapendekezo" : "Recommendation"}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">{analysis.recommendation}</div>
            </div>
          </div>
        </div>

        {/* Doctor Notification Status */}
        {analysis.shouldNotifyDoctor && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <div className="text-sm font-semibold text-red-900 dark:text-red-100">
              ⚠️ {language === "sw-TZ" 
                ? "Daktari wako atataarifiwa kuhusu usomaji huu" 
                : "Your doctor will be notified about this reading"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
