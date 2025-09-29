// utils/aiRiskEvaluator.ts
import ollama from "ollama";

export type RiskLevel = "low" | "high" | "critical";

export async function evaluateRiskLevel(patient: any, vitals: any): Promise<RiskLevel> {
  const prompt = `
You are a medical risk evaluator AI. 
Given patient demographics, conditions, context, and vitals, classify their overall health risk as one of:
- "low"
- "high"
- "critical"

Respond with ONLY the risk level word, nothing else.

Patient info:
Name: ${patient.fullName}
Age: ${new Date().getFullYear() - new Date(patient.dob).getFullYear()}
Gender: ${patient.gender}
Conditions: Diabetes=${patient.diabetes}, Hypertension=${patient.hypertension}
Vitals: ${JSON.stringify(vitals, null, 2)}
`;

  try {
    const response = await ollama.chat({
      model: "llama3.2:3b", // ✅ using llama3.2 3B model
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.message.content.trim().toLowerCase();

    if (["low", "high", "critical"].includes(raw)) {
      return raw as RiskLevel;
    }

    // fallback parsing if AI replies with extra words
    if (raw.includes("critical")) return "critical";
    if (raw.includes("high")) return "high";
    return "low";
  } catch (err) {
    console.error("⚠️ LLaMA risk evaluation failed:", err);
    return "low"; // safe fallback
  }
}
