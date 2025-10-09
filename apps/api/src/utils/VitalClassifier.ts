// utils/VitalClassifier.ts

export interface PatientFactors {
    age?: number;
    gender?: string;
    conditions?: {
        diabetes?: boolean;
        hypertension?: boolean;
    };
    context?: string; // e.g., "Fasting", "Post-meal"
}

/**
 * Classify vital signs (heart rate, blood pressure, glucose, BMI)
 * as "normal" or "abnormal" using rule-based medical thresholds.
 */
export async function classifyVital(
    vital: string,
    value: any,
    patient: PatientFactors
): Promise<"normal" | "abnormal"> {
    try {
        const { age = 30, gender = "male", conditions, context } = patient;
        const numValue = typeof value === "number" ? value : parseFloat(value);

        // Helper: categorize age group
        const ageGroup =
            age <= 12
                ? "child"
                : age <= 17
                    ? "teen"
                    : age <= 64
                        ? "adult"
                        : "elderly";

        switch (vital.toLowerCase()) {
            /**
             * HEART RATE
             * Normal ranges vary by age and slightly by gender.
             */
            case "heartrate": {
                let lower = 0;
                let upper = 0;

                if (ageGroup === "child") {
                    lower = 70;
                    upper = 110;
                } else if (ageGroup === "teen") {
                    lower = 60;
                    upper = 100;
                } else if (ageGroup === "adult") {
                    lower = gender === "female" ? 60 : 55;
                    upper = gender === "female" ? 100 : 95;
                } else if (ageGroup === "elderly") {
                    lower = 50;
                    upper = 100;
                }


                if (numValue >= lower && numValue <= upper) return "normal";
                return "abnormal";
            }

            /**
             * BLOOD PRESSURE
             * Normal: <120 / <80
             * Elevated: 120–129 / <80
             * Hypertension Stage 1: 130–139 / 80–89
             * Hypertension Stage 2: ≥140 / ≥90
             */
            case "bloodpressure": {
                if (typeof value !== "string") return "abnormal";
                const [systolicStr, diastolicStr] = value.split("/");
                const systolic = parseInt(systolicStr);
                const diastolic = parseInt(diastolicStr);
                if (isNaN(systolic) || isNaN(diastolic)) return "abnormal";

                let sysUpper = 120;
                let diaUpper = 80;

                if (ageGroup === "child") {
                    sysUpper = 110;
                    diaUpper = 70;
                } else if (ageGroup === "teen") {
                    sysUpper = 120;
                    diaUpper = 80;
                } else if (ageGroup === "elderly") {
                    sysUpper = 130;
                    diaUpper = 85;
                }

                if (systolic < sysUpper && diastolic < diaUpper) return "normal";
                return "abnormal";
            }

            /**
             * GLUCOSE
             * Depends on context (Fasting, Post-meal, Random) and diabetic condition
             * Fasting: 70–99 mg/dL normal
             * Post-meal: <140 mg/dL normal
             * Random: 70–140 mg/dL normal
             */
            case "glucose": {
                const ctx = context?.toLowerCase() || "random";
                const diabetic = conditions?.diabetes === true;

                // Slightly higher thresholds if patient has diabetes
                const adjust = diabetic ? 20 : 0;

                if (ctx === "fasting") {
                    if (numValue >= 70 && numValue <= 99 + adjust) return "normal";
                } else if (ctx === "post-meal") {
                    if (numValue < 140 + adjust) return "normal";
                } else if (ctx === "random") {
                    if (numValue >= 70 && numValue <= 140 + adjust) return "normal";
                }
                return "abnormal";
            }

            /**
             * BMI
             * Normal: 18.5–24.9
             * Underweight: <18.5, Overweight: 25–29.9, Obese: ≥30
             */
            case "bmi": {
                let lower = 18.5;
                let upper = 24.9;

                if (ageGroup === "child") {
                    // Use general healthy percentile proxy
                    lower = 14;
                    upper = 18;
                } else if (ageGroup === "teen") {
                    lower = 17;
                    upper = 24;
                } else if (ageGroup === "elderly") {
                    // Slightly higher healthy range for older adults
                    lower = 22;
                    upper = 27;
                }

                // Slight gender adjustment
                if (gender === "female") upper += 0.5;

                if (numValue >= lower && numValue <= upper) return "normal";
                return "abnormal";
            }

            default:
                return "normal";
        }
    } catch (err) {
        console.error("Rule-based classification error:", err);
        return "normal";
    }
}
