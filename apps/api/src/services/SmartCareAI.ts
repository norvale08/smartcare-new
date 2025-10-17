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

  // ✅ Summarize glucose reading
  async generateSummary(data: GlucoseData): Promise<string> {
    try {
      const prompt = `You are a medical assistant. Summarize this glucose reading in 1-2 sentences.
Glucose: ${data.glucose} mg/dL (${data.context})
Age: ${data.age ?? "N/A"}, Weight: ${data.weight ?? "N/A"} kg, Height: ${data.height ?? "N/A"} cm, Gender: ${data.gender ?? "N/A"}
${data.language === "sw" ? "Respond in Kiswahili." : ""}`;

      let content = "";
      const stream = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 100, // Limit to ~2 sentences
        }
      });

      for await (const token of stream) {
        content += token.message?.content || "";
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
      const prompt = `Medical assistant: Analyze glucose ${data.glucose} mg/dL (${data.context}).
Patient: Age ${data.age ?? "N/A"}, ${data.gender ?? "N/A"}, ${data.weight ?? "N/A"} kg
Is it normal/high/low? Give 2-3 sentence recommendation.
${data.language === "sw" ? "Kiswahili." : ""}`;

      let content = "";
      const stream = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 150,
        }
      });

      for await (const token of stream) {
        content += token.message?.content || "";
      }

      return content.trim() || "⚠️ No feedback available.";
    } catch (err) {
      console.error("AI error (feedback):", err);
      return "❌ Could not generate AI feedback.";
    }
  }

  // ✅ OPTIMIZED: Lifestyle-based AI advice (MUCH FASTER)
  async generateLifestyleFeedback(data: LifestyleAIInput): Promise<string> {
    try {
      // ✅ Shorter, more focused prompt
      const prompt = `Medical assistant for diabetes management.

Patient: Age ${data.age ?? "N/A"}, ${data.gender ?? "N/A"}, ${data.weight ?? "N/A"} kg
Glucose: ${data.glucose} mg/dL (${data.context})
Lifestyle: Alcohol: ${data.lifestyle.alcohol ?? "N/A"}, Smoking: ${data.lifestyle.smoking ?? "N/A"}, Exercise: ${data.lifestyle.exercise ?? "N/A"}, Sleep: ${data.lifestyle.sleep ?? "N/A"}

Provide 3-4 sentences:
1. Glucose status
2. How lifestyle affects glucose
3. Key recommendation

${data.language === "sw" ? "Kiswahili." : ""}`;

      let content = "";
      const stream = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 200, // Limit response length
          top_p: 0.9,
        }
      });

      for await (const token of stream) {
        content += token.message?.content || "";
      }

      return content.trim() || "⚠️ No lifestyle advice available.";
    } catch (err) {
      console.error("AI error (lifestyle advice):", err);
      return "❌ Could not generate lifestyle AI advice.";
    }
  }

  // ✅ Kenyan food advice (ENHANCED with lifestyle & demographics)
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
        : "Not recorded";

      // ✅ Build comprehensive but concise prompt
      const lifestyleInfo = data.lifestyle 
        ? `Lifestyle: Alcohol: ${data.lifestyle.alcohol}, Smoking: ${data.lifestyle.smoking}, Exercise: ${data.lifestyle.exercise}, Sleep: ${data.lifestyle.sleep}`
        : "";

      const allergiesInfo = data.allergies && data.allergies.length > 0
        ? `Allergies: ${data.allergies.join(", ")}`
        : "";

      const prompt = `You are a Kenyan nutritionist specializing in diabetes management. Use ONLY authentic Kenyan foods and meals.

Patient Profile:
- Age: ${data.age ?? "N/A"}, Gender: ${data.gender ?? "N/A"}
- Glucose: ${data.glucose} mg/dL (${data.context})
- Blood Pressure: ${bpStatus}
- BMI: ${bmi ?? "N/A"}
- Weight: ${data.weight ?? "N/A"} kg, Height: ${data.height ?? "N/A"} cm
${lifestyleInfo}
${allergiesInfo}

Create a daily Kenyan meal plan using ONLY these authentic Kenyan foods:

STARCHES: Ugali (whole maize meal), brown ugali, arrow roots, sweet potatoes (viazi vitamu), cassava (muhogo), millet ugali, sorghum ugali
PROTEINS: Omena (sardines), tilapia, mbuta, beef (nyama ya ng'ombe), chicken (kuku), eggs (mayai), beans (maharagwe), ndengu (green grams), njahi (black beans), kunde, githeri (maize + beans)
VEGETABLES: Sukuma wiki (kale), managu (African nightshade), terere (amaranth), kunde leaves, spinach, cabbage (kabichi), tomatoes (nyanya), onions (vitunguu)
FRUITS: Pawpaw (papai), guava (mapera), bananas (ndizi), oranges (machungwa), passion fruit (maracuja), avocado (parachichi), pineapple (nanasi)
DRINKS: Uji (porridge - millet/wimbi/sorghum), mursik, chai ya tangawizi (ginger tea), water, fermented milk

Provide:
1. BREAKFAST with Kenyan foods and portion
2. MID-MORNING SNACK (Kenyan fruits/nuts)
3. LUNCH with Kenyan foods and portion
4. AFTERNOON SNACK 
5. DINNER with Kenyan foods and portion
6. Foods to COMPLETELY AVOID
7. Kenyan cooking methods (boil, steam, roast on jiko)

DO NOT suggest: pasta, rice (unless specified), pizza, burgers, or foreign foods.
Use Kenyan measurements: debe, bakuli, kibaba, handful (kiganja).
${data.language === "sw" ? "Jibu kwa Kiswahili. Tumia chakula cha Kikenya tu." : "Use ONLY Kenyan foods."}`;

      let content = "";
      const stream = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 400, // Allow longer response for detailed plan
          top_p: 0.9,
        }
      });

      for await (const token of stream) {
        content += token.message?.content || "";
      }

      return content.trim() || "⚠️ No food advice available.";
    } catch (err) {
      console.error("AI error (food advice):", err);
      return "❌ Could not generate food advice.";
    }
  }

  // ✅ Quick Kenyan food tips (ENHANCED)
  async generateQuickFoodTips(data: {
    glucose: number;
    context: string;
    language?: string;
  }): Promise<string> {
    try {
      let status = "";
      let advice = "";

      // Determine glucose status
      if (data.context === "Fasting") {
        if (data.glucose < 70) {
          status = "LOW";
          advice = "Eat IMMEDIATELY: ripe banana, sweet potato (viazi vitamu), or sukari kidogo na maji";
        } else if (data.glucose > 126) {
          status = "HIGH";
          advice = "AVOID: ugali mweupe, chapati, mandazi, soda. EAT: sukuma wiki, managu, terere na maharagwe";
        } else {
          status = "NORMAL";
          advice = "MAINTAIN: githeri, ndengu, arrow roots, kunde, omena na sukuma wiki";
        }
      } else if (data.context === "Post-meal") {
        if (data.glucose < 100) {
          status = "LOW";
          advice = "Eat snack: ndizi, papai, or handful of njugu karanga (groundnuts)";
        } else if (data.glucose > 180) {
          status = "HIGH";
          advice = "Walk 15 mins. Next meal: reduce ugali, add sukuma wiki na mboga";
        } else {
          status = "NORMAL";
          advice = "Good! Continue with: whole maize ugali, vegetables, and lean proteins";
        }
      }

      const prompt = `Kenyan nutritionist. Glucose ${data.glucose} mg/dL (${data.context}) - ${status}.

Give 3-4 IMMEDIATE Kenyan food tips:
${advice}

Use ONLY: ugali, sukuma wiki, managu, githeri, ndengu, omena, tilapia, viazi vitamu, arrow roots, kunde, maharagwe, fruits (papai, ndizi, mapera).

Mention Kenyan measurements and cooking (boil, steam, roast).
${data.language === "sw" ? "Jibu kwa Kiswahili." : ""}`;

      let content = "";
      const stream = await ollama.chat({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 150,
        }
      });

      for await (const token of stream) {
        content += token.message?.content || "";
      }

      return content.trim() || "⚠️ No quick tips available.";
    } catch (err) {
      console.error("AI error (quick food tips):", err);
      return "❌ Could not generate quick food tips.";
    }
  }
}