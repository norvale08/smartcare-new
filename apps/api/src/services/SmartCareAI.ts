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
  patientName?: string;
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
  patientName?: string;
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
  patientName?: string;
}

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
  
  return glucose <= 200
    ? { status: "NORMAL", severity: "GOOD", needsAction: false }
    : { status: "HIGH", severity: "WARNING", needsAction: true };
}

function getPatientGreeting(name: string | undefined, language: "en" | "sw" = "en"): string {
  if (!name) return language === "sw" ? "" : "";
  return `${name},`;
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

  async generateComprehensiveFeedback(data: ComprehensiveFeedbackInput): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const patientName = data.patientName || data.patientData?.patientName || "Patient";
      const greeting = getPatientGreeting(patientName, data.language);
      
      const languageInstruction = data.language === "sw"
        ? `\n\nIMPORTANT LANGUAGE & TONE RULES:
- Use ONLY Kiswahili language (no English except medical terms)
- Address patient directly using "wewe" (you)
- MUST start with "${greeting}" 
- Be warm, encouraging, and supportive
- Keep it detailed: 150-200 words
- Focus on what patient CAN do, not restrictions
- Include specific medical insights about their readings`
        : `\n\nIMPORTANT LANGUAGE & TONE RULES:
- Use English with second-person POV ("you", "your")
- MUST start with "${greeting}"
- Be warm, encouraging, and motivating
- Keep it detailed: 150-200 words
- Focus on empowerment and achievable actions
- Include specific medical insights about their readings`;

      const prompt = `You are a compassionate healthcare provider giving diabetes management feedback.

PATIENT NAME: ${patientName}

CONTEXT PROVIDED:
${data.summary}

FOOD RECOMMENDATIONS:
- Breakfast: ${data.foodAdvice.breakfast}
- Lunch: ${data.foodAdvice.lunch}
- Supper: ${data.foodAdvice.supper}
- Avoid: ${data.foodAdvice.foods_to_avoid}

QUICK TIPS: ${data.quickTips}
LIFESTYLE: ${data.lifestyleFeedback}

TASK: Create a detailed, motivating summary that:
1. MUST start with "${greeting}" followed by acknowledging their commitment
2. Provide a clear overview of their current health status with specific numbers and medical significance
3. Explain what their readings mean for their body and long-term health
4. Give 4-5 detailed, actionable food/lifestyle recommendations with clear explanations of WHY they matter
5. Connect the advice to their specific readings and how it will improve their health
6. Include positive medical aspects - what they're doing right physiologically
7. End with strong encouragement about achievable health improvements
8. Uses "you" and "your" throughout (second-person POV)
9. Be detailed and informative: 150-200 words
10. Make it feel personal and tailored to ${patientName}

MEDICAL COMMUNICATION STANDARDS:
✓ Patient-centered language
✓ Clear explanations of medical significance
✓ Empathetic and non-judgmental
✓ Action-oriented guidance with reasoning
✓ Respectful and encouraging tone
✓ Include specific details that show you understand their situation
✓ Mention positive physiological indicators${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 500,
      });

      const text = completion.choices[0]?.message?.content || "";
      return text.trim() || "⚠️ No feedback available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  async generateSummary(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const patientName = data.patientName || "Patient";
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

      const languageInstruction = data.language === "sw"
        ? "\n\nUse Kiswahili and second-person 'wewe' (you). Keep detailed: 80-120 words (3-4 sentences with medical insights)."
        : "\n\nUse English and second-person 'you/your'. Keep detailed: 80-120 words (3-4 sentences with medical insights).";

      const prompt = `Provide a detailed clinical summary addressing ${patientName} directly.

PATIENT NAME: ${patientName}

GLUCOSE THRESHOLDS:
- LOW: < 70 mg/dL (Critical)
- FASTING: Normal ≤125, High >125
- POST-MEAL: Normal ≤180, High >180  
- RANDOM: Normal ≤200, High >200

YOUR DATA:
- Glucose: ${data.glucose} mg/dL (${data.context}) - ${category.status}
- Blood Pressure: ${bpInfo}
- Heart Rate: ${hrInfo}
${data.age ? `- Age: ${data.age}` : ""}
${data.weight ? `- Weight: ${data.weight} kg` : ""}

Write 3-4 detailed sentences that:
1. Address ${patientName} directly and state their glucose status clearly with medical context
2. Explain what their specific number means for their body and health
3. Mention other vitals with specific values and medical significance
4. Give specific observations about their overall health picture with positive aspects
5. Use second-person ("you", "your") throughout
6. Be detailed and informative: 80-120 words
7. Be factual, specific, medically informative yet encouraging${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 280,
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
      const patientName = data.patientName || "Patient";
      const category = getGlucoseCategory(data.glucose, data.context);
      const greeting = getPatientGreeting(patientName, data.language);

      const languageInstruction = data.language === "sw"
        ? `\n\nTONE & LANGUAGE:
- Kiswahili ONLY
- Use "wewe/unaweza" (you/you can)
- MUST start: "${greeting}"
- Encouraging, supportive
- Detailed with medical insights: 100-140 words`
        : `\n\nTONE & LANGUAGE:
- English only
- Use "you/your/you can"
- MUST start: "${greeting}"
- Encouraging, motivating
- Detailed with medical insights: 100-140 words`;

      const prompt = `Detailed glucose analysis speaking directly to ${patientName}.

PATIENT NAME: ${patientName}

THRESHOLDS:
- LOW: <70 → Immediate action
- FASTING: Normal ≤125, High >125
- POST-MEAL: Normal ≤180, High >180
- RANDOM: Normal ≤200, High >200

YOUR READING:
${data.glucose} mg/dL (${data.context}) = ${category.status}
${data.systolic && data.diastolic ? `Blood Pressure: ${data.systolic}/${data.diastolic} mmHg` : ""}
${data.heartRate ? `Heart Rate: ${data.heartRate} bpm` : ""}
${data.exerciseRecent ? `Recent Exercise: ${data.exerciseRecent} (${data.exerciseIntensity})` : ""}

Write 4-5 detailed sentences:
1. MUST start "${greeting}" then explain what your specific glucose reading means medically in ${data.context} context
2. Explain the physiological significance - what's happening in your body
3. ${category.needsAction ? "Explain clearly what you need to do, WHY it matters for your health, and the medical benefits" : "Affirm what you're doing right physiologically and encourage you to maintain it"}
4. If other vitals provided, explain how they relate to your glucose and overall cardiovascular health
5. Give 2 specific, personalized recommendations with clear medical reasoning

COMMUNICATION STANDARDS:
✓ Direct address (you/your) to ${patientName}
✓ Positive framing with specific medical details
✓ Clear action steps with health reasons
✓ Empowering language
✓ Non-judgmental
✓ Include positive physiological aspects
✓ 100-140 words (detailed and informative)${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 340,
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
      const patientName = data.patientName || "Patient";
      const category = getGlucoseCategory(data.glucose, data.context);
      const greeting = getPatientGreeting(patientName, data.language);

      const languageInstruction = data.language === "sw"
        ? `\n\nUSE:
- Kiswahili + "wewe/unaweza"
- MUST start: "${greeting}"
- Positive, motivating
- Detailed with medical benefits: 120-160 words`
        : `\n\nUSE:
- English + "you/your/you can"
- MUST start: "${greeting}"
- Positive, motivating
- Detailed with medical benefits: 120-160 words`;

      const prompt = `Detailed lifestyle guidance addressing ${patientName} directly.

PATIENT NAME: ${patientName}

YOUR STATUS:
- Glucose: ${data.glucose} mg/dL (${data.context}) = ${category.status}
${data.systolic && data.diastolic ? `- Blood Pressure: ${data.systolic}/${data.diastolic} mmHg` : ""}
${data.heartRate ? `- Heart Rate: ${data.heartRate} bpm` : ""}
${data.age ? `- Age: ${data.age}` : ""}
${data.weight ? `- Weight: ${data.weight} kg` : ""}

YOUR LIFESTYLE:
- Alcohol: ${data.lifestyle.alcohol ?? "N/A"}
- Smoking: ${data.lifestyle.smoking ?? "N/A"}
- Exercise: ${data.lifestyle.exercise ?? "N/A"}
- Sleep: ${data.lifestyle.sleep ?? "N/A"}

Write 5-6 detailed sentences:
1. MUST start "${greeting}" + acknowledge what ${patientName} is already doing right with medical benefits
2. Explain specifically HOW your lifestyle habits are affecting your glucose levels physiologically (be detailed with medical reasoning)
3. If vitals show concerns, connect them to lifestyle factors with clear health explanations
4. Highlight any positive physiological indicators from their lifestyle choices
5. Give 2-3 specific, achievable changes you can make with detailed explanation of health benefits
6. End with strong encouragement about your body's ability to respond positively to these changes

PATIENT COMMUNICATION:
✓ "You" language throughout
✓ Celebrate specific physiological wins
✓ Clear actions with detailed medical reasoning
✓ Supportive, detailed tone
✓ Build confidence with medical facts
✓ 120-160 words (informative and motivating)${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 380,
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
      const patientName = data.patientName || "Patient";
      const category = getGlucoseCategory(data.glucose, data.context);

      const languageInstruction = data.language === "sw"
        ? "\n\nKiswahili + 'unaweza kula' (you can eat). Be realistic and encouraging. NO PORTIONS."
        : "\n\nEnglish + 'you can eat/try'. Be realistic and encouraging. NO PORTIONS.";

      const prompt = `Create realistic Kenyan meal plan addressing ${patientName} directly.

PATIENT NAME: ${patientName}
GLUCOSE: ${data.glucose} mg/dL (${data.context}) = ${category.status}
${data.systolic && data.diastolic ? `BP: ${data.systolic}/${data.diastolic} mmHg` : ""}
${data.age ? `Age: ${data.age}` : ""} ${data.weight ? `Weight: ${data.weight} kg` : ""}
${data.allergies && data.allergies.length > 0 ? `Allergies: ${data.allergies.join(", ")}` : ""}

KENYAN MEAL PATTERNS:
BREAKFAST (7-9am): Tea (black/milk), bread, mandazi, uji, arrow roots, sweet potatoes, eggs, porridge
LUNCH (12-2pm): Ugali, rice, chapati WITH sukuma wiki, cabbage, beans, meat stew, chicken, fish
SUPPER (7-9pm): Similar to lunch OR lighter like githeri, tea with bread, porridge

REALISTIC KENYAN FOODS BY MEAL:
Breakfast: Tea with milk/black, uji (millet/wimbi/fermented), porridge, bread, mandazi, boiled eggs, arrow roots, sweet potatoes, bananas
Lunch/Supper: Ugali (maize/brown), rice (white/brown), chapati, githeri, mukimo, irio, sukuma wiki, cabbage, managu, terere, kunde leaves, spinach, beans, ndengu, njahi, beef stew, chicken, tilapia, omena, matumbo
Fruits: Bananas, oranges, pawpaw, guava, watermelon, mangoes, avocado

RESPOND IN JSON:
{
  "breakfast": "YOU CAN HAVE... (realistic Kenyan breakfast items that people actually eat in the morning, explain why good for glucose/health, 2-3 sentences, NO PORTIONS)",
  "lunch": "FOR LUNCH, TRY... (realistic Kenyan lunch combinations like ugali with sukuma and meat/fish, explain benefits, 2-3 sentences, NO PORTIONS)",
  "supper": "IN THE EVENING, YOU CAN ENJOY... (realistic dinner options Kenyans eat, explain why appropriate, 2-3 sentences, NO PORTIONS)",
  "foods_to_avoid": "IT'S BETTER TO LIMIT... (realistic foods Kenyans commonly eat that affect glucose/BP, explain WHY briefly, 2 sentences, NO PORTIONS)"
}

CRITICAL RULES:
✓ Use "you" and "your" throughout - address ${patientName} directly
✓ Encouraging tone ("you can", "try", "enjoy")
✓ NO PORTIONS - just list realistic food options
✓ Be realistic about what Kenyans actually eat for each meal time
✓ DON'T recommend ugali for breakfast - that's unrealistic
✓ Multiple affordable, common options per meal
✓ Brief explanation of WHY foods are good/bad for health
✓ ${category.status === "HIGH" ? "Focus on whole grains, vegetables, lean proteins" : category.status === "LOW" ? "Include quick energy foods with sustained options" : "Balanced, everyday nutrition"}
✓ Each meal: 2-3 sentences only (realistic and brief)${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.8,
        max_tokens: 900,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content || "{}";
      const parsedAdvice = JSON.parse(text);

      if (!parsedAdvice.breakfast || !parsedAdvice.lunch || !parsedAdvice.supper || !parsedAdvice.foods_to_avoid) {
        return {
          breakfast: data.language === "sw" 
            ? "Unaweza kunywa chai na mkate au kuandaa uji wa wimbi. Viazi vitamu vya kuchemsha na yai ni chaguo nzuri pia. Chakula hiki kitakupa nguvu na kudhibiti sukari."
            : "You can have tea with bread or prepare millet porridge. Boiled sweet potatoes with an egg is also a good choice. This meal will give you energy and help control your sugar.",
          lunch: data.language === "sw"
            ? "Unaweza kula ugali na sukuma wiki pamoja na samaki au nyama. Githeri au maharagwe pia ni vizuri. Mboga na protini zinasaidia kudhibiti sukari."
            : "You can eat ugali with sukuma wiki and fish or meat. Githeri or beans are also good options. Vegetables and protein help control your sugar.",
          supper: data.language === "sw"
            ? "Jioni unaweza kula chakula sawa na mchana lakini kidogo zaidi, au githeri na mboga. Chai na mkate pia ni sawa."
            : "In the evening you can eat similar to lunch but lighter, or githeri with vegetables. Tea with bread is also fine.",
          foods_to_avoid: data.language === "sw"
            ? "Punguza soda, sukari nyingi, na mandazi mara kwa mara. Vyakula hivyo vinaongeza sukari haraka sana."
            : "Reduce soda, excess sugar, and frequent mandazi. These foods raise your sugar very quickly.",
        };
      }

      return parsedAdvice as FoodAdviceResponse;
    } catch (err: any) {
      return {
        breakfast: data.language === "sw" 
          ? "Chai na mkate au uji."
          : "Tea with bread or porridge.",
        lunch: data.language === "sw"
          ? "Ugali na sukuma wiki."
          : "Ugali with sukuma wiki.",
        supper: data.language === "sw"
          ? "Githeri au chakula cha kawaida."
          : "Githeri or regular meal.",
        foods_to_avoid: data.language === "sw"
          ? "Punguza sukari na soda."
          : "Reduce sugar and soda.",
      };
    }
  }

  async generateQuickFoodTips(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return `⚠️ AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const patientName = data.patientName || "Patient";
      const category = getGlucoseCategory(data.glucose, data.context);
      const greeting = getPatientGreeting(patientName, data.language);

      const languageInstruction = data.language === "sw"
        ? `\n\nKiswahili + "unaweza" (you can). MUST start: "${greeting}". Quick and practical: 60-90 words. ENCOURAGING!`
        : `\n\nEnglish + "you can/try". MUST start: "${greeting}". Quick and practical: 60-90 words. ENCOURAGING!`;

      const prompt = `Give 2-3 immediate, practical Kenyan food tips directly to ${patientName}.

PATIENT NAME: ${patientName}
GLUCOSE: ${data.glucose} mg/dL (${data.context}) = ${category.status}
${data.systolic && data.diastolic ? `BP: ${data.systolic}/${data.diastolic} mmHg` : ""}
${data.exerciseRecent ? `Recent Exercise: ${data.exerciseRecent} (${data.exerciseIntensity})` : ""}

REALISTIC KENYAN FOODS: chai, uji, mkate, mandazi, viazi vitamu, arrow roots, ugali, rice, chapati, sukuma wiki, cabbage, githeri, beans, ndengu, beef, chicken, tilafish, omena

Write tips that:
1. MUST start "${greeting}" 
2. Give specific Kenyan foods you can eat RIGHT NOW (realistic for the time of day)
3. What you can do for your next meal with brief reasoning
4. Quick practical tip based on your ${category.status} glucose
5. End with motivating statement

USE:
✓ "You can..." language to ${patientName}
✓ Realistic Kenyan foods (no portions)
✓ Motivating, practical tone
✓ Immediate, achievable actions
✓ 60-90 words (quick and encouraging)${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 220,
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