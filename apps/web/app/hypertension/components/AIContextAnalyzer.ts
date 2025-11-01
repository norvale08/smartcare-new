"use client"

import type { ContextAnalysis } from "./ContextAwareAlert"
import type { ActivityContext } from "./ActivityContextInput"
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * AI-Powered Context Analyzer
 * Determines if high BP is activity-related or clinically concerning
 * Uses pattern recognition and medical guidelines
 */

interface AnalysisInput {
  vitals: {
    systolic: number
    diastolic: number
    heartRate: number
  }
  activity: ActivityContext
  patientHistory?: {
    baselineSystolic?: number
    baselineDiastolic?: number
    age?: number
    hasHypertension?: boolean
  }
}

export async function analyzeContextWithAI(input: { vitals: any; activity: any }): Promise<ContextAnalysis> {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.post(
      `${API_URL}/api/hypertension/vitals/analyze`,
      input,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error analyzing context with AI:", error);
    // Return a default error response that matches the ContextAnalysis interface
    return {
      severity: "red",
      title: "Analysis Failed",
      description: "Could not get AI-powered analysis. Please check your connection or try again later.",
      recommendation: "Consult your doctor if you have any concerns about your vitals.",
      activityInfluence: "N/A",
      shouldNotifyDoctor: true,
      confidence: 0,
    };
  }
}

/**
 * Generate AI recommendation for doctor notification
 */
export function generateDoctorNotification(analysis: ContextAnalysis, vitals: any, activity: ActivityContext): string {
  return `
ALERT: Patient Hypertension Reading

Vitals: ${vitals.systolic}/${vitals.diastolic} mmHg, HR: ${vitals.heartRate} bpm
Severity: ${analysis.severity.toUpperCase()}
Confidence: ${analysis.confidence}%

Activity Context:
- Type: ${activity.activityType}
- Duration: ${activity.duration} minutes
- Intensity: ${activity.intensity}
- Time Since Activity: ${activity.timeSinceActivity} minutes ago

Analysis:
${analysis.activityInfluence}

Recommendation:
${analysis.recommendation}

Notes: ${activity.notes || "None"}
  `.trim()
}
