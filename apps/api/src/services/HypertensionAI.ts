import Groq from "groq-sdk";
import mongoose from "mongoose";
import HypertensionLifestyle, { ILifestyle } from "../models/hypertensionLifestyle";
import HypertensionVital from "../models/hypertensionVitals";
import Patient from "../models/patient";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = "llama-3.3-70b-versatile"; // High-quality model

// ✅ Generate daily alerts from recent vitals (matching frontend logic)
async function getDailyAlerts(userId: string): Promise<string[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const vitals = await HypertensionVital.find({
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: today, $lt: tomorrow },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  const alerts: string[] = [];
  
  if (vitals.length === 0) {
    alerts.push("No vitals recorded today - please enter your blood pressure readings");
    return alerts;
  }

  // Use the same logic as the frontend alerts.tsx component
  vitals.forEach((vital) => {
    const systolic = Number(vital.systolic);
    const diastolic = Number(vital.diastolic);
    const heartRate = Number(vital.heartRate);

    // Blood pressure alerts (matching frontend logic)
    if (systolic >= 180 || diastolic >= 120) {
      alerts.push(`🚨 HYPERTENSIVE CRISIS: ${systolic}/${diastolic} mmHg - Seek immediate medical attention!`);
    } else if (systolic >= 140 || diastolic >= 90) {
      alerts.push(`⚠️ Stage 2 Hypertension: ${systolic}/${diastolic} mmHg - Consult your doctor soon`);
    } else if (systolic >= 130 || diastolic >= 80) {
      alerts.push(`⚠️ Stage 1 Hypertension: ${systolic}/${diastolic} mmHg - Monitor closely`);
    } else if (systolic >= 120) {
      alerts.push(`📈 Elevated Blood Pressure: ${systolic}/${diastolic} mmHg - Consider lifestyle changes`);
    } else if (systolic < 90 || diastolic < 60) {
      alerts.push(`📉 Low Blood Pressure: ${systolic}/${diastolic} mmHg - Contact healthcare provider if unwell`);
    }

    // Heart rate alerts
    if (heartRate < 60) {
      alerts.push(`💙 Bradycardia: Heart rate ${heartRate} bpm - Low heart rate detected`);
    } else if (heartRate > 100) {
      alerts.push(`❤️ Tachycardia: Heart rate ${heartRate} bpm - Elevated heart rate`);
    }
  });

  if (alerts.length === 0) {
    alerts.push("✅ Vitals stable today - no alerts detected");
  }

  return alerts;
}

// ✅ Fetch current lifestyle
async function getCurrentLifestyle(userId: string) {
  const lifestyle = await HypertensionLifestyle.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ createdAt: -1 })
    .exec();

  return lifestyle
    ? {
        smoking: lifestyle.smoking,
        alcohol: lifestyle.alcohol,
        exercise: lifestyle.exercise,
        sleep: lifestyle.sleep,
      }
    : {
        smoking: "None",
        alcohol: "None",
        exercise: "None",
        sleep: "Irregular",
      };
}

// ✅ Main AI Lifestyle Recommendation Function
export async function generateLifestyleRecommendations(
  userId: string
): Promise<{ advice: string; alerts: string[]; warnings: string[] }> {
  try {
    const alerts = await getDailyAlerts(userId);
    const lifestyle = await getCurrentLifestyle(userId);

    const prompt = `
You are a hypertension management AI assistant. Provide personalized lifestyle recommendations based on the following patient data:

📊 DAILY VITALS ALERTS:
${alerts.join("\n")}

🏃 CURRENT LIFESTYLE:
- Smoking: ${lifestyle.smoking}
- Alcohol: ${lifestyle.alcohol}
- Exercise: ${lifestyle.exercise}
- Sleep: ${lifestyle.sleep}

Please provide recommendations in the following structured format:

GENERAL ADVICE:
Provide 2-3 sentences of empathetic and encouraging advice.

IMMEDIATE ACTIONS:
List 3-4 clear actions to take today based on their vitals.

LIFESTYLE IMPROVEMENTS:
Suggest improvements to smoking, alcohol, exercise, or sleep if needed.

Keep it short, positive, and actionable.
`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    });

    const rawAdvice = completion.choices[0]?.message?.content || getFallbackAdvice();
    const structuredAdvice = parseAndStructureAdvice(rawAdvice);
    const warnings = extractWarnings(lifestyle, alerts);

    await HypertensionLifestyle.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { aiAdvice: structuredAdvice, warnings },
      { new: true, upsert: true }
    );

    console.log("✅ AI lifestyle advice generated via Groq");
    return { advice: structuredAdvice, alerts, warnings };
  } catch (error) {
    console.error("❌ Error generating Groq recommendations:", error);
    return {
      advice: getFallbackAdvice(),
      alerts: await getDailyAlerts(userId),
      warnings: [],
    };
  }
}

// ✅ Helper: Format and structure advice
function parseAndStructureAdvice(rawAdvice: string): string {
  let text = rawAdvice
    .replace(/GENERAL ADVICE:/gi, "💡 KEY INSIGHTS:")
    .replace(/IMMEDIATE ACTIONS:/gi, "\n🎯 TODAY'S ACTION PLAN:")
    .replace(/LIFESTYLE IMPROVEMENTS:/gi, "\n🌟 LIFESTYLE GOALS:")
    .replace(/WEATHER CONSIDERATIONS:/gi, "\n🌤 WEATHER TIPS:");

  if (!text.includes("KEY INSIGHTS")) {
    text = "💡 PERSONALIZED INSIGHTS:\n\n" + text;
  }

  return text.trim();
}

// ✅ Helper: Detect warnings based on lifestyle/vitals
function extractWarnings(lifestyle: any, alerts: string[]): string[] {
  const warnings: string[] = [];

  if (lifestyle.smoking === "Heavy" && alerts.some((a) => a.includes("High")))
    warnings.push("Smoking combined with high BP raises cardiovascular risk.");

  if (lifestyle.alcohol === "Frequently" && alerts.some((a) => a.includes("High")))
    warnings.push("Frequent alcohol use may elevate blood pressure.");

  if (["None", "Rarely"].includes(lifestyle.exercise))
    warnings.push("Lack of physical activity increases hypertension risk.");

  if (["<5 hrs", "Irregular"].includes(lifestyle.sleep))
    warnings.push("Poor sleep can elevate BP. Aim for 7-8 hours per night.");

  const highBPAlerts = alerts.filter(
    (a) => a.includes("High systolic") || a.includes("High diastolic")
  );
  if (highBPAlerts.length >= 2)
    warnings.push("Multiple high readings detected — consult your provider.");

  return warnings;
}

// ✅ Fallback Advice
function getFallbackAdvice(): string {
  return `💡 KEY INSIGHTS:

We're here to support your heart health journey. While we couldn't generate personalized AI recommendations now, here are essential tips:

🎯 TODAY'S ACTION PLAN:
• Monitor BP daily at the same time
• Stay hydrated (6-8 glasses/day)
• Take medications as prescribed
• Practice deep breathing or light meditation

🌟 LIFESTYLE GOALS:
• Reduce salt intake
• Exercise at least 30 mins daily
• Sleep 7-8 hours
• Limit alcohol, avoid smoking

Consistency brings progress 💪`;
}

export async function analyzeVitalsWithAI(input: { vitals: any; activity: any }): Promise<any> {
    const { vitals, activity } = input;

    const prompt = `
        You are an AI medical assistant. Analyze the following patient data to determine if their blood pressure reading is a cause for concern or a normal reaction to their recent activity.

        Patient's Vitals:
        - Systolic: ${vitals.systolic} mmHg
        - Diastolic: ${vitals.diastolic} mmHg
        - Heart Rate: ${vitals.heartRate} bpm

        Patient's Recent Activity:
        - Activity Type: ${activity.activityType}
        - Duration: ${activity.duration} minutes
        - Intensity: ${activity.intensity}
        - Time Since Activity: ${activity.timeSinceActivity} minutes ago
        - Notes: ${activity.notes || "None"}

        Based on this data, provide a JSON response with the following structure:
        {
          "severity": "green" | "yellow" | "red",
          "title": "A short, descriptive title for the analysis",
          "description": "A brief explanation of the situation",
          "recommendation": "A clear, actionable recommendation for the patient",
          "activityInfluence": "How the recent activity is likely influencing the vitals",
          "shouldNotifyDoctor": boolean,
          "confidence": number (from 0 to 100)
        }

        - Use "green" for normal readings.
        - Use "yellow" for readings that are slightly elevated but likely due to activity, or require monitoring.
        - Use "red" for readings that are dangerously high or require immediate attention.
    `;

    try {
        const completion = await groq.chat.completions.create({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: "json_object" },
        });

        const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
        return analysis;
    } catch (error) {
        console.error("Error calling Groq API for vitals analysis:", error);
        // Fallback to a default response in case of an error
        return {
            severity: "yellow",
            title: "Could not analyze vitals",
            description: "There was an error analyzing the vitals data with the AI. Please consult a doctor.",
            recommendation: "Please consult a healthcare professional.",
            activityInfluence: "Unknown",
            shouldNotifyDoctor: true,
            confidence: 0,
        };
    }
}
// ✅ Generate diet recommendations
export async function generateDietRecommendations(userId: string) {
  try {
    // Get current lifestyle data
    const lifestyle = await getCurrentLifestyle(userId);
    
    // Get patient profile (gender and weight)
    const patient = await Patient.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    
    // Get recent vitals first to analyze alerts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vitals = await HypertensionVital.find({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: today, $lt: tomorrow },
    })
    .sort({ createdAt: -1 })
    .limit(5);

    // Generate daily alerts from vitals (using same logic as lifestyle function)
    const alerts = await getDailyAlerts(userId);

    const latestVital = vitals[0];
    const bpStatus = latestVital ? 
      (latestVital.systolic >= 140 || latestVital.diastolic >= 90 ? "High" : 
       latestVital.systolic >= 120 || latestVital.diastolic >= 80 ? "Elevated" : "Normal") : 
      "Not recorded";

    // Get patient demographics
    const gender = patient?.gender || "Not specified";
    const weight = patient?.weight || "Not specified";
    const age = patient?.dob ? computeAge(patient.dob) : "Not specified";

    // Create prompt for diet recommendations (concise output)
    const prompt = `
You are a Kenyan nutritionist specializing in hypertension management. Create a personalized daily diet plan using ONLY authentic Kenyan foods.

Patient Profile:
- Age: ${age}
- Gender: ${gender}
- Weight: ${weight} kg
- Blood Pressure Status: ${bpStatus}
- Today's Alerts: ${alerts.join(', ')}
- Lifestyle Factors: Smoking: ${lifestyle.smoking}, Alcohol: ${lifestyle.alcohol}, Exercise: ${lifestyle.exercise}, Sleep: ${lifestyle.sleep}

IMPORTANT: The AI must FIRST read and analyze the patient's vitals and alerts before providing recommendations. The diet plan should be specifically tailored based on:
1. Today's alert status (high BP, elevated heart rate, etc.)
2. Patient's age, gender, and weight
3. Current lifestyle factors

Create a daily meal plan using ONLY these authentic Kenyan foods:

STARCHES: Ugali (whole maize meal), brown ugali, arrow roots, sweet potatoes (viazi vitamu), cassava (muhogo), millet ugali, sorghum ugali
PROTEINS: Omena (sardines), tilapia, mbuta, beef (nyama ya ng'ombe), chicken (kuku), eggs (mayai), beans (maharagwe), ndengu (green grams), njahi (black beans), kunde, githeri (maize + beans)
VEGETABLES: Sukuma wiki (kale), managu (African nightshade), terere (amaranth), kunde leaves, spinach, cabbage (kabichi), tomatoes (nyanya), onions (vitunguu)
FRUITS: Pawpaw (papai), guava (mapera), bananas (ndizi), oranges (machungwa), passion fruit (maracuja), avocado (parachichi), pineapple (nanasi)
DRINKS: Uji (porridge - millet/wimbi/sorghum), mursik, chai ya tangawizi (ginger tea), water, fermented milk

Provide, with brevity:
1. BREAKFAST: 1-2 items max, short portions
2. LUNCH: 1-2 items max, short portions
3. DINNER: 1-2 items max, short portions
4. SNACKS: up to 2 items
5. General dietary advice: 2 short sentences max

Avoid: pasta, pizza, burgers, foreign foods. Use Kenyan measures (debe, bakuli, kibaba, handful).

Keep each section under 40 words. Format clearly with each meal section.`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 450,
    });

    const rawData = completion.choices[0]?.message?.content || "";
    
    console.log("Raw AI diet response:", rawData); // Debug log
    
    // Parse the raw response into structured format
    const dietData = parseDietResponse(rawData);

    // Enforce brevity safeguards
    const limit = (t: string, n = 220) => (t && t.length > n ? t.slice(0, n).trimEnd() + '…' : t);
    const conciseDiet = {
      breakfast: limit(dietData.breakfast),
      lunch: limit(dietData.lunch),
      dinner: limit(dietData.dinner),
      snacks: limit(dietData.snacks),
      generalAdvice: limit(dietData.generalAdvice, 200),
      calorieTarget: dietData.calorieTarget,
    };
    
    console.log("Parsed diet data:", dietData); // Debug log
    
    // Save to database
    await HypertensionLifestyle.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { 
        dietData: conciseDiet,
        dietUpdatedAt: new Date() 
      },
      { new: true, upsert: true }
    );

    console.log("✅ Diet recommendations generated via Groq");
    return conciseDiet;
  } catch (error) {
    console.error("❌ Error generating diet recommendations:", error);
    return {
      breakfast: "Maziwa lala with mkate wa maharage and bananas",
      lunch: "Sukuma wiki with lean proteins and small portion of ugali",
      dinner: "Fish with traditional vegetables",
      snacks: "Fresh fruits or boiled maize",
      generalAdvice: "Focus on traditional Kenyan foods with less salt and more vegetables.",
      calorieTarget: 2000,
    };
  }
}

// ✅ Helper: Compute age from DOB
function computeAge(dob: string | Date): number {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ✅ Helper: Parse diet response from AI
function parseDietResponse(rawResponse: string) {
  // Default fallback
  const defaultDiet = {
    breakfast: "Maziwa lala with mkate wa maharage and bananas",
    lunch: "Sukuma wiki with lean proteins and small portion of ugali",
    dinner: "Fish with traditional vegetables",
    snacks: "Fresh fruits or boiled maize",
    generalAdvice: "Focus on traditional Kenyan foods with less salt and more vegetables.",
    calorieTarget: 2000,
  };

  if (!rawResponse || rawResponse.trim().length === 0) {
    console.log("No raw response received, using default diet");
    return defaultDiet;
  }

  try {
    console.log("Parsing diet response:", rawResponse.substring(0, 300) + "...");

    // Handle inline headers like "content **LUNCH**: more content"
    // First, identify and mark all section headers, then extract content between them
    
    // Normalize text first
    let normalizedText = rawResponse
      .replace(/\bSUPPER\b/gi, 'DINNER')
      .replace(/\d+\.?\s*/gi, ''); // Remove numbering
    
    const result: { [key: string]: string } = {};
    
    // Find all section markers and their positions
    const sectionPattern = /\*\*\s*(BREAKFAST|LUNCH|DINNER|SUPPER|SNACKS|ADVICE|GENERAL\s*ADVICE)\s*\*\*/gi;
    const sections: Array<{name: string, pos: number, length: number}> = [];
    let match;
    
    while ((match = sectionPattern.exec(normalizedText)) !== null) {
      if (match && match[1]) {
        const name = match[1].toUpperCase().replace('SUPPER', 'DINNER').replace(/\s*ADVICE/i, 'ADVICE');
        sections.push({ name, pos: match.index, length: match[0].length });
      }
    }
    
    // If no bold headers found, try plain headers
    if (sections.length === 0) {
      const plainPattern = /\b(BREAKFAST|LUNCH|DINNER|SUPPER|SNACKS|ADVICE|GENERAL\s*ADVICE)\s*:?/gi;
      while ((match = plainPattern.exec(normalizedText)) !== null) {
        if (match && match[1]) {
          const name = match[1].toUpperCase().replace('SUPPER', 'DINNER').replace(/\s*ADVICE/i, 'ADVICE');
          sections.push({ name, pos: match.index, length: match[0].length });
        }
      }
    }
    
    // Extract content between sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nextSection = sections[i + 1];
      const startPos = section.pos + section.length;
      const endPos = nextSection ? nextSection.pos : normalizedText.length;
      
      let content = normalizedText.substring(startPos, endPos)
        .replace(/\*\*\s*(BREAKFAST|LUNCH|DINNER|SNACKS|ADVICE)\s*\*\*/gi, '')
        .replace(/\b(BREAKFAST|LUNCH|DINNER|SNACKS|ADVICE)\s*:?\s*/gi, '')
        .trim();
      
      // Remove any trailing header markers that might have been included
      content = content.replace(/^\*\*.*?\*\*\s*/, '').trim();
      
      if (content && content.length > 0) {
        const key = section.name === 'ADVICE' || section.name.includes('ADVICE') ? 'generalAdvice' : section.name.toLowerCase();
        if (!result[key]) {
          result[key] = content.replace(/\s+/g, ' ');
        }
      }
    }
    
    // Special case: content before first header (usually BREAKFAST)
    if (sections.length > 0 && !result.breakfast) {
      const firstSection = sections[0];
      const beforeFirst = normalizedText.substring(0, firstSection.pos)
        .replace(/\*\*\s*BREAKFAST\s*\*\*\s*:?/gi, '')
        .replace(/\bBREAKFAST\s*:?\s*/gi, '')
        .trim();
      
      if (beforeFirst && beforeFirst.length > 5 && !beforeFirst.match(/\*\*(LUNCH|DINNER|SNACKS|ADVICE)\*\*/i)) {
        result.breakfast = beforeFirst.replace(/\s+/g, ' ');
      }
    }

    const dietData = {
      breakfast: result.breakfast || defaultDiet.breakfast,
      lunch: result.lunch || defaultDiet.lunch,
      dinner: result.dinner || defaultDiet.dinner,
      snacks: result.snacks || defaultDiet.snacks,
      generalAdvice: result.generalAdvice || defaultDiet.generalAdvice,
      calorieTarget: defaultDiet.calorieTarget,
    };

    console.log("Successfully parsed diet data:", dietData);
    return dietData;
  } catch (error) {
    console.error("Error parsing diet response:", error);
    console.log("Raw response that failed to parse:", rawResponse);
    return defaultDiet;
  }
}

// ✅ Update Lifestyle + Regenerate AI
export async function updateLifestyle(
  userId: string,
  updates: { alcohol?: string; smoking?: string; exercise?: string; sleep?: string }
): Promise<ILifestyle | null> {
  try {
    const validAlcohol = ["None", "Occasionally", "Frequently"];
    const validSmoking = ["None", "Light", "Heavy"];
    const validExercise = ["Daily", "Few times/week", "Rarely", "None"];
    const validSleep = ["<5 hrs", "6-7 hrs", "7-8 hrs", ">8 hrs", "Irregular"];

    if (updates.alcohol && !validAlcohol.includes(updates.alcohol))
      throw new Error("Invalid alcohol value");
    if (updates.smoking && !validSmoking.includes(updates.smoking))
      throw new Error("Invalid smoking value");
    if (updates.exercise && !validExercise.includes(updates.exercise))
      throw new Error("Invalid exercise value");
    if (updates.sleep && !validSleep.includes(updates.sleep))
      throw new Error("Invalid sleep value");

    const updated = await HypertensionLifestyle.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { ...updates, updatedAt: new Date() },
      { new: true, upsert: true }
    ).exec();

    if (updated) {
      console.log("🔄 Regenerating lifestyle advice via Groq...");
      await generateLifestyleRecommendations(userId);
    }

    return updated;
  } catch (error) {
    console.error("❌ Error updating lifestyle:", error);
    return null;
  }
}

// ✅ Generate medication interactions
export async function generateMedicationInteractions(
  medications: Array<{ name: string; dosage: string; frequency: string }>,
  context?: { age?: number; condition?: string }
) {
  try {
    // Create prompt for medication interaction analysis
    const medicationList = medications.map(med => 
      `${med.name} (${med.dosage} - ${med.frequency})`
    ).join(", ");
    
    const conditionText = context?.condition || "Hypertension";
    const ageText = context?.age ? `Patient Age: ${context.age}` : "";

    const prompt = `
You are a healthcare AI assistant specializing in medication safety. Analyze the following medications for potential interactions, side effects, and safety concerns:

MEDICATIONS TO ANALYZE:
${medicationList}

Clinical Context:
- Primary condition: ${conditionText}
${ageText ? `- ${ageText}` : ""}

Please provide a comprehensive analysis covering:
1. Major interactions between medications
2. Common side effects
3. Safety precautions
4. When to seek medical attention
5. Recommendations for monitoring

Format your response clearly with these sections:
🔍 INTERACTION ANALYSIS:
[Details about medication interactions]

⚠️ POTENTIAL SIDE EFFECTS:
[Common side effects to watch for]

🛡️ SAFETY PRECAUTIONS:
[Important safety measures]

🆘 WHEN TO SEEK HELP:
[Red flags requiring medical attention]

📊 MONITORING RECOMMENDATIONS:
[What to monitor and how often]

Keep your response professional, evidence-based, and easy to understand for patients.
`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    const analysis = completion.choices[0]?.message?.content || 
      "Unable to analyze medication interactions at this time. Please consult with your healthcare provider.";

    console.log("✅ Medication interactions generated via Groq");
    return analysis;
  } catch (error) {
    console.error("❌ Error generating medication interactions:", error);
    return "Unable to analyze medication interactions due to a technical error. Please contact your healthcare provider for medication safety information.";
  }
}
