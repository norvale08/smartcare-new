import Groq from "groq-sdk";

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
  private groq: Groq | null = null;
  private model = "llama-3.3-70b-versatile";
  private apiKeyError: string | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    
    // Enhanced logging for debugging
    console.log("🔍 SmartCareAI Initialization:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- API Key exists:", !!apiKey);
    console.log("- API Key length:", apiKey?.length || 0);
    console.log("- API Key prefix:", apiKey?.substring(0, 8) || "NONE");
    
    if (!apiKey) {
      this.apiKeyError = "GROQ_API_KEY not found in environment variables";
      console.error("❌", this.apiKeyError);
      console.error("Available env vars:", Object.keys(process.env).filter(k => !k.includes("SECRET") && !k.includes("KEY")));
      // Don't throw - allow graceful degradation
      return;
    }
    
    if (!apiKey.startsWith("gsk_")) {
      console.warn("⚠️ Warning: API key doesn't start with 'gsk_' - may be invalid");
    }
    
    try {
      this.groq = new Groq({ apiKey });
      console.log("✅ Groq SDK initialized successfully");
    } catch (error: any) {
      this.apiKeyError = `Failed to initialize Groq: ${error.message}`;
      console.error("❌", this.apiKeyError);
    }
  }

  private checkApiKey(): boolean {
    if (this.apiKeyError || !this.groq) {
      console.error("❌ Cannot use AI - API key issue:", this.apiKeyError);
      return false;
    }
    return true;
  }

  // ✅ Summarize glucose reading
  async generateSummary(data: GlucoseData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      console.log("📝 Generating summary for glucose:", data.glucose);
      
      const prompt = `You are a medical assistant. Summarize this glucose reading in 1-2 sentences.
Glucose: ${data.glucose} mg/dL (${data.context})
Age: ${data.age ?? "N/A"}, Weight: ${data.weight ?? "N/A"} kg, Height: ${data.height ?? "N/A"} cm, Gender: ${data.gender ?? "N/A"}
${data.language === "sw" ? "Respond in Kiswahili." : ""}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 150,
      });

      const text = completion.choices[0]?.message?.content || "";
      console.log("✅ Summary generated successfully");
      return text.trim() || "⚠️ No summary available.";
    } catch (err: any) {
      console.error("❌ AI error (summary):", {
        message: err.message,
        status: err.status,
        code: err.code,
        type: err.type
      });
      
      // Return user-friendly errors
      if (err.status === 401) {
        return "❌ Invalid API key. Please contact support.";
      }
      if (err.status === 429) {
        return "❌ Rate limit exceeded. Please try again in a few minutes.";
      }
      if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
        return "❌ Network error. Cannot reach AI service.";
      }
      
      return `❌ AI Error: ${err.message}`;
    }
  }

  // ✅ Provide glucose feedback
  async generateGlucoseFeedback(data: GlucoseData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      console.log("📊 Generating feedback for glucose:", data.glucose);
      
      const prompt = `Medical assistant: Analyze glucose ${data.glucose} mg/dL (${data.context}).
Patient: Age ${data.age ?? "N/A"}, ${data.gender ?? "N/A"}, ${data.weight ?? "N/A"} kg
Is it normal/high/low? Give 2-3 sentence recommendation.
${data.language === "sw" ? "Kiswahili." : ""}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 200,
      });

      const text = completion.choices[0]?.message?.content || "";
      console.log("✅ Feedback generated successfully");
      return text.trim() || "⚠️ No feedback available.";
    } catch (err: any) {
      console.error("❌ AI error (feedback):", err);
      return this.handleAIError(err);
    }
  }

  // ✅ Lifestyle-based AI advice
  async generateLifestyleFeedback(data: LifestyleAIInput): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      console.log("🏃 Generating lifestyle feedback");
      
      const prompt = `Medical assistant for diabetes management.

Patient: Age ${data.age ?? "N/A"}, ${data.gender ?? "N/A"}, ${data.weight ?? "N/A"} kg
Glucose: ${data.glucose} mg/dL (${data.context})
Lifestyle: Alcohol: ${data.lifestyle.alcohol ?? "N/A"}, Smoking: ${data.lifestyle.smoking ?? "N/A"}, Exercise: ${data.lifestyle.exercise ?? "N/A"}, Sleep: ${data.lifestyle.sleep ?? "N/A"}

Provide 3-4 sentences:
1. Glucose status
2. How lifestyle affects glucose
3. Key recommendation

${data.language === "sw" ? "Kiswahili." : ""}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 300,
      });

      const text = completion.choices[0]?.message?.content || "";
      console.log("✅ Lifestyle feedback generated successfully");
      return text.trim() || "⚠️ No lifestyle advice available.";
    } catch (err: any) {
      console.error("❌ AI error (lifestyle advice):", err);
      return this.handleAIError(err);
    }
  }

  // ✅ Kenyan food advice
  async generateKenyanFoodAdvice(data: FoodAdviceInput): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      console.log("🍽️ Generating Kenyan food advice");
      
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

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 1500,
      });

      const text = completion.choices[0]?.message?.content || "";
      console.log("✅ Food advice generated successfully");
      return text.trim() || "⚠️ No food advice available.";
    } catch (err: any) {
      console.error("❌ AI error (food advice):", err);
      return this.handleAIError(err);
    }
  }

  // ✅ Quick Kenyan food tips
  async generateQuickFoodTips(data: {
    glucose: number;
    context: string;
    language?: string;
  }): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      console.log("💡 Generating quick food tips");
      
      let status = "";
      let advice = "";

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

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 250,
      });

      const text = completion.choices[0]?.message?.content || "";
      console.log("✅ Quick tips generated successfully");
      return text.trim() || "⚠️ No quick tips available.";
    } catch (err: any) {
      console.error("❌ AI error (quick food tips):", err);
      return this.handleAIError(err);
    }
  }

  // Helper method for consistent error handling
  private handleAIError(err: any): string {
    if (err.status === 401) {
      return "❌ Invalid API key. Please contact support.";
    }
    if (err.status === 429) {
      return "❌ Rate limit exceeded. Please try again in a few minutes.";
    }
    if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
      return "❌ Network error. Cannot reach AI service.";
    }
    return `❌ AI temporarily unavailable: ${err.message}`;
  }
}