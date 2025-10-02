// utils/aiVitalClassifier.ts
import ollama from "ollama";

export interface PatientFactors {
    age?: number;
    gender?: string;
    conditions?: {
        diabetes?: boolean;
        hypertension?: boolean;
    };
    context?: string;
}

// Helper: Ask llama3.2:3b if a vital is normal/abnormal considering patient factors
export async function classifyVital(
    vital: string,
    value: any,
    patient: PatientFactors
): Promise<"normal" | "abnormal"> {
    const prompt = `
You are a medical assistant. Classify whether the following vital sign is NORMAL or ABNORMAL. 
Consider the patient's demographics and medical conditions since normal ranges depend on these factors.

Patient Info:
- Age: ${patient.age ?? "Unknown"}
- Gender: ${patient.gender ?? "Unknown"}
- Conditions: ${JSON.stringify(patient.conditions ?? {})}
- Context: ${patient.context ?? "N/A"}

Vital:
- Name: ${vital}
- Value: ${value}

Respond with ONLY "normal" or "abnormal".
  `;

    try {
        const response = await ollama.chat({
            model: "llama3.2:3b",
            messages: [{ role: "user", content: prompt }],
        });

        const decision = response.message.content.trim().toLowerCase();
        return decision.includes("abnormal") ? "abnormal" : "normal";
    } catch (err) {
        console.error("AI classification error:", err);
        return "normal";
    }
}
