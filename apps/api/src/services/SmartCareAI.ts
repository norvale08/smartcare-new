import ollama from "ollama";

export interface GlucoseData {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  language?: "en" | "sw";
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
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

export interface VitalsData {
  glucose: number;
  context: "Fasting" | "Post-meal" | "Random";
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  language?: "en" | "sw";
}

export interface FoodAdviceInput extends VitalsData {
  lifestyle?: LifestyleData;
  medicalHistory?: string[];
  allergies?: string[];
}

export class SmartCareAI {
  private model = process.env.OLLAMA_MODEL || "llama3.2:3b";

  // ✅ Summarize glucose reading — includes age, weight, height, gender
  async generateSummary(data: GlucoseData): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant.
        Summarize the patient's glucose reading concisely (1–2 sentences).
        Include brief interpretation considering their age, weight, height, and gender if available.
        If language is "sw", respond in Kiswahili. Otherwise, use English.

        Patient Info:
        - Glucose: ${data.glucose} mg/dL (${data.context})
        - Age: ${data.age ?? "Not provided"}
        - Weight: ${data.weight ? data.weight + " kg" : "Not provided"}
        - Height: ${data.height ? data.height + " cm" : "Not provided"}
        - Gender: ${data.gender ?? "Not provided"}
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

      return content.trim() || "⚠️ No summary available.";
    } catch (err) {
      console.error("AI error (summary):", err);
      return "❌ Could not generate summary.";
    }
  }

  // ✅ Provide glucose feedback — considers demographics
  async generateGlucoseFeedback(data: GlucoseData): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant.
        Analyze the following glucose reading and provide a short interpretation (2–3 sentences).
        Consider the patient's age, weight, height, and gender for context.
        Mention whether it is normal, high, or low, and provide a practical recommendation.
        If language is "sw", respond in Kiswahili; otherwise, use English.

        Patient Info:
        - Glucose: ${data.glucose} mg/dL (${data.context})
        - Age: ${data.age ?? "Not provided"}
        - Weight: ${data.weight ? data.weight + " kg" : "Not provided"}
        - Height: ${data.height ? data.height + " cm" : "Not provided"}
        - Gender: ${data.gender ?? "Not provided"}
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

      return content.trim() || "⚠️ No feedback available.";
    } catch (err) {
      console.error("AI error (feedback):", err);
      return "❌ Could not generate AI feedback.";
    }
  }

  // ✅ Lifestyle-based AI advice — UPDATED to consider age, weight, height, gender
  async generateLifestyleFeedback(data: LifestyleAIInput): Promise<string> {
    try {
      const prompt = `
        You are a medical assistant specializing in diabetes and lifestyle management.

        Analyze the patient's glucose level and lifestyle habits while considering their 
        age, weight, height, and gender to provide personalized recommendations.

        Patient Information:
        - Glucose: ${data.glucose} mg/dL (${data.context})
        - Age: ${data.age ?? "Not provided"}
        - Weight: ${data.weight ? data.weight + " kg" : "Not provided"}
        - Height: ${data.height ? data.height + " cm" : "Not provided"}
        - Gender: ${data.gender ?? "Not provided"}

        Lifestyle Factors:
        - Alcohol: ${data.lifestyle.alcohol ?? "Not provided"}
        - Smoking: ${data.lifestyle.smoking ?? "Not provided"}
        - Exercise: ${data.lifestyle.exercise ?? "Not provided"}
        - Sleep: ${data.lifestyle.sleep ?? "Not provided"}

        Provide 3–4 sentences of personalized lifestyle feedback that:
        1. Interprets their glucose result
        2. Considers their age, weight, or gender
        3. Discusses how their habits may affect glucose control
        4. Ends with practical and encouraging advice.

        ${data.language === "sw" ? "Respond in Kiswahili." : "Respond in English."}
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

  // ✅ Kenyan food advice
  async generateKenyanFoodAdvice(data: FoodAdviceInput): Promise<string> {
    try {
      const bmi =
        data.weight && data.height
          ? (data.weight / Math.pow(data.height / 100, 2)).toFixed(1)
          : null;
      const bpStatus = data.bloodPressure
        ? data.bloodPressure.systolic >= 140 || data.bloodPressure.diastolic >= 90
          ? "High"
          : data.bloodPressure.systolic >= 120 || data.bloodPressure.diastolic >= 80
          ? "Elevated"
          : "Normal"
        : "Unknown";

      const prompt = `
        You are a Kenyan nutritionist specializing in diabetes management.

        Patient Vitals:
        - Glucose: ${data.glucose} mg/dL (${data.context})
        - Blood Pressure: ${
          data.bloodPressure
            ? `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic} (${bpStatus})`
            : "Not provided"
        }
        - Age: ${data.age ?? "Not provided"}
        - BMI: ${bmi ?? "Not calculated"}
        - Gender: ${data.gender ?? "Not provided"}

        Provide a Kenyan food plan that:
        1. Reflects their glucose and pressure status
        2. Suggests meals with portion guidance
        3. Uses Kenyan foods (ugali, sukuma wiki, githeri, ndengu)
        4. Mentions foods to avoid or limit
        5. Includes cooking methods (boiling, steaming preferred)

        ${data.language === "sw" ? "Respond in Kiswahili." : "Respond in English."}
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

      return content.trim() || "⚠️ No food advice available.";
    } catch (err) {
      console.error("AI error (food advice):", err);
      return "❌ Could not generate food advice.";
    }
  }

  // ✅ Quick Kenyan food tips
  async generateQuickFoodTips(data: {
    glucose: number;
    context: string;
    language?: string;
  }): Promise<string> {
    try {
      const prompt = `
        You are a Kenyan nutritionist.
        The patient has a glucose reading of ${data.glucose} mg/dL (${data.context}).

        Give 3–4 immediate Kenyan food recommendations:
        - If high: foods to avoid and eat now
        - If low: quick foods to raise sugar safely
        - If normal: foods to maintain stability

        Use local foods (ugali, sukuma wiki, githeri, fruits).
        ${data.language === "sw" ? "Respond in Kiswahili." : "Respond in English."}
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

      return content.trim() || "⚠️ No quick tips available.";
    } catch (err) {
      console.error("AI error (quick food tips):", err);
      return "❌ Could not generate quick food tips.";
    }
  }
}
