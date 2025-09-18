import ollama from "ollama";

// Define the shape of glucose data
export type GlucoseData = {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  language: "en" | "sw"; // English or Swahili
};

export class SmartCareAI {
  private model: string;

  constructor(model: string = "llama3.2") {
    this.model = model;
  }

  /**
   * Generate feedback for glucose readings.
   */
  async generateGlucoseFeedback(data: GlucoseData): Promise<string> {
    try {
      const { glucose, context, language } = data;

      const prompt =
        language === "en"
          ? `You are a medical assistant. Provide clear, empathetic, and simple feedback for a diabetes patient.
Glucose level: ${glucose} mg/dL
Context: ${context}

- If glucose is normal, reassure the patient.
- If glucose is high or low, warn them and give basic guidance (e.g., drink water, check diet, consult doctor).
- Keep the response short, simple, and encouraging.`
          : `Wewe ni msaidizi wa matibabu. Toa ushauri kwa lugha rahisi na yenye heshima kwa mgonjwa wa kisukari.
Kiwango cha sukari: ${glucose} mg/dL
Muktadha: ${context}

- Ikiwa sukari iko kawaida, mtie moyo mgonjwa.
- Ikiwa sukari iko juu au chini, toa onyo na mwongoze (mfano: kunywa maji, angalia chakula, wasiliana na daktari).
- Jibu liwe fupi na lenye kutia moyo.`;

      const response = await ollama.chat({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are SmartCareAI, a medical assistant for diabetes patients.",
          },
          { role: "user", content: prompt },
        ],
      });

      return response.message.content.trim();
    } catch (error: any) {
      console.error("❌ Error generating AI feedback:", error.message);
      return "Sorry, I could not generate feedback at the moment. Please consult your doctor if necessary.";
    }
  }

  /**
   * Check if Ollama is running and reachable.
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await ollama.list();
      return Array.isArray(response.models);
    } catch (error) {
      console.error("❌ Ollama connection failed:", (error as Error).message);
      return false;
    }
  }

  /**
   * Get list of available Ollama models.
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await ollama.list();
      return response.models.map((m: any) => m.name);
    } catch (error) {
      console.error("❌ Failed to fetch models:", (error as Error).message);
      return [];
    }
  }
}
