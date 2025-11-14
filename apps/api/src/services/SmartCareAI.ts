import dotenv from "dotenv";
dotenv.config();
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
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  language?: "en" | "sw";
  exerciseRecent?: string;
  exerciseIntensity?: string;
  lastMealTime?: string;
  mealType?: string;
}

export interface FoodAdviceInput extends VitalsData {
  lifestyle?: LifestyleData;
  medicalHistory?: string[];
  allergies?: string[];
}

export interface FoodAdviceResponse {
  breakfast: string;
  lunch: string;
  supper: string;
  foods_to_avoid: string;
}

// ✅ ADD THIS MISSING INTERFACE
export interface ComprehensiveFeedbackInput {
  summary: string;
  foodAdvice: FoodAdviceResponse;
  quickTips: string;
  lifestyleFeedback: string;
  vitalData: any;
  patientData: any;
  hasBloodPressure: boolean;
  hasHeartRate: boolean;
  language: "en" | "sw";
}

export class SmartCareAI {
  private groq: Groq | null = null;
  private model = "llama-3.3-70b-versatile";
  private apiKeyError: string | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    console.log("🔍 SmartCareAI Initialization:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- API Key exists:", !!apiKey);
    console.log("- API Key length:", apiKey?.length || 0);
    console.log("- API Key prefix:", apiKey?.substring(0, 8) || "NONE");

    if (!apiKey) {
      this.apiKeyError = "GROQ_API_KEY not found in environment variables";
      console.error("❌", this.apiKeyError);
      console.error(
        "Available env vars:",
        Object.keys(process.env).filter(
          (k) => !k.includes("SECRET") && !k.includes("KEY")
        )
      );
      return;
    }

    if (!apiKey.startsWith("gsk_")) {
      console.warn(
        "⚠️ Warning: API key doesn't start with 'gsk_' - may be invalid"
      );
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

  // ✅ ADD THIS MISSING METHOD
  async generateComprehensiveFeedback(data: ComprehensiveFeedbackInput): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const prompt = `You are a compassionate medical assistant providing comprehensive diabetes management feedback.

PATIENT SUMMARY:
${data.summary}

FOOD ADVICE:
- Breakfast: ${data.foodAdvice.breakfast}
- Lunch: ${data.foodAdvice.lunch}
- Supper: ${data.foodAdvice.supper}
- Foods to Avoid: ${data.foodAdvice.foods_to_avoid}

QUICK TIPS:
${data.quickTips}

LIFESTYLE FEEDBACK:
${data.lifestyleFeedback}

ADDITIONAL CONTEXT:
- Blood Pressure Recorded: ${data.hasBloodPressure ? 'Yes' : 'No'}
- Heart Rate Recorded: ${data.hasHeartRate ? 'Yes' : 'No'}
- Patient Language: ${data.language}

Combine all this information into a comprehensive, compassionate final feedback that:
1. Starts with an encouraging opening about their health journey
2. Summarizes the key health insights from their data
3. Provides clear, actionable food recommendations
4. Includes the most important lifestyle suggestions
5. Ends with motivational closing and next steps
6. Is written in a warm, supportive tone

Make it flow naturally as one cohesive message. Focus on what they CAN do to improve their health.

${data.language === "sw" ? "Tumia lugha ya Kiswahili na uwe na huruma." : "Use English and be compassionate."}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 800,
      });

      const text = completion.choices[0]?.message?.content || "";
      return text.trim() || "⚠️ No comprehensive feedback available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  async generateSummary(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      // Build blood pressure information with context
      let bpInfo = "No blood pressure recorded";
      if (data.systolic && data.diastolic) {
        const bpStatus = data.systolic >= 140 || data.diastolic >= 90 ? "High" :
                        data.systolic >= 120 || data.diastolic >= 80 ? "Elevated" : "Normal";
        bpInfo = `${data.systolic}/${data.diastolic} mmHg (${bpStatus})`;
      }

      // Build heart rate information with context
      let hrInfo = "No heart rate recorded";
      if (data.heartRate) {
        const hrStatus = data.heartRate > 100 ? "Elevated" :
                        data.heartRate < 60 ? "Low" : "Normal";
        hrInfo = `${data.heartRate} bpm (${hrStatus})`;
      }

      // Build exercise context
      let exerciseInfo = "";
      if (data.exerciseRecent && data.exerciseIntensity) {
        exerciseInfo = `Recent exercise: ${data.exerciseRecent} (${data.exerciseIntensity} intensity).`;
      }

      // Build meal context for Post-meal readings
      let mealContext = "";
      if (data.context === "Post-meal" && data.lastMealTime && data.mealType) {
        mealContext = `Meal: ${data.mealType} (${data.lastMealTime} ago).`;
      }

      const prompt = `You are a medical assistant. Provide a comprehensive 2-3 sentence summary of these vital signs, considering all available context.

PATIENT DATA:
- Glucose: ${data.glucose} mg/dL (${data.context} reading)
- Blood Pressure: ${bpInfo}
- Heart Rate: ${hrInfo}
${data.age ? `- Age: ${data.age}` : ""}
${data.gender ? `- Gender: ${data.gender}` : ""}
${data.weight ? `- Weight: ${data.weight} kg` : ""}
${data.height ? `- Height: ${data.height} cm` : ""}
${exerciseInfo ? `- ${exerciseInfo}` : ""}
${mealContext ? `- ${mealContext}` : ""}

Provide a brief medical summary that:
1. Comments on the glucose level in context of ${data.context}
2. Mentions blood pressure and heart rate if available
3. Considers exercise and meal timing if provided
4. Gives one key observation

${data.language === "sw" ? "Respond in Kiswahili." : "Respond in English."}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 200,
      });

      const text = completion.choices[0]?.message?.content || "";
      return text.trim() || "⚠️ No summary available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  async generateGlucoseFeedback(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      // Build context for blood pressure and heart rate
      let additionalContext = "";
      if (data.systolic && data.diastolic) {
        additionalContext += ` Blood pressure: ${data.systolic}/${data.diastolic} mmHg.`;
      }
      if (data.heartRate) {
        additionalContext += ` Heart rate: ${data.heartRate} bpm.`;
      }
      if (data.exerciseRecent && data.exerciseIntensity) {
        additionalContext += ` Recent exercise: ${data.exerciseRecent} (${data.exerciseIntensity}).`;
      }

      const prompt = `Medical assistant: Analyze glucose ${data.glucose} mg/dL (${data.context} reading).${additionalContext}
Patient: Age ${data.age ?? "N/A"}, ${data.gender ?? "N/A"}, ${data.weight ?? "N/A"} kg

Provide 3-4 sentence analysis covering:
1. Glucose level assessment (normal/high/low for ${data.context})
2. Impact of any additional vital signs provided
3. Consider exercise context if available
4. One key recommendation

${data.language === "sw" ? "Jibu kwa Kiswahili." : ""}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 250,
      });

      const text = completion.choices[0]?.message?.content || "";
      return text.trim() || "⚠️ No feedback available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  async generateLifestyleFeedback(data: LifestyleAIInput & VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      // Build comprehensive context
      let vitalContext = "";
      if (data.systolic && data.diastolic) {
        vitalContext += `BP: ${data.systolic}/${data.diastolic} mmHg. `;
      }
      if (data.heartRate) {
        vitalContext += `HR: ${data.heartRate} bpm. `;
      }
      if (data.exerciseRecent && data.exerciseIntensity) {
        vitalContext += `Exercise: ${data.exerciseRecent} (${data.exerciseIntensity}).`;
      }

      const prompt = `Medical assistant for diabetes management.

Patient: Age ${data.age ?? "N/A"}, ${data.gender ?? "N/A"}, ${data.weight ?? "N/A"} kg
Glucose: ${data.glucose} mg/dL (${data.context})
${vitalContext}
Lifestyle: Alcohol: ${data.lifestyle.alcohol ?? "N/A"}, Smoking: ${data.lifestyle.smoking ?? "N/A"}, Exercise: ${data.lifestyle.exercise ?? "N/A"}, Sleep: ${data.lifestyle.sleep ?? "N/A"}

Provide 4-5 sentences:
1. Glucose status in context of ${data.context}
2. How lifestyle factors interact with glucose levels
3. Impact of vital signs if provided
4. Two key personalized recommendations

${data.language === "sw" ? "Jibu kwa Kiswahili." : ""}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 350,
      });

      const text = completion.choices[0]?.message?.content || "";
      return text.trim() || "⚠️ No lifestyle advice available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  async generateKenyanFoodAdvice(data: FoodAdviceInput): Promise<FoodAdviceResponse> {
    if (!this.checkApiKey()) {
      throw new Error(`AI temporarily unavailable: ${this.apiKeyError}`);
    }

    try {
      // Calculate BMI
      const bmi = data.weight && data.height 
        ? (data.weight / Math.pow(data.height / 100, 2)).toFixed(1)
        : null;

      // Blood pressure assessment
      let bpStatus = "Not recorded";
      let bpContext = "";
      if (data.systolic && data.diastolic) {
        bpStatus = data.systolic >= 140 || data.diastolic >= 90 ? "High" :
                  data.systolic >= 120 || data.diastolic >= 80 ? "Elevated" : "Normal";
        bpContext = ` Consider both diabetes and hypertension management.`;
      }

      // Heart rate context
      let hrContext = "";
      if (data.heartRate) {
        hrContext = ` Heart rate: ${data.heartRate} bpm.`;
      }

      // Exercise context for meal planning
      let exerciseContext = "";
      if (data.exerciseRecent && data.exerciseIntensity) {
        exerciseContext = ` Recent ${data.exerciseIntensity} exercise: ${data.exerciseRecent}.`;
      }

      // Meal timing context
      let mealTimingContext = "";
      if (data.context === "Post-meal" && data.lastMealTime && data.mealType) {
        mealTimingContext = ` Current reading is ${data.lastMealTime} after ${data.mealType} meal.`;
      }

      const lifestyleInfo = data.lifestyle
        ? `Lifestyle: Alcohol: ${data.lifestyle.alcohol}, Smoking: ${data.lifestyle.smoking}, Exercise: ${data.lifestyle.exercise}, Sleep: ${data.lifestyle.sleep}`
        : "";

      const allergiesInfo = data.allergies && data.allergies.length > 0
        ? `Allergies: ${data.allergies.join(", ")}`
        : "";

      const prompt = `You are a Kenyan nutritionist specializing in diabetes and hypertension management. 
Use ONLY authentic Kenyan foods and meals that are affordable and easy to prepare.

PATIENT PROFILE FOR MEAL PLANNING:
- Age: ${data.age ?? "N/A"}, Gender: ${data.gender ?? "N/A"}
- Glucose: ${data.glucose} mg/dL (${data.context} reading)${mealTimingContext}
- Blood Pressure: ${data.systolic && data.diastolic ? `${data.systolic}/${data.diastolic} mmHg (${bpStatus})` : "Not recorded"}
- BMI: ${bmi ?? "N/A"}
- Weight: ${data.weight ?? "N/A"} kg, Height: ${data.height ?? "N/A"} cm
${hrContext}${exerciseContext}
${lifestyleInfo}
${allergiesInfo}

SPECIAL CONSIDERATIONS:${bpContext}
- ${data.context === "Fasting" ? "Focus on sustained energy release foods" : 
    data.context === "Post-meal" ? "Consider post-meal glucose control foods" : 
    "Provide balanced nutrition for random glucose levels"}
- ${data.exerciseIntensity === "High" ? "Include adequate protein and carbs for recovery" :
    data.exerciseIntensity === "Moderate" ? "Balance nutrients for active lifestyle" :
    "Standard diabetic meal planning"}

Create a balanced daily meal plan using ONLY these authentic Kenyan foods:

STARCHES: Ugali (whole maize meal), brown ugali, arrow roots, sweet potatoes, cassava, millet ugali, sorghum ugali, brown rice
PROTEINS: Omena, tilapia, mbuta, beef, chicken, eggs, beans, ndengu, njahi, kunde, githeri
VEGETABLES: Sukuma wiki, managu, terere, kunde leaves, spinach, cabbage, tomatoes, onions
FRUITS: Pawpaw, guava, bananas, oranges, avocado, pineapple
DRINKS: Uji (millet/wimbi/sorghum porridge), mursik, chai ya tangawizi, water, fermented milk

You MUST respond in VALID JSON format with this EXACT structure:
{
  "breakfast": "Detailed breakfast recommendation with several affordable Kenyan options. Mention portions, drink, and benefits.",
  "lunch": "Detailed lunch recommendation with specific Kenyan foods and several affordable options. Mention protein, vegetables, starch, and cooking method.",
  "supper": "Detailed supper recommendation with specific Kenyan foods and several affordable options. Should be lighter than lunch.",
  "foods_to_avoid": "List of common Kenyan foods, drinks, or habits that people with diabetes or hypertension should avoid."
}

IMPORTANT RULES:
- Each meal description should be 2–4 sentences.
- Mention portions (e.g., 'half a plate', '1 kiganja', '1 bakuli').
- Include several affordable options for each meal.
- Use Kenyan cooking methods (boil, steam, roast on jiko, etc.).
- Avoid foreign foods (pizza, chips, sausages, white bread, etc.).
- Consider blood pressure status for salt and fat content.
- ${data.language === "sw" ? "Jibu kwa Kiswahili." : "Use clear English."}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content || "{}";

      const parsedAdvice = JSON.parse(text);

      if (!parsedAdvice.breakfast || !parsedAdvice.lunch || !parsedAdvice.supper || !parsedAdvice.foods_to_avoid) {
        return {
          breakfast: "Millet porridge with a boiled egg or sweet potato. Add a banana for energy.",
          lunch: "Brown ugali with sukuma wiki and omena or ndengu. Drink water or sugar-free juice.",
          supper: "Light githeri with steamed managu or kunde. Can include a small avocado.",
          foods_to_avoid: "Avoid white bread, chapati, mandazi, soda, fatty meat, and deep-fried foods.",
        };
      }

      return parsedAdvice as FoodAdviceResponse;
    } catch (err: any) {
      return {
        breakfast: "Millet porridge with ripe banana or boiled egg.",
        lunch: "Brown ugali with sukuma wiki and omena.",
        supper: "Githeri with steamed kunde or managu.",
        foods_to_avoid: "Avoid sugary foods, chapati, mandazi, soda, and fried items.",
      };
    }
  }

  async generateQuickFoodTips(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      // Build context for the tips
      let additionalContext = "";
      if (data.systolic && data.diastolic) {
        additionalContext += ` BP ${data.systolic}/${data.diastolic}.`;
      }
      if (data.heartRate) {
        additionalContext += ` HR ${data.heartRate} bpm.`;
      }
      if (data.exerciseRecent && data.exerciseIntensity) {
        additionalContext += ` Recent exercise: ${data.exerciseRecent} (${data.exerciseIntensity}).`;
      }

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

      const prompt = `Kenyan nutritionist. Glucose ${data.glucose} mg/dL (${data.context} reading) - ${status}.${additionalContext}

Give 3-4 IMMEDIATE Kenyan food tips considering:
${advice}
${data.systolic && data.diastolic ? 'Also consider blood pressure in recommendations.' : ''}

Use ONLY: ugali, sukuma wiki, managu, githeri, ndengu, omena, tilapia, viazi vitamu, arrow roots, kunde, maharagwe, fruits (papai, ndizi, mapera).

Mention Kenyan measurements and cooking (boil, steam, roast).
${data.language === "sw" ? "Jibu kwa Kiswahili." : ""}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 300,
      });

      const text = completion.choices[0]?.message?.content || "";
      return text.trim() || "⚠️ No quick tips available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

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