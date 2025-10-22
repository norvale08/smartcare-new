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

We’re here to support your heart health journey. While we couldn’t generate personalized AI recommendations now, here are essential tips:

🎯 TODAY'S ACTION PLAN:
• Monitor BP daily at the same time
• Stay hydrated (6–8 glasses/day)
• Take medications as prescribed
• Practice deep breathing or light meditation

🌟 LIFESTYLE GOALS:
• Reduce salt intake
• Exercise at least 30 mins daily
• Sleep 7–8 hours
• Limit alcohol, avoid smoking

Consistency brings progress 💪`;
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

    // Create prompt for diet recommendations
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

Provide:
1. BREAKFAST with Kenyan foods and portion
2. LUNCH with Kenyan foods and portion
3. DINNER with Kenyan foods and portion
4. SNACKS with Kenyan foods
5. General dietary advice for hypertension management

DO NOT suggest: pasta, rice (unless specified), pizza, burgers, or foreign foods.
Use Kenyan measurements: debe, bakuli, kibaba, handful (kiganja).

Format the response clearly with each meal section.`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const rawData = completion.choices[0]?.message?.content || "";
    
    console.log("Raw AI diet response:", rawData); // Debug log
    
    // Parse the raw response into structured format
    const dietData = parseDietResponse(rawData);
    
    console.log("Parsed diet data:", dietData); // Debug log
    
    // Save to database
    await HypertensionLifestyle.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { 
        dietData,
        dietUpdatedAt: new Date() 
      },
      { new: true, upsert: true }
    );

    console.log("✅ Diet recommendations generated via Groq");
    return dietData;
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
    console.log("Parsing diet response:", rawResponse.substring(0, 200) + "...");
    
    // More flexible regex patterns to catch different formats
    const breakfastMatch = rawResponse.match(/(?:BREAKFAST|1\.?\s*BREAKFAST)[^:]*:?\s*(.*?)(?=\n\s*(?:LUNCH|2\.?\s*LUNCH|DINNER|3\.?\s*DINNER|SNACKS|4\.?\s*SNACKS)|$)/is);
    const lunchMatch = rawResponse.match(/(?:LUNCH|2\.?\s*LUNCH)[^:]*:?\s*(.*?)(?=\n\s*(?:DINNER|3\.?\s*DINNER|SNACKS|4\.?\s*SNACKS)|$)/is);
    const dinnerMatch = rawResponse.match(/(?:DINNER|3\.?\s*DINNER)[^:]*:?\s*(.*?)(?=\n\s*(?:SNACKS|4\.?\s*SNACKS)|$)/is);
    const snacksMatch = rawResponse.match(/(?:SNACKS|4\.?\s*SNACKS)[^:]*:?\s*(.*?)(?=\n\s*(?:ADVICE|5\.?\s*ADVICE|General|Dietary)|$)/is);
    const adviceMatch = rawResponse.match(/(?:ADVICE|5\.?\s*ADVICE|General.*?ADVICE|Dietary.*?ADVICE)[^:]*:?\s*(.*?)(?=\n\n|\n\n\n|$)/is);

    const dietData = {
      breakfast: breakfastMatch ? breakfastMatch[1].trim().replace(/\n/g, ' ') : defaultDiet.breakfast,
      lunch: lunchMatch ? lunchMatch[1].trim().replace(/\n/g, ' ') : defaultDiet.lunch,
      dinner: dinnerMatch ? dinnerMatch[1].trim().replace(/\n/g, ' ') : defaultDiet.dinner,
      snacks: snacksMatch ? snacksMatch[1].trim().replace(/\n/g, ' ') : defaultDiet.snacks,
      generalAdvice: adviceMatch ? adviceMatch[1].trim().replace(/\n/g, ' ') : defaultDiet.generalAdvice,
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
