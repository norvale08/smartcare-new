// utils/RiskEvaluator.ts
export type RiskLevel = "low" | "high" | "critical";

function getBMIRisk(bmi: number): RiskLevel {
  if (bmi < 18.5) return "high"; // underweight
  if (bmi >= 18.5 && bmi <= 24.9) return "low";
  if (bmi >= 25 && bmi <= 29.9) return "high";
  return "critical"; // obese
}

function getGlucoseRisk(glucose: number, context?: string): RiskLevel {
  if (!glucose) return "low";

  // Different thresholds for context
  if (context === "Fasting") {
    if (glucose < 70) return "high"; // hypoglycemia
    if (glucose <= 125) return "low";
    if (glucose <= 180) return "high";
    return "critical";
  }

  if (context === "Post-meal") {
    if (glucose < 70) return "high";
    if (glucose <= 140) return "low";
    if (glucose <= 200) return "high";
    return "critical";
  }

  // Random glucose
  if (glucose <= 140) return "low";
  if (glucose <= 200) return "high";
  return "critical";
}

function getBloodPressureRisk(bp: string): RiskLevel {
  if (!bp) return "low";
  const [sys, dia] = bp.split("/").map(Number);
  if (!sys || !dia) return "low";

  if (sys < 90 || dia < 60) return "high"; // hypotension
  if (sys <= 120 && dia <= 80) return "low";
  if (sys <= 139 || dia <= 89) return "high";
  return "critical"; // hypertensive crisis
}

function getHeartRateRisk(hr: number, age?: number): RiskLevel {
  if (!hr) return "low";
  // general adult ranges
  if (hr < 50) return "high"; // bradycardia
  if (hr <= 100) return "low";
  if (hr <= 120) return "high";
  return "critical";
}

export async function evaluateRiskLevel(patient: any, vitals: any): Promise<RiskLevel> {
  try {
    const { bmi, glucose, bloodPressure, heartRate, context } = vitals;
    const { diabetes, hypertension, gender, dob } = patient;
    const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : undefined;

    const risks: RiskLevel[] = [];

    if (bmi) risks.push(getBMIRisk(bmi));
    if (glucose) risks.push(getGlucoseRisk(glucose, context));
    if (bloodPressure) risks.push(getBloodPressureRisk(bloodPressure));
    if (heartRate) risks.push(getHeartRateRisk(heartRate, age));

    // Condition-based bump in risk
    if (diabetes || hypertension) risks.push("high");
    if (age && age > 65) risks.push("high");
    if (age && age > 75) risks.push("critical");

    // Decide overall risk — pick the highest level among vitals
    if (risks.includes("critical")) return "critical";
    if (risks.includes("high")) return "high";
    return "low";
  } catch (err) {
    console.error("⚠️ Rule-based risk evaluation failed:", err);
    return "low";
  }
}
