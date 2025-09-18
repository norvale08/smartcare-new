// apps/api/src/services/SmartCareAi.ts
import ollama from "ollama";

export interface PatientData {
  name: string;
  age: number;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  symptoms: string[];
  conditions: string[];
  language: "en" | "sw";
}

export interface GlucoseData {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  language: "en" | "sw";
}

export interface MedicationData {
  medications: string[];
  patientAge?: number;
  conditions?: string[];
  language?: "en" | "sw";
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "Low" | "Medium" | "High";
  warning: string;
  recommendation: string;
}

export interface MedicationAnalysis {
  interactions: DrugInteraction[];
  generalRecommendations: string;
  safetyNotes: string;
}

export class SmartCareAI {
  private model: string;

  constructor(model = "llama3.2:3b") {
    this.model = model;
  }

  async generateGlucoseFeedback(data: GlucoseData): Promise<string> {
    try {
      const { glucose, context, language } = data;
      const ranges = {
        Fasting: { normal: "70-100", prediabetic: "100-125", diabetic: "≥126" },
        "Post-meal": { normal: "<140", prediabetic: "140-199", diabetic: "≥200" },
        Random: { normal: "<140", prediabetic: "140-199", diabetic: "≥200" },
      } as const;

      const currentRange = ranges[context];

      const prompt = [
        `You are a friendly healthcare AI assistant specializing in diabetes management.`,
        language === "sw"
          ? `Please answer in Swahili. Use plain language suitable for Kenya.`
          : `Please answer in English.`,
        "",
        `Blood glucose reading: ${glucose} mg/dL`,
        `Context: ${context}`,
        `Normal range for ${context}: ${currentRange.normal} mg/dL`,
        `Pre-diabetic range: ${currentRange.prediabetic} mg/dL`,
        `Diabetic range: ${currentRange.diabetic} mg/dL`,
        "",
        `Please provide:`,
        `1. Assessment (normal, elevated, concerning)`,
        `2. What it means`,
        `3. Practical, plain-language recommendations (food, activity, monitoring)`,
        `4. When to seek medical attention`,
        `Keep it short, supportive, and avoid medical jargon.`,
      ].join("\n");

      const resp = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      });

      return (resp.message?.content ?? "").trim();
    } catch (err: any) {
      console.error("generateGlucoseFeedback error:", err?.message ?? err);
      return "Unable to generate glucose feedback at the moment.";
    }
  }

  /**
   * Analyze medications using Ollama and return structured JSON.
   * This asks the model to output JSON and then attempts to parse it.
   */
  async analyzeMedications(input: MedicationData): Promise<MedicationAnalysis> {
    const { medications, patientAge, conditions, language = "en" } = input;

    const medsList = medications.join(", ");
    const prompt = [
      `You are a clinical pharmacist assistant. Analyze the following medications for clinically significant interactions and safety notes.`,
      language === "sw"
        ? `Tafadhali jibu kwa Kiswahili kwa maneno rahisi yaliyotumika Kenya.`
        : `Please answer in English.`,
      "",
      `PATIENT MEDICATIONS: ${medsList}`,
      patientAge ? `Patient age: ${patientAge} years` : "",
      conditions && conditions.length ? `Medical conditions: ${conditions.join(", ")}` : "",
      "",
      `Return ONLY valid JSON with this exact structure:`,
      `{"interactions":[{"drug1":"...","drug2":"...","severity":"Low|Medium|High","warning":"...","recommendation":"..."}],"generalRecommendations":"...","safetyNotes":"..."}`,
      "",
      `If no interactions found, return an empty array for interactions.`,
      `Be conservative and always recommend consulting the patient's healthcare provider for confirmation.`,
    ].join("\n");

    try {
      const resp = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      });

      const text = resp.message?.content ?? "";
      // extract the first JSON object in the output
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          // Basic validation / fallback
          return {
            interactions: Array.isArray(parsed.interactions) ? parsed.interactions : [],
            generalRecommendations: parsed.generalRecommendations ?? text,
            safetyNotes: parsed.safetyNotes ?? "",
          } as MedicationAnalysis;
        } catch (parseErr) {
          console.warn("analyzeMedications: JSON parse failed:", parseErr);
          return {
            interactions: [],
            generalRecommendations: text,
            safetyNotes: "Parsing failed — consult a pharmacist.",
          };
        }
      } else {
        // No JSON found — return the raw text as generalRecommendations
        return {
          interactions: [],
          generalRecommendations: text,
          safetyNotes: "No structured JSON returned by model.",
        };
      }
    } catch (err: any) {
      console.error("analyzeMedications error:", err?.message ?? err);
      return {
        interactions: [],
        generalRecommendations: "Unable to analyze medications at this time.",
        safetyNotes: "Please consult your healthcare provider.",
      };
    }
  }

  async generateMedicationReminders(medications: string[], language: "en" | "sw" = "en"): Promise<string> {
    try {
      const prompt = [
        language === "sw" ? "Toa mwongozo mfupi kwa Kiswahili." : "Give short medication reminders in English.",
        `Medications: ${medications.join(", ")}`,
        "Include best times, with/without food, and simple adherence tips.",
      ].join("\n");

      const resp = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      });

      return (resp.message?.content ?? "").trim();
    } catch (err: any) {
      console.error("generateMedicationReminders error:", err?.message ?? err);
      return "Unable to generate reminders at the moment.";
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const resp = await ollama.list();
      return Array.isArray((resp as any).models);
    } catch (err) {
      console.warn("Ollama connection check failed:", err);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const resp = await ollama.list();
      return ((resp as any).models ?? []).map((m: any) => m.name);
    } catch (err) {
      return [];
    }
  }
}
