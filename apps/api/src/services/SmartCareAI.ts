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
- Keep it detailed but concise: 120-180 words
- Focus on what patient CAN do, not restrictions`
        : `\n\nIMPORTANT LANGUAGE & TONE RULES:
- Use English with second-person POV ("you", "your")
- MUST start with "${greeting}"
- Be warm, encouraging, and motivating
- Keep it detailed but concise: 120-180 words
- Focus on empowerment and achievable actions`;

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

TASK: Create a detailed yet concise, motivating summary that:
1. MUST start with "${greeting}" followed by acknowledging their commitment
2. Provide a clear overview of their current health status (be specific with numbers if important)
3. Give 3-4 detailed, actionable food/lifestyle recommendations with WHY they matter
4. Connect the advice to their specific readings and context
5. End with strong encouragement and next steps
6. Uses "you" and "your" throughout (second-person POV)
7. Be detailed but keep it 120-180 words (informative without being overwhelming)
8. Make it feel personal and tailored to ${patientName}

MEDICAL COMMUNICATION STANDARDS:
✓ Patient-centered language
✓ Clear, simple terms (avoid jargon)
✓ Empathetic and non-judgmental
✓ Action-oriented guidance
✓ Respectful and encouraging tone
✓ Include specific details that show you understand their situation${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 400,
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
        ? "\n\nUse Kiswahili and second-person 'wewe' (you). Keep detailed but concise: 50-80 words (2-3 sentences)."
        : "\n\nUse English and second-person 'you/your'. Keep detailed but concise: 50-80 words (2-3 sentences).";

      const prompt = `Provide a detailed but concise clinical summary addressing ${patientName} directly.

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

Write 2-3 sentences that:
1. Address ${patientName} directly and state their glucose status clearly with context
2. Mention other vitals with specific values and what they mean
3. Give ONE specific observation about their overall health picture
4. Use second-person ("you", "your") throughout
5. Be detailed but stay 50-80 words
6. Be factual, specific, yet encouraging${languageInstruction}`;

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
      const patientName = data.patientName || "Patient";
      const category = getGlucoseCategory(data.glucose, data.context);
      const greeting = getPatientGreeting(patientName, data.language);

      const languageInstruction = data.language === "sw"
        ? `\n\nTONE & LANGUAGE:
- Kiswahili ONLY
- Use "wewe/unaweza" (you/you can)
- MUST start: "${greeting}"
- Encouraging, supportive
- Detailed but concise: 80-120 words`
        : `\n\nTONE & LANGUAGE:
- English only
- Use "you/your/you can"
- MUST start: "${greeting}"
- Encouraging, motivating
- Detailed but concise: 80-120 words`;

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

Write 3-4 detailed sentences:
1. MUST start "${greeting}" then explain what your specific glucose reading means in ${data.context} context
2. ${category.needsAction ? "Explain clearly what you need to do and WHY it matters" : "Affirm what you're doing right and encourage you to maintain it"}
3. If other vitals provided, explain how they relate to your glucose
4. Give ONE specific, personalized recommendation with reasoning

COMMUNICATION STANDARDS:
✓ Direct address (you/your) to ${patientName}
✓ Positive framing with specific details
✓ Clear action steps with reasons
✓ Empowering language
✓ Non-judgmental
✓ 80-120 words (detailed but not overwhelming)${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 280,
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
- Detailed but concise: 100-140 words`
        : `\n\nUSE:
- English + "you/your/you can"
- MUST start: "${greeting}"
- Positive, motivating
- Detailed but concise: 100-140 words`;

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

Write 4-5 detailed sentences:
1. MUST start "${greeting}" + acknowledge what ${patientName} is already doing right
2. Explain specifically HOW your lifestyle habits are affecting your glucose levels (be detailed)
3. If vitals show concerns, connect them to lifestyle factors with clear reasoning
4. Give 2 specific, achievable changes you can make with explanation of benefits
5. End with strong encouragement about your ability to improve

PATIENT COMMUNICATION:
✓ "You" language throughout
✓ Celebrate specific wins
✓ Two clear actions with reasoning
✓ Supportive, detailed tone
✓ Build confidence
✓ 100-140 words (informative without overwhelming)${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 320,
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
        ? "\n\nKiswahili + 'unaweza kula' (you can eat). Be detailed and encouraging."
        : "\n\nEnglish + 'you can eat/try'. Be detailed and encouraging.";

      const prompt = `Create detailed Kenyan meal plan addressing ${patientName} directly.

PATIENT NAME: ${patientName}
GLUCOSE: ${data.glucose} mg/dL (${data.context}) = ${category.status}
${data.systolic && data.diastolic ? `BP: ${data.systolic}/${data.diastolic} mmHg` : ""}
${data.age ? `Age: ${data.age}` : ""} ${data.weight ? `Weight: ${data.weight} kg` : ""}
${data.allergies && data.allergies.length > 0 ? `Allergies: ${data.allergies.join(", ")}` : ""}

KENYAN FOODS:
Starches: Ugali (whole maize), arrow roots, sweet potatoes, brown rice, millet
Proteins: Omena, tilapia, beans, ndengu, njahi, kunde, eggs, chicken
Vegetables: Sukuma wiki, managu, terere, kunde leaves, spinach
Fruits: Pawpaw, guava, bananas, oranges, avocado

RESPOND IN JSON:
{
  "breakfast": "YOU CAN START YOUR DAY WITH... (use 'you', be specific with portions, explain why it's good for you, mention 2-3 options, 3-4 sentences)",
  "lunch": "FOR LUNCH, YOU CAN ENJOY... (use 'you', specific Kenyan foods with portions, cooking method, explain benefits, 3-4 sentences)",
  "supper": "YOUR EVENING MEAL CAN INCLUDE... (use 'you', lighter options, portions, why it's appropriate for evening, 3-4 sentences)",
  "foods_to_avoid": "YOU SHOULD LIMIT... (use 'you', explain clearly WHY each food affects your glucose/BP, 2-3 sentences)"
}

RULES:
✓ Use "you" and "your" throughout - address ${patientName} directly
✓ Very encouraging tone ("you can", "try", "enjoy")
✓ Specific portions (half plate, 1 kiganja, 1 bakuli, 2 cups)
✓ Multiple affordable options per meal
✓ Explain WHY foods are good/bad for ${patientName}'s condition
✓ ${category.status === "HIGH" ? "Focus on low GI, high fiber foods" : category.status === "LOW" ? "Include quick and sustained energy foods" : "Balanced nutrition"}
✓ Each meal description: 3-4 detailed sentences${languageInstruction}`;

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
            ? "Unaweza kuanza siku yako na uji wa wimbi (bakuli 1) pamoja na yai la kuchemsha au viazi vitamu (vidogo 2). Chakula hiki kitakupa nguvu pole pole na kutasaidia kudhibiti sukari yako. Ongeza ndizi mbivu kwa ajili ya nguvu zaidi."
            : "You can start your day with millet porridge (1 bowl) and a boiled egg or sweet potato (2 small). This meal will give you steady energy and help control your blood sugar. Add a ripe banana for extra energy.",
          lunch: data.language === "sw"
            ? "Kwa chakula cha mchana, unaweza kufurahia ugali wa mahindi ngano (nusu sahani) na sukuma wiki (rundo moja) pamoja na omena (kiganja 1) au ndengu (kopo 1). Pika kwa kupikia au kuchemsha bila mafuta mengi. Mboga hizi zina fiber nyingi na protein inayosaidia kudhibiti sukari."
            : "For lunch, you can enjoy brown ugali (half plate) with sukuma wiki (1 bunch) and omena (1 handful) or ndengu (1 cup). Cook by steaming or boiling without excess oil. These vegetables have lots of fiber and the protein helps control your sugar.",
          supper: data.language === "sw"
            ? "Jioni, chakula chako kinaweza kuwa na githeri nyepesi (bakuli 1) pamoja na managu au kunde wa kusteam (rundo dogo). Unaweza ongeza parachichi kidogo (nusu). Chakula hiki ni nyepesi kwa tumbo na hakitaongeza sukari usiku."
            : "In the evening, your meal can include light githeri (1 bowl) with steamed managu or kunde (small bunch). You can add a small avocado (half). This meal is light on your stomach and won't spike your sugar at night.",
          foods_to_avoid: data.language === "sw"
            ? "Unapaswa kupunguza mkate mweupe, chapati, na mandazi kwa sababu vinaongeza sukari haraka sana. Epuka pia soda na juisi zenye sukari nyingi. Punguza nyama yenye mafuta mengi na vyakula vilivyokaangwa kwani vinazidisha shinikizo la damu."
            : "You should limit white bread, chapati, and mandazi because they raise your blood sugar very quickly. Also avoid soda and sugary juices. Reduce fatty meat and fried foods as they increase your blood pressure.",
        };
      }

      return parsedAdvice as FoodAdviceResponse;
    } catch (err: any) {
      return {
        breakfast: data.language === "sw" 
          ? "Unaweza kula uji wa wimbi na ndizi au yai."
          : "You can eat millet porridge with banana or egg.",
        lunch: data.language === "sw"
          ? "Unaweza kula ugali wa mahindi ngano na sukuma wiki."
          : "You can eat brown ugali with sukuma wiki.",
        supper: data.language === "sw"
          ? "Unaweza kula githeri na mboga."
          : "You can eat githeri with vegetables.",
        foods_to_avoid: data.language === "sw"
          ? "Punguza sukari, chapati, na mandazi."
          : "Reduce sugar, chapati, and mandazi.",
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
        ? `\n\nKiswahili + "unaweza" (you can). MUST start: "${greeting}". Detailed but quick: 60-90 words. ENCOURAGING!`
        : `\n\nEnglish + "you can/try". MUST start: "${greeting}". Detailed but quick: 60-90 words. ENCOURAGING!`;

      const prompt = `Give 2-3 immediate, detailed Kenyan food tips directly to ${patientName}.

PATIENT NAME: ${patientName}
GLUCOSE: ${data.glucose} mg/dL (${data.context}) = ${category.status}
${data.systolic && data.diastolic ? `BP: ${data.systolic}/${data.diastolic} mmHg` : ""}
${data.exerciseRecent ? `Recent Exercise: ${data.exerciseRecent} (${data.exerciseIntensity})` : ""}

KENYAN FOODS: ugali (brown/whole maize), sukuma wiki, managu, githeri, ndengu, omena, tilapia, viazi vitamu, arrow roots, kunde

Write tips that:
1. MUST start "${greeting}" 
2. Give specific Kenyan foods you can eat RIGHT NOW with portions
3. What you can do for your next meal with reasoning
4. Quick practical tip based on your ${category.status} glucose
5. End with motivating statement

USE:
✓ "You can..." language to ${patientName}
✓ Specific Kenyan foods with portions
✓ Motivating, detailed tone
✓ Practical, immediate actions
✓ 60-90 words (detailed but quick)${languageInstruction}`;

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