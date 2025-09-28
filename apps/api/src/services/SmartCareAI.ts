import ollama from "ollama";

export interface GlucoseData {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  language?: "en" | "sw";
}

export interface LifestyleData {
  alcohol?: string;
  smoking?: string;
  exercise?: string;
  sleep?: string;
}

export interface LifestyleAIInput extends GlucoseData {
  lifestyle: LifestyleData;
}

export class SmartCareAI {
  private model = process.env.OLLAMA_MODEL || "llama3.2:3b";

  // ✅ Summarize glucose reading
  async generateSummary(data: GlucoseData): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant.
        Summarize the patient's glucose reading in 1–2 sentences max.
        If language is "sw", respond in Kiswahili. Otherwise, use English.

        Data: ${JSON.stringify(data)}
      `;

      let content = "";
      const stream = await ollama.chat({ 
        model: this.model, 
        messages: [{ role: "user", content: prompt }], 
        stream: true 
      });

      for await (const token of stream) {
        const text = token.message?.content || "";
        content += text;
        // Remove this line: process.stdout.write(text);
      }

      return content.trim() || "⚠️ No summary available.";
    } catch (err) {
      console.error("AI error (summary):", err);
      return "❌ Could not generate summary.";
    }
  }

  // ✅ Provide glucose feedback
  async generateGlucoseFeedback(data: GlucoseData): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant.
        Provide a short health interpretation of this glucose reading.
        Mention whether it is normal, high, or low, and give a brief recommendation.
        Respond in Kiswahili if language is "sw", otherwise use English.

        Data: ${JSON.stringify(data)}
      `;

      let content = "";
      const stream = await ollama.chat({ 
        model: this.model, 
        messages: [{ role: "user", content: prompt }], 
        stream: true 
      });

      for await (const token of stream) {
        const text = token.message?.content || "";
        content += text;
        // Remove this line: process.stdout.write(text);
      }

      return content.trim() || "⚠️ No feedback available.";
    } catch (err) {
      console.error("AI error (feedback):", err);
      return "❌ Could not generate AI feedback.";
    }
  }

  // ✅ Lifestyle-based AI advice  
  async generateLifestyleFeedback(data: LifestyleAIInput): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant specializing in diabetes care.
        
        Patient Information:
        - Current glucose: ${data.glucose} mg/dL (${data.context})
        - Alcohol consumption: ${data.lifestyle.alcohol}
        - Smoking habit: ${data.lifestyle.smoking}
        - Exercise frequency: ${data.lifestyle.exercise}
        - Sleep pattern: ${data.lifestyle.sleep}
        
        Provide personalized lifestyle advice in 3-4 sentences that:
        1. Comments on their current glucose level
        2. Addresses their specific lifestyle factors
        3. Gives actionable recommendations for improvement
        4. Mentions any concerning patterns
        
        ${data.language === "sw" ? "Respond in Kiswahili." : "Respond in English."}
        
        Keep the tone supportive and encouraging while being medically accurate.
      `;

      let content = "";
      const stream = await ollama.chat({ 
        model: this.model, 
        messages: [{ role: "user", content: prompt }], 
        stream: true 
      });

      for await (const token of stream) {
        const text = token.message?.content || "";
        content += text;
        
      }

      return content.trim() || "⚠️ No lifestyle advice available.";
    } catch (err) {
      console.error("AI error (lifestyle advice):", err);
      return "❌ Could not generate lifestyle AI advice.";
    }
  }
}