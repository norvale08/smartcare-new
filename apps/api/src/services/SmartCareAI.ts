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

// ✅ Helper function to categorize glucose levels
function getGlucoseCategory(glucose: number, context: "Fasting" | "Post-meal" | "Random") {
  if (glucose < 70) {
    return { status: "LOW", severity: "CRITICAL", needsAction: true };
  }
  
  if (context === "Fasting") {
    return glucose <= 125
      ? { status: "NORMAL", severity: "GOOD", needsAction: false }
      : { status: "HIGH", severity: "WARNING", needsAction: true };
  }
  
  if (context === "Post-meal") {
    return glucose <= 180
      ? { status: "NORMAL", severity: "GOOD", needsAction: false }
      : { status: "HIGH", severity: "WARNING", needsAction: true };
  }
  
  // Random
  return glucose <= 200
    ? { status: "NORMAL", severity: "GOOD", needsAction: false }
    : { status: "HIGH", severity: "WARNING", needsAction: true };
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

  async generateComprehensiveFeedback(data: ComprehensiveFeedbackInput): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const languageInstruction = data.language === "sw"
        ? "\n\nCRITICAL: You MUST respond ONLY in Kiswahili language. Do NOT use any English words except medical terms. Tumia Kiswahili tu!"
        : "\n\nRespond in clear English.";

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

Make it flow naturally as one cohesive message. Focus on what they CAN do to improve their health.${languageInstruction}`;

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
      // ✅ Get accurate glucose category
      const category = getGlucoseCategory(data.glucose, data.context);

      let bpInfo = "No blood pressure recorded";
      if (data.systolic && data.diastolic) {
        const bpStatus = data.systolic >= 140 || data.diastolic >= 90 ? "High" :
                        data.systolic >= 120 || data.diastolic >= 80 ? "Elevated" : "Normal";
        bpInfo = `${data.systolic}/${data.diastolic} mmHg (${bpStatus})`;
      }

      let hrInfo = "No heart rate recorded";
      if (data.heartRate) {
        const hrStatus = data.heartRate > 100 ? "Elevated" :
                        data.heartRate < 60 ? "Low" : "Normal";
        hrInfo = `${data.heartRate} bpm (${hrStatus})`;
      }

      let exerciseInfo = "";
      if (data.exerciseRecent && data.exerciseIntensity) {
        exerciseInfo = `Recent exercise: ${data.exerciseRecent} (${data.exerciseIntensity} intensity).`;
      }

      let mealContext = "";
      if (data.context === "Post-meal" && data.lastMealTime && data.mealType) {
        mealContext = `Meal: ${data.mealType} (${data.lastMealTime} ago).`;
      }

      const languageInstruction = data.language === "sw"
        ? "\n\nCRITICAL: You MUST respond ONLY in Kiswahili language. Do NOT use English. Tumia Kiswahili pekee!"
        : "\n\nRespond in English.";

      const prompt = `You are a medical assistant. Provide a comprehensive 2-3 sentence summary of these vital signs.

CRITICAL GLUCOSE THRESHOLDS (MUST USE THESE):
- LOW: < 70 mg/dL (CRITICAL - needs immediate action)
- FASTING Normal: ≤ 125 mg/dL, High: > 125 mg/dL
- POST-MEAL Normal: ≤ 180 mg/dL, High: > 180 mg/dL  
- RANDOM Normal: ≤ 200 mg/dL, High: > 200 mg/dL

PATIENT DATA:
- Glucose: ${data.glucose} mg/dL (${data.context} reading) - STATUS: ${category.status}
- Blood Pressure: ${bpInfo}
- Heart Rate: ${hrInfo}
${data.age ? `- Age: ${data.age}` : ""}
${data.gender ? `- Gender: ${data.gender}` : ""}
${data.weight ? `- Weight: ${data.weight} kg` : ""}
${data.height ? `- Height: ${data.height} cm` : ""}
${exerciseInfo ? `- ${exerciseInfo}` : ""}
${mealContext ? `- ${mealContext}` : ""}

Based on the STATUS (${category.status}), provide a brief medical summary that:
1. Clearly states if glucose is LOW, NORMAL, or HIGH for ${data.context} context
2. Mentions blood pressure and heart rate if available
3. Considers exercise and meal timing if provided
4. Gives one key observation

IMPORTANT: Use the exact thresholds above to determine if glucose is normal or high.${languageInstruction}`;

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
      // ✅ Get accurate glucose category
      const category = getGlucoseCategory(data.glucose, data.context);

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

      const languageInstruction = data.language === "sw"
        ? "\n\nIMPORTANT: Jibu kwa Kiswahili PEKEE. Usitumie Kiingereza kabisa!"
        : "\n\nRespond in English.";

      const prompt = `Medical assistant: Analyze glucose reading with EXACT clinical thresholds.

CRITICAL GLUCOSE THRESHOLDS (FOLLOW THESE EXACTLY):
- LOW (HYPOGLYCEMIA): < 70 mg/dL → Needs immediate sugar/food
- FASTING: Normal ≤ 125 mg/dL, High > 125 mg/dL
- POST-MEAL: Normal ≤ 180 mg/dL, High > 180 mg/dL
- RANDOM: Normal ≤ 200 mg/dL, High > 200 mg/dL

PATIENT DATA:
Glucose: ${data.glucose} mg/dL (${data.context} reading) - CLASSIFIED AS: ${category.status}
${additionalContext}
Patient: Age ${data.age ?? "N/A"}, ${data.gender ?? "N/A"}, ${data.weight ?? "N/A"} kg

Provide 3-4 sentence analysis:
1. State if glucose is ${category.status} for ${data.context} context based on thresholds above
2. ${category.needsAction ? "Explain what action is needed" : "Confirm the reading is within normal range"}
3. Impact of any additional vital signs provided
4. One key personalized recommendation

CRITICAL: Must use the exact thresholds listed above.${languageInstruction}`;

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
      // ✅ Get accurate glucose category
      const category = getGlucoseCategory(data.glucose, data.context);

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

      const languageInstruction = data.language === "sw"
        ? "\n\nMUHIMU: Jibu kwa lugha ya Kiswahili TU. Usitumie Kiingereza!"
        : "\n\nRespond in English.";

      const prompt = `Medical assistant for diabetes management.

GLUCOSE THRESHOLDS (USE THESE):
- LOW: < 70 mg/dL
- FASTING: Normal ≤ 125, High > 125
- POST-MEAL: Normal ≤ 180, High > 180
- RANDOM: Normal ≤ 200, High > 200

PATIENT DATA:
Age ${data.age ?? "N/A"}, ${data.gender ?? "N/A"}, ${data.weight ?? "N/A"} kg
Glucose: ${data.glucose} mg/dL (${data.context}) - STATUS: ${category.status}
${vitalContext}
Lifestyle: Alcohol: ${data.lifestyle.alcohol ?? "N/A"}, Smoking: ${data.lifestyle.smoking ?? "N/A"}, Exercise: ${data.lifestyle.exercise ?? "N/A"}, Sleep: ${data.lifestyle.sleep ?? "N/A"}

Provide 4-5 sentences:
1. Glucose status (${category.status}) in context of ${data.context} using exact thresholds
2. How lifestyle factors interact with glucose levels
3. Impact of vital signs if provided
4. Two key personalized recommendations

Must follow the exact glucose thresholds listed above.${languageInstruction}`;

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
      // ✅ Get accurate glucose category
      const category = getGlucoseCategory(data.glucose, data.context);

      const bmi = data.weight && data.height 
        ? (data.weight / Math.pow(data.height / 100, 2)).toFixed(1)
        : null;

      let bpStatus = "Not recorded";
      let bpContext = "";
      if (data.systolic && data.diastolic) {
        bpStatus = data.systolic >= 140 || data.diastolic >= 90 ? "High" :
                  data.systolic >= 120 || data.diastolic >= 80 ? "Elevated" : "Normal";
        bpContext = ` Consider both diabetes and hypertension management.`;
      }

      let hrContext = "";
      if (data.heartRate) {
        hrContext = ` Heart rate: ${data.heartRate} bpm.`;
      }

      let exerciseContext = "";
      if (data.exerciseRecent && data.exerciseIntensity) {
        exerciseContext = ` Recent ${data.exerciseIntensity} exercise: ${data.exerciseRecent}.`;
      }

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

      const languageInstruction = data.language === "sw"
        ? "\n\nKUMBUKA: Jibu kwa Kiswahili PEKEE. Hakuna Kiingereza!"
        : "\n\nUse clear English.";

      const prompt = `You are a Kenyan nutritionist specializing in diabetes and hypertension management. 
Use ONLY authentic Kenyan foods and meals that are affordable and easy to prepare.

CRITICAL GLUCOSE THRESHOLDS FOR MEAL PLANNING:
- LOW (< 70): Needs quick energy foods
- FASTING: Normal ≤ 125, High > 125
- POST-MEAL: Normal ≤ 180, High > 180
- RANDOM: Normal ≤ 200, High > 200

PATIENT PROFILE:
- Age: ${data.age ?? "N/A"}, Gender: ${data.gender ?? "N/A"}
- Glucose: ${data.glucose} mg/dL (${data.context}) - CLASSIFIED AS: ${category.status}${mealTimingContext}
- Blood Pressure: ${data.systolic && data.diastolic ? `${data.systolic}/${data.diastolic} mmHg (${bpStatus})` : "Not recorded"}
- BMI: ${bmi ?? "N/A"}
- Weight: ${data.weight ?? "N/A"} kg, Height: ${data.height ?? "N/A"} cm
${hrContext}${exerciseContext}
${lifestyleInfo}
${allergiesInfo}

MEAL PLANNING BASED ON GLUCOSE STATUS (${category.status}):
${category.status === "LOW" ? "- Focus on immediate energy foods with sustained release" :
  category.status === "HIGH" ? "- Focus on low glycemic index foods, high fiber, portion control" :
  "- Maintain balanced nutrition with moderate portions"}
${bpContext}
- ${data.exerciseIntensity === "vigorous" ? "Include adequate protein and carbs for recovery" :
    data.exerciseIntensity === "moderate" ? "Balance nutrients for active lifestyle" :
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
- Each meal description should be 2–4 sentences
- Mention portions (e.g., 'half a plate', '1 kiganja', '1 bakuli')
- Include several affordable options for each meal
- Use Kenyan cooking methods (boil, steam, roast on jiko, etc.)
- Avoid foreign foods (pizza, chips, sausages, white bread, etc.)
- Consider blood pressure status for salt and fat content
- Tailor recommendations to glucose status: ${category.status}${languageInstruction}`;

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
          breakfast: data.language === "sw" 
            ? "Uji wa wimbi na yai la kuchemsha au viazi vitamu. Ongeza ndizi kwa nguvu."
            : "Millet porridge with a boiled egg or sweet potato. Add a banana for energy.",
          lunch: data.language === "sw"
            ? "Ugali wa mahindi ngano na sukuma wiki pamoja na omena au ndengu. Kunywa maji au juice bila sukari."
            : "Brown ugali with sukuma wiki and omena or ndengu. Drink water or sugar-free juice.",
          supper: data.language === "sw"
            ? "Githeri yenye managu au kunde wa kusteam. Unaweza ongeza parachichi kidogo."
            : "Light githeri with steamed managu or kunde. Can include a small avocado.",
          foods_to_avoid: data.language === "sw"
            ? "Epuka mkate mweupe, chapati, mandazi, soda, nyama yenye mafuta mengi, na vyakula vilivyokaangwa."
            : "Avoid white bread, chapati, mandazi, soda, fatty meat, and deep-fried foods.",
        };
      }

      return parsedAdvice as FoodAdviceResponse;
    } catch (err: any) {
      return {
        breakfast: data.language === "sw" 
          ? "Uji wa wimbi na ndizi au yai la kuchemsha."
          : "Millet porridge with ripe banana or boiled egg.",
        lunch: data.language === "sw"
          ? "Ugali wa mahindi ngano na sukuma wiki pamoja na omena."
          : "Brown ugali with sukuma wiki and omena.",
        supper: data.language === "sw"
          ? "Githeri na kunde au managu wa kusteam."
          : "Githeri with steamed kunde or managu.",
        foods_to_avoid: data.language === "sw"
          ? "Epuka vyakula vyenye sukari nyingi, chapati, mandazi, soda, na vyakula vilivyokaangwa."
          : "Avoid sugary foods, chapati, mandazi, soda, and fried items.",
      };
    }
  }

  async generateQuickFoodTips(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      // ✅ Get accurate glucose category
      const category = getGlucoseCategory(data.glucose, data.context);

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

      let advice = "";
      if (data.glucose < 70) {
        advice = data.language === "sw"
          ? "Kula SASA HIVI: ndizi mbivu, viazi vitamu, au sukari kidogo na maji"
          : "Eat IMMEDIATELY: ripe banana, sweet potato (viazi vitamu), or sugar with water";
      } else if (data.context === "Fasting") {
        advice = data.glucose > 125
          ? (data.language === "sw"
              ? "EPUKA: ugali mweupe, chapati, mandazi, soda. KULA: sukuma wiki, managu, terere na maharagwe"
              : "AVOID: white ugali, chapati, mandazi, soda. EAT: sukuma wiki, managu, terere and beans")
          : (data.language === "sw"
              ? "ENDELEA: githeri, ndengu, arrow roots, kunde, omena na sukuma wiki"
              : "MAINTAIN: githeri, ndengu, arrow roots, kunde, omena and sukuma wiki");
      } else if (data.context === "Post-meal") {
        advice = data.glucose > 180
          ? (data.language === "sw"
              ? "Tembea dakika 15. Mlo ujao: punguza ugali, ongeza sukuma wiki na mboga"
              : "Walk 15 mins. Next meal: reduce ugali, add more sukuma wiki and vegetables")
          : (data.language === "sw"
              ? "Vizuri! Endelea na: ugali wa mahindi ngano, mboga, na protini zenye mafuta machache"
              : "Good! Continue with: whole maize ugali, vegetables, and lean proteins");
      } else {
        // Random
        advice = data.glucose > 200
          ? (data.language === "sw"
              ? "Punguza vyakula vya sukari. Ongeza mboga na maji mengi"
              : "Reduce sugary foods. Increase vegetables and water intake")
          : (data.language === "sw"
              ? "Endelea vizuri! Kula chakula kilichochanganyika na mboga nyingi"
              : "Doing well! Continue with balanced meals with plenty of vegetables");
      }

      const languageInstruction = data.language === "sw"
        ? "\n\nMUHIMU SANA: Jibu kwa Kiswahili PEKEE. Hakuna maneno ya Kiingereza!"
        : "\n\nRespond in English.";

      const prompt = `Kenyan nutritionist. 

GLUCOSE THRESHOLDS (FOLLOW EXACTLY):
- LOW: < 70 mg/dL → Immediate action needed
- FASTING: Normal ≤ 125, High > 125
- POST-MEAL: Normal ≤ 180, High > 180
- RANDOM: Normal ≤ 200, High > 200

PATIENT DATA:
Glucose ${data.glucose} mg/dL (${data.context} reading) - STATUS: ${category.status}${additionalContext}

IMMEDIATE ACTION NEEDED: ${advice}

Give 3-4 IMMEDIATE Kenyan food tips considering:
${data.systolic && data.diastolic ? 'Also consider blood pressure in recommendations.' : ''}

Use ONLY: ugali, sukuma wiki, managu, githeri, ndengu, omena, tilapia, viazi vitamu, arrow roots, kunde, maharagwe, fruits (papai, ndizi, mapera).

Mention Kenyan measurements and cooking (boil, steam, roast).
Base recommendations on the STATUS: ${category.status} for ${data.context} context.${languageInstruction}`;

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