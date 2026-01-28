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
  selectedDiseases?: ("diabetes" | "hypertension")[]; // NEW
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
  selectedDiseases?: ("diabetes" | "hypertension")[]; // NEW
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
  selectedDiseases?: ("diabetes" | "hypertension")[]; // NEW
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

// NEW: Blood pressure categorization
function getBloodPressureCategory(systolic?: number, diastolic?: number) {
  if (!systolic || !diastolic) {
    return { status: "UNKNOWN", severity: "NEUTRAL", needsAction: false };
  }
  
  if (systolic >= 180 || diastolic >= 120) {
    return { status: "HYPERTENSIVE CRISIS", severity: "CRITICAL", needsAction: true };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { status: "HIGH", severity: "WARNING", needsAction: true };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { status: "ELEVATED", severity: "CAUTION", needsAction: true };
  }
  return { status: "NORMAL", severity: "GOOD", needsAction: false };
}

// NEW: Determine disease focus (only diabetes or diabetes+hypertension)
function getDiseaseContext(selectedDiseases?: ("diabetes" | "hypertension")[]): {
  hasDiabetes: boolean;
  hasHypertension: boolean;
  isBoth: boolean;
  focusText: string;
} {
  // Default is diabetes only
  if (!selectedDiseases || selectedDiseases.length === 0) {
    return {
      hasDiabetes: true,
      hasHypertension: false,
      isBoth: false,
      focusText: "diabetes management"
    };
  }
  
  const hasDiabetes = selectedDiseases.includes("diabetes");
  const hasHypertension = selectedDiseases.includes("hypertension");
  
  // Only two valid cases: diabetes alone OR diabetes + hypertension
  const isBoth = hasDiabetes && hasHypertension;
  
  let focusText = "";
  if (isBoth) {
    focusText = "diabetes AND hypertension management";
  } else {
    // Default to diabetes if only diabetes is selected
    focusText = "diabetes management";
  }
  
  return { 
    hasDiabetes: true, // Always true since we only have diabetes or diabetes+hypertension
    hasHypertension, 
    isBoth, 
    focusText 
  };
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
      
    } catch (error: any) {
      this.apiKeyError = `Failed to initialize Groq: ${error.message}`;
      console.error("❌", this.apiKeyError);
    }
  }

  private checkApiKey(): boolean {
    if (this.apiKeyError || !this.groq) {
      console.error(" Cannot use AI - API key issue:", this.apiKeyError);
      return false;
    }
    return true;
  }

  async generateComprehensiveFeedback(data: ComprehensiveFeedbackInput): Promise<string> {
    if (!this.checkApiKey()) {
      return ` AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const patientName = data.patientName || data.patientData?.patientName || "Patient";
      const greeting = getPatientGreeting(patientName, data.language);
      const diseaseContext = getDiseaseContext(data.selectedDiseases);
      
      const languageInstruction = data.language === "sw"
        ? `\n\nIMPORTANT LANGUAGE & TONE RULES:
- Use ONLY Kiswahili language (no English except medical terms)
- Address patient directly using "wewe" (you)
- MUST start with "${greeting}" 
- Be warm, encouraging, and supportive
- Keep it detailed: 150-200 words
- Focus on what patient CAN do, not restrictions
- Include specific medical insights about their readings FOR ${diseaseContext.focusText.toUpperCase()}`
        : `\n\nIMPORTANT LANGUAGE & TONE RULES:
- Use English with second-person POV ("you", "your")
- MUST start with "${greeting}"
- Be warm, encouraging, and motivating
- Keep it detailed: 150-200 words
- Focus on empowerment and achievable actions
- Include specific medical insights about their readings FOR ${diseaseContext.focusText.toUpperCase()}`;

      const prompt = `You are a compassionate healthcare provider giving ${diseaseContext.focusText} feedback.

PATIENT NAME: ${patientName}
DISEASE FOCUS: ${diseaseContext.focusText.toUpperCase()}
${diseaseContext.isBoth ? " DUAL CONDITION: Address BOTH diabetes AND hypertension together!" : ""}

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
1. MUST start with "${greeting}" followed by acknowledging their commitment to managing ${diseaseContext.focusText}
2. Provide a clear overview of their current health status with specific numbers and medical significance for ${diseaseContext.isBoth ? "BOTH conditions" : "their condition"}
3. Explain what their readings mean for their body and long-term health ${diseaseContext.isBoth ? "(address glucose AND blood pressure together)" : ""}
4. Give 4-5 detailed, actionable food/lifestyle recommendations with clear explanations of WHY they matter for ${diseaseContext.focusText}
5. Connect the advice to their specific readings and how it will improve their ${diseaseContext.isBoth ? "blood sugar AND blood pressure" : diseaseContext.hasDiabetes ? "blood sugar" : "blood pressure"}
6. Include positive medical aspects - what they're doing right physiologically
7. End with strong encouragement about achievable health improvements
8. Uses "you" and "your" throughout (second-person POV)
9. Be detailed and informative: 150-200 words
10. Make it feel personal and tailored to ${patientName}

${diseaseContext.isBoth ? `
CRITICAL FOR DUAL CONDITIONS:
- Mention how food/lifestyle affects BOTH glucose AND blood pressure
- Explain the connection between diabetes and hypertension
- Give advice that benefits BOTH conditions simultaneously
` : diseaseContext.hasHypertension ? `
FOCUS ON HYPERTENSION:
- Emphasize blood pressure management
- Discuss sodium intake, stress, and cardiovascular health
- Explain how lifestyle affects blood pressure specifically
` : `
FOCUS ON DIABETES:
- Emphasize glucose control and insulin sensitivity
- Discuss carbohydrate management and energy balance
- Explain how lifestyle affects blood sugar specifically
`}

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
      return text.trim() || " No feedback available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  async generateSummary(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return ` AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const patientName = data.patientName || "Patient";
      const glucoseCategory = getGlucoseCategory(data.glucose, data.context);
      const bpCategory = getBloodPressureCategory(data.systolic, data.diastolic);
      const diseaseContext = getDiseaseContext(data.selectedDiseases);

      let bpInfo = "No blood pressure recorded";
      if (data.systolic && data.diastolic) {
        bpInfo = `${data.systolic}/${data.diastolic} mmHg (${bpCategory.status})`;
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

      const prompt = `Provide a detailed clinical summary addressing ${patientName} directly for ${diseaseContext.focusText}.

PATIENT NAME: ${patientName}
DISEASE FOCUS: ${diseaseContext.focusText.toUpperCase()}

GLUCOSE THRESHOLDS:
- LOW: < 70 mg/dL (Critical)
- FASTING: Normal ≤125, High >125
- POST-MEAL: Normal ≤180, High >180  
- RANDOM: Normal ≤200, High >200

BLOOD PRESSURE THRESHOLDS:
- NORMAL: <120/80
- ELEVATED: 120-129/<80
- HIGH: ≥130/80 or ≥140/90
- CRISIS: ≥180/120

YOUR DATA:
- Glucose: ${data.glucose} mg/dL (${data.context}) - ${glucoseCategory.status}
- Blood Pressure: ${bpInfo} - ${bpCategory.status}
- Heart Rate: ${hrInfo}
${data.age ? `- Age: ${data.age}` : ""}
${data.weight ? `- Weight: ${data.weight} kg` : ""}

Write 3-4 detailed sentences that:
1. Address ${patientName} directly and state their ${diseaseContext.isBoth ? "glucose AND blood pressure status" : diseaseContext.hasDiabetes ? "glucose status" : "blood pressure status"} clearly with medical context
2. Explain what their specific number(s) mean for their body and health ${diseaseContext.isBoth ? "(for BOTH conditions)" : ""}
3. Mention ${diseaseContext.isBoth ? "how these readings interact and affect overall cardiovascular and metabolic health" : diseaseContext.hasHypertension ? "cardiovascular implications" : "metabolic health implications"}
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
      return text.trim() || " No summary available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  async generateGlucoseFeedback(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return ` AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const patientName = data.patientName || "Patient";
      const glucoseCategory = getGlucoseCategory(data.glucose, data.context);
      const bpCategory = getBloodPressureCategory(data.systolic, data.diastolic);
      const greeting = getPatientGreeting(patientName, data.language);
      const diseaseContext = getDiseaseContext(data.selectedDiseases);

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

      const prompt = `Detailed health analysis speaking directly to ${patientName} for ${diseaseContext.focusText}.

PATIENT NAME: ${patientName}
DISEASE FOCUS: ${diseaseContext.focusText.toUpperCase()}

THRESHOLDS:
GLUCOSE:
- LOW: <70 → Immediate action
- FASTING: Normal ≤125, High >125
- POST-MEAL: Normal ≤180, High >180
- RANDOM: Normal ≤200, High >200

BLOOD PRESSURE:
- NORMAL: <120/80
- ELEVATED: 120-129/<80
- HIGH: ≥130/80 or ≥140/90
- CRISIS: ≥180/120

YOUR READING:
Glucose: ${data.glucose} mg/dL (${data.context}) = ${glucoseCategory.status}
${diseaseContext.isBoth && data.systolic && data.diastolic ? `Blood Pressure: ${data.systolic}/${data.diastolic} mmHg = ${bpCategory.status}` : ""}
${diseaseContext.isBoth && data.systolic && data.diastolic ? ` Managing BOTH: Glucose ${glucoseCategory.status}, BP ${bpCategory.status}` : ""}
${data.heartRate ? `Heart Rate: ${data.heartRate} bpm` : ""}
${data.exerciseRecent ? `Recent Exercise: ${data.exerciseRecent} (${data.exerciseIntensity})` : ""}

Write 4-5 detailed sentences:
1. MUST start "${greeting}" then explain what your specific glucose reading${diseaseContext.isBoth ? " and blood pressure" : ""} mean medically
2. Explain the physiological significance - what's happening in your body ${diseaseContext.isBoth ? "(address metabolic AND cardiovascular effects together)" : "(focus on metabolic health and glucose control)"}
3. ${glucoseCategory.needsAction || bpCategory.needsAction ? "Explain clearly what you need to do, WHY it matters for your health, and the medical benefits" : "Affirm what you're doing right physiologically and encourage you to maintain it"}
4. ${diseaseContext.isBoth ? "Explain how diabetes and hypertension interact in your body and why managing both together is crucial for your heart and blood vessels" : "Focus on diabetes-specific impacts on your energy, organs, and long-term health"}
5. Give 2 specific, personalized recommendations with clear medical reasoning for ${diseaseContext.focusText}

${diseaseContext.isBoth ? `
CRITICAL FOR DUAL CONDITIONS (DIABETES + HYPERTENSION):
- Address BOTH glucose AND blood pressure together
- Explain the synergistic risk of having both conditions on cardiovascular health
- Give recommendations that benefit BOTH simultaneously (exercise, diet, stress management)
- Mention increased risk for heart disease, stroke, kidney disease when both are present
` : `
DIABETES ONLY FOCUS:
- Emphasize metabolic health and insulin function
- Discuss glucose control and energy management
- Explain blood sugar impact on organs, nerves, and long-term complications
- Focus on carbohydrate management, physical activity, and consistent eating patterns
`}

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
      return text.trim() || " No feedback available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  async generateLifestyleFeedback(data: LifestyleAIInput & VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return ` AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const patientName = data.patientName || "Patient";
      const glucoseCategory = getGlucoseCategory(data.glucose, data.context);
      const bpCategory = getBloodPressureCategory(data.systolic, data.diastolic);
      const greeting = getPatientGreeting(patientName, data.language);
      const diseaseContext = getDiseaseContext(data.selectedDiseases);

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

      const prompt = `Detailed lifestyle guidance addressing ${patientName} directly for ${diseaseContext.focusText}.

PATIENT NAME: ${patientName}
DISEASE FOCUS: ${diseaseContext.focusText.toUpperCase()}

YOUR STATUS:
- Glucose: ${data.glucose} mg/dL (${data.context}) = ${glucoseCategory.status}
${diseaseContext.isBoth && data.systolic && data.diastolic ? `- Blood Pressure: ${data.systolic}/${data.diastolic} mmHg = ${bpCategory.status}` : ""}
${data.heartRate ? `- Heart Rate: ${data.heartRate} bpm` : ""}
${data.age ? `- Age: ${data.age}` : ""}
${data.weight ? `- Weight: ${data.weight} kg` : ""}

YOUR LIFESTYLE:
- Alcohol: ${data.lifestyle.alcohol ?? "N/A"}
- Smoking: ${data.lifestyle.smoking ?? "N/A"}
- Exercise: ${data.lifestyle.exercise ?? "N/A"}
- Sleep: ${data.lifestyle.sleep ?? "N/A"}

Write 5-6 detailed sentences:
1. MUST start "${greeting}" + acknowledge what ${patientName} is already doing right with medical benefits for ${diseaseContext.focusText}
2. Explain specifically HOW your lifestyle habits are affecting your glucose levels${diseaseContext.isBoth ? " AND blood pressure" : ""} physiologically (be detailed with medical reasoning)
3. ${diseaseContext.isBoth ? "Address the dual impact - how lifestyle affects BOTH metabolic and cardiovascular health simultaneously (e.g., exercise improves insulin sensitivity AND lowers blood pressure)" : "Focus on how lifestyle choices affect your blood sugar control, insulin sensitivity, and diabetes-related health outcomes"}
4. Highlight any positive physiological indicators from their lifestyle choices
5. Give 2-3 specific, achievable changes you can make with detailed explanation of health benefits for ${diseaseContext.focusText}
6. End with strong encouragement about your body's ability to respond positively to these changes

${diseaseContext.isBoth ? `
DUAL CONDITION LIFESTYLE GUIDANCE (DIABETES + HYPERTENSION):
- Show how lifestyle changes benefit BOTH conditions simultaneously
- Emphasize synergistic effects (e.g., exercise lowers glucose AND BP, stress management helps both)
- Address compound cardiovascular and metabolic risks but frame positively
- Focus on: regular exercise, low-sodium + low-sugar diet, stress reduction, quality sleep, limiting alcohol
` : `
DIABETES ONLY LIFESTYLE GUIDANCE:
- Focus on activity levels, consistent meal timing, carbohydrate management
- Discuss sleep impact on insulin sensitivity and glucose control
- Emphasize blood sugar-friendly habits: regular physical activity, balanced meals, stress management
- Address how alcohol and smoking affect glucose regulation
`}

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
      return text.trim() || " No lifestyle advice available.";
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
      const glucoseCategory = getGlucoseCategory(data.glucose, data.context);
      const bpCategory = getBloodPressureCategory(data.systolic, data.diastolic);
      const diseaseContext = getDiseaseContext(data.selectedDiseases);

      const languageInstruction = data.language === "sw"
        ? "\n\nKiswahili + 'unaweza kula' (you can eat). Be realistic and encouraging. NO PORTIONS."
        : "\n\nEnglish + 'you can eat/try'. Be realistic and encouraging. NO PORTIONS.";

      const prompt = `Create realistic Kenyan meal plan addressing ${patientName} directly for ${diseaseContext.focusText}.

PATIENT NAME: ${patientName}
DISEASE FOCUS: ${diseaseContext.focusText.toUpperCase()}

GLUCOSE: ${data.glucose} mg/dL (${data.context}) = ${glucoseCategory.status}
${diseaseContext.isBoth && data.systolic && data.diastolic ? `BP: ${data.systolic}/${data.diastolic} mmHg = ${bpCategory.status}` : ""}
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

${diseaseContext.isBoth ? `
⚠️ CRITICAL - DUAL CONDITION RECOMMENDATIONS (DIABETES + HYPERTENSION):
- Prioritize foods that benefit BOTH glucose control AND blood pressure
- Low sodium + low glycemic index foods are essential
- Emphasize: vegetables (sukuma, managu, cabbage), lean proteins (fish, chicken), whole grains (brown ugali, arrow roots), potassium-rich foods (bananas, avocado, beans)
- Avoid: high sodium (processed meats, excess salt) AND high sugar foods (soda, excess mandazi, white ugali)
- Explain benefits for BOTH conditions in each meal description
- Focus on cardiovascular AND metabolic health together
` : `
DIABETES ONLY RECOMMENDATIONS:
- Focus on LOW GLYCEMIC INDEX options that stabilize blood sugar
- Complex carbs: brown ugali, brown rice, arrow roots, sweet potatoes (in moderation)
- High fiber: vegetables (sukuma wiki, cabbage, managu), beans, ndengu, whole grains
- Lean proteins: fish (tilapia, omena), chicken, eggs, beans
- Limit: white ugali, white rice, sugary drinks, excess mandazi, processed foods
- Explain glucose control benefits and how foods affect blood sugar
`}

RESPOND IN JSON:
{
  "breakfast": "YOU CAN HAVE... (realistic Kenyan breakfast for ${diseaseContext.focusText}, explain why good, 2-3 sentences, NO PORTIONS)",
  "lunch": "FOR LUNCH, TRY... (realistic Kenyan lunch for ${diseaseContext.focusText}, explain benefits, 2-3 sentences, NO PORTIONS)",
  "supper": "IN THE EVENING, YOU CAN ENJOY... (realistic dinner for ${diseaseContext.focusText}, explain why appropriate, 2-3 sentences, NO PORTIONS)",
  "foods_to_avoid": "IT'S BETTER TO LIMIT... (foods that affect ${diseaseContext.focusText}, explain WHY briefly, 2 sentences, NO PORTIONS)"
}

CRITICAL RULES:
✓ Use "you" and "your" throughout - address ${patientName} directly
✓ Encouraging tone ("you can", "try", "enjoy")
✓ NO PORTIONS - just list realistic food options
✓ Be realistic about what Kenyans actually eat for each meal time
✓ DON'T recommend ugali for breakfast - that's unrealistic
✓ Multiple affordable, common options per meal
✓ Brief explanation of WHY foods are good/bad for ${diseaseContext.focusText}
✓ ${diseaseContext.isBoth ? "Emphasize foods that benefit BOTH conditions!" : ""}
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

      return {
        breakfast: parsedAdvice.breakfast || " Breakfast advice unavailable",
        lunch: parsedAdvice.lunch || " Lunch advice unavailable",
        supper: parsedAdvice.supper || " Supper advice unavailable",
        foods_to_avoid: parsedAdvice.foods_to_avoid || " Foods to avoid list unavailable",
      };
    } catch (err: any) {
      console.error("Food advice error:", err);
      throw new Error(this.handleAIError(err));
    }
  }

  async generateQuickTips(data: VitalsData): Promise<string> {
    if (!this.checkApiKey()) {
      return ` AI temporarily unavailable: ${this.apiKeyError}`;
    }

    try {
      const patientName = data.patientName || "Patient";
      const glucoseCategory = getGlucoseCategory(data.glucose, data.context);
      const bpCategory = getBloodPressureCategory(data.systolic, data.diastolic);
      const diseaseContext = getDiseaseContext(data.selectedDiseases);

      const languageInstruction = data.language === "sw"
        ? "\n\nKiswahili + 'unaweza' (you can). Be encouraging and specific with medical benefits. 60-90 words."
        : "\n\nEnglish + 'you can'. Be encouraging and specific with medical benefits. 60-90 words.";

      const prompt = `Give 3 quick, actionable tips addressing ${patientName} directly for ${diseaseContext.focusText}.

PATIENT: ${patientName}
DISEASE FOCUS: ${diseaseContext.focusText.toUpperCase()}

STATUS:
- Glucose: ${data.glucose} mg/dL (${data.context}) = ${glucoseCategory.status}
${diseaseContext.isBoth && data.systolic && data.diastolic ? `- BP: ${data.systolic}/${data.diastolic} mmHg = ${bpCategory.status}` : ""}

Provide 3 specific tips that:
1. Address immediate priorities based on readings for ${diseaseContext.focusText}
2. Are simple, realistic actions you can take today
3. Include WHY each tip helps (medical benefit)
4. Use "you" language throughout
5. ${diseaseContext.isBoth ? "Address BOTH glucose AND blood pressure together when relevant" : "Focus on diabetes-specific benefits"}
6. Be encouraging and detailed: 60-90 words total${languageInstruction}`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 220,
      });

      const text = completion.choices[0]?.message?.content || "";
      return text.trim() || " No quick tips available.";
    } catch (err: any) {
      return this.handleAIError(err);
    }
  }

  private handleAIError(err: any): string {
    console.error(" AI Error:", err);

    if (err.message?.includes("API key")) {
      return " AI service authentication failed. Please check configuration.";
    }

    if (err.message?.includes("rate limit") || err.status === 429) {
      return " AI service temporarily busy. Please try again in a moment.";
    }

    if (err.message?.includes("timeout") || err.code === "ETIMEDOUT") {
      return " AI service took too long to respond. Please try again.";
    }

    if (err.status === 503 || err.message?.includes("unavailable")) {
      return "AI service temporarily unavailable. Please try again shortly.";
    }

    return " AI feedback temporarily unavailable. Please try again.";
  }
}