import Groq from "groq-sdk";
import mongoose from "mongoose";
import HypertensionLifestyle, { ILifestyle } from "../models/hypertensionLifestyle";
import HypertensionVital from "../models/hypertensionVitals";
import Patient from "../models/patient";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = "llama-3.3-70b-versatile"; // High-quality model

// ✅ Generate daily alerts from recent vitals (matching frontend logic)
async function getDailyAlerts(userId: string, language: string = "en-US"): Promise<string[]> {
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
    alerts.push(language === "sw-TZ" 
      ? "Hakuna vitali zilizorekodiwa leo - tafadhali weka usomaji wako wa shinikizo la damu"
      : "No vitals recorded today - please enter your blood pressure readings"
    );
    return alerts;
  }

  // Use the same logic as the frontend alerts.tsx component
  vitals.forEach((vital) => {
    const systolic = Number(vital.systolic);
    const diastolic = Number(vital.diastolic);
    const heartRate = Number(vital.heartRate);

    // Blood pressure alerts (matching frontend logic)
    if (systolic >= 180 || diastolic >= 120) {
      alerts.push(language === "sw-TZ"
        ? `🚨 MGONGANO WA SHINIKIZO LA DAMU: ${systolic}/${diastolic} mmHg - Tafuta huduma ya matibabu haraka!`
        : `🚨 HYPERTENSIVE CRISIS: ${systolic}/${diastolic} mmHg - Seek immediate medical attention!`
      );
    } else if (systolic >= 140 || diastolic >= 90) {
      alerts.push(language === "sw-TZ"
        ? `⚠️ Hatua ya 2 ya Shinikizo la Juu la Damu: ${systolic}/${diastolic} mmHg - Wasiliana na daktari wako hivi karibuni`
        : `⚠️ Stage 2 Hypertension: ${systolic}/${diastolic} mmHg - Consult your doctor soon`
      );
    } else if (systolic >= 130 || diastolic >= 80) {
      alerts.push(language === "sw-TZ"
        ? `⚠️ Hatua ya 1 ya Shinikizo la Juu la Damu: ${systolic}/${diastolic} mmHg - Fuatilia kwa karibu`
        : `⚠️ Stage 1 Hypertension: ${systolic}/${diastolic} mmHg - Monitor closely`
      );
    } else if (systolic >= 120) {
      alerts.push(language === "sw-TZ"
        ? `📈 Shinikizo la Damu Lilioinuka: ${systolic}/${diastolic} mmHg - Fikiria mabadiliko ya maisha`
        : `📈 Elevated Blood Pressure: ${systolic}/${diastolic} mmHg - Consider lifestyle changes`
      );
    } else if (systolic < 90 || diastolic < 60) {
      alerts.push(language === "sw-TZ"
        ? `📉 Shinikizo la Chini la Damu: ${systolic}/${diastolic} mmHg - Wasiliana na mtoa huduma wa afya ikiwa hujisikii vizuri`
        : `📉 Low Blood Pressure: ${systolic}/${diastolic} mmHg - Contact healthcare provider if unwell`
      );
    }

    // Heart rate alerts
    if (heartRate < 60) {
      alerts.push(language === "sw-TZ"
        ? `💙 Kasi ya Chini ya Moyo: Kasi ya moyo ${heartRate} bpm - Kasi ya chini ya moyo imegunduliwa`
        : `💙 Bradycardia: Heart rate ${heartRate} bpm - Low heart rate detected`
      );
    } else if (heartRate > 100) {
      alerts.push(language === "sw-TZ"
        ? `❤️ Kasi ya Juu ya Moyo: Kasi ya moyo ${heartRate} bpm - Kasi ya juu ya moyo`
        : `❤️ Tachycardia: Heart rate ${heartRate} bpm - Elevated heart rate`
      );
    }
  });

  if (alerts.length === 0) {
    alerts.push(language === "sw-TZ"
      ? "✅ Vitali ziko imara leo - hakuna tahadhari zilizogunduliwa"
      : "✅ Vitals stable today - no alerts detected"
    );
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
  userId: string,
  language: string = "en-US"
): Promise<{ advice: string; alerts: string[]; warnings: string[] }> {
  try {
    const alerts = await getDailyAlerts(userId, language);
    const lifestyle = await getCurrentLifestyle(userId);

    const prompt = language === "sw-TZ" ? `
Wewe ni msaidizi wa AI wa usimamizi wa shinikizo la damu. Toa mapendekezo ya maisha yanayolengwa kulingana na data ifuatayo ya mgonjwa:

📊 TAHADHARI ZA VITALI ZA LEO:
${alerts.join("\n")}

🏃 MAISHA YA SASA:
- Uvutaji sigara: ${lifestyle.smoking}
- Pombe: ${lifestyle.alcohol}
- Mazoezi: ${lifestyle.exercise}
- Usingizi: ${lifestyle.sleep}

Tafadhali toa mapendekezo katika muundo ufuatao:

USHAURI WA JUMLA:
Toa sentensi 2-3 za ushauri wenye huruma na kutia moyo.

HATUA ZA HARAKA:
Orodhesha hatua 3-4 wazi za kuchukua leo kulingana na vitali zao.

UBORESHAJI WA MAISHA:
Pendekeza maboresho kwa uvutaji sigara, pombe, mazoezi, au usingizi ikiwa inahitajika.

Weze ufupi, chanya, na unaoweza kutekelezaka.
` : `
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

    const rawAdvice = completion.choices[0]?.message?.content || getFallbackAdvice(language);
    const structuredAdvice = parseAndStructureAdvice(rawAdvice, language);
    const warnings = extractWarnings(lifestyle, alerts, language);

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
      advice: getFallbackAdvice(language),
      alerts: await getDailyAlerts(userId, language),
      warnings: [],
    };
  }
}

// ✅ Helper: Format and structure advice
function parseAndStructureAdvice(rawAdvice: string, language: string): string {
  let text = rawAdvice;
  
  if (language === "sw-TZ") {
    text = text
      .replace(/USHAURI WA JUMLA:/gi, "💡 UHAKIKI MUHIMU:")
      .replace(/HATUA ZA HARAKA:/gi, "\n🎯 MPANGO WA LEO:")
      .replace(/UBORESHAJI WA MAISHA:/gi, "\n🌟 MALENGO YA MAISHA:")
      .replace(/USHAURI WA HEWA:/gi, "\n🌤 USHAURI WA HEWA:");

    if (!text.includes("UHAKIKI MUHIMU")) {
      text = "💡 UHAKIKI ULIO LENGWA:\n\n" + text;
    }
  } else {
    text = text
      .replace(/GENERAL ADVICE:/gi, "💡 KEY INSIGHTS:")
      .replace(/IMMEDIATE ACTIONS:/gi, "\n🎯 TODAY'S ACTION PLAN:")
      .replace(/LIFESTYLE IMPROVEMENTS:/gi, "\n🌟 LIFESTYLE GOALS:")
      .replace(/WEATHER CONSIDERATIONS:/gi, "\n🌤 WEATHER TIPS:");

    if (!text.includes("KEY INSIGHTS")) {
      text = "💡 PERSONALIZED INSIGHTS:\n\n" + text;
    }
  }

  return text.trim();
}

// ✅ Helper: Detect warnings based on lifestyle/vitals
function extractWarnings(lifestyle: any, alerts: string[], language: string): string[] {
  const warnings: string[] = [];

  if (lifestyle.smoking === "Heavy" && alerts.some((a) => a.includes("High") || a.includes("Juu"))) {
    warnings.push(language === "sw-TZ"
      ? "Uvutaji sigara unaoongezeka pamoja na shinikizo la juu la damu huongeza hatari ya moyo na mishipa."
      : "Smoking combined with high BP raises cardiovascular risk."
    );
  }

  if (lifestyle.alcohol === "Frequently" && alerts.some((a) => a.includes("High") || a.includes("Juu"))) {
    warnings.push(language === "sw-TZ"
      ? "Matumizi ya mara kwa mara ya pombe yanaweza kuinua shinikizo la damu."
      : "Frequent alcohol use may elevate blood pressure."
    );
  }

  if (["None", "Rarely"].includes(lifestyle.exercise)) {
    warnings.push(language === "sw-TZ"
      ? "Ukosefu wa shughuli za kimwili huongeza hatari ya shinikizo la juu la damu."
      : "Lack of physical activity increases hypertension risk."
    );
  }

  if (["<5 hrs", "Irregular"].includes(lifestyle.sleep)) {
    warnings.push(language === "sw-TZ"
      ? "Usingizi duni unaweza kuinua shinikizo la damu. Lengo la masaa 7-8 kwa usiku."
      : "Poor sleep can elevate BP. Aim for 7-8 hours per night."
    );
  }

  const highBPAlerts = alerts.filter(
    (a) => a.includes("High systolic") || a.includes("High diastolic") || a.includes("Juu")
  );
  if (highBPAlerts.length >= 2) {
    warnings.push(language === "sw-TZ"
      ? "Usomaji mwingi wa juu umegunduliwa — wasiliana na mtoa huduma wako."
      : "Multiple high readings detected — consult your provider."
    );
  }

  return warnings;
}

// ✅ Fallback Advice
function getFallbackAdvice(language: string): string {
  if (language === "sw-TZ") {
    return `💡 UHAKIKI MUHIMU:

Tuko hapa kuunga mkono safari yako ya afya ya moyo. Ingawa hatukuweza kutoa mapendekezo ya AI yaliyolengwa sasa, hizi ndizo vidokezo muhimu:

🎯 MPANGO WA LEO:
• Fuatilia BP kila siku kwa wakati mmoja
• Kaa na maji mengi (glasi 6-8/siku)
• Tumia dawa kama zilivyoagizwa
• Fanya kupumua kwa kina au kutafakari mwepesi

🌟 MALENGO YA MAISHA:
• Punguza ulaji wa chumvi
• Fanya mazoezi angalau dakika 30 kila siku
• Lala masaa 7-8
• Punguza pombe, epuka uvutaji sigara

Uthabiti huleta maendeleo 💪`;
  }

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

export async function analyzeVitalsWithAI(input: { vitals: any; activity: any }, language: string = "en-US"): Promise<any> {
    const { vitals, activity } = input;

    const prompt = language === "sw-TZ" ? `
        Wewe ni msaidizi wa matibabu wa AI. Chambua data ifuatayo ya mgonjwa ili kubaini ikiwa usomaji wao wa shinikizo la damu ni wa kushtua au athari ya kawaida kwa shughuli yao ya hivi karibuni.

        Vitali za Mgonjwa:
        - Sistolic: ${vitals.systolic} mmHg
        - Diastolic: ${vitals.diastolic} mmHg
        - Kasi ya Moyo: ${vitals.heartRate} bpm

        Shughuli ya Hivi Karibuni ya Mgonjwa:
        - Aina ya Shughuli: ${activity.activityType}
        - Muda: ${activity.duration} dakika
        - Ukali: ${activity.intensity}
        - Muda Ulio Pita Tangu Shughuli: ${activity.timeSinceActivity} dakika zilizopita
        - Maelezo: ${activity.notes || "Hakuna"}

        Kulingana na data hii, toa majibu ya JSON na muundo ufuatao:
        {
          "severity": "green" | "yellow" | "red",
          "title": "Kichwa kifupi, kinachoelezea kwa uchambuzi",
          "description": "Maelezo mafupi ya hali hiyo",
          "recommendation": "Mapendekezo yanayoweza kutekelezeka kwa mgonjwa",
          "activityInfluence": "Jinsi shughuli ya hivi karibuni inavyoathiri vitali",
          "shouldNotifyDoctor": boolean,
          "confidence": nambari (kutoka 0 hadi 100)
        }

        - Tumia "green" kwa usomaji wa kawaida.
        - Tumia "yellow" kwa usomaji ambao umeinuka kidogo lakini uwezekano ni kutokana na shughuli, au unahitaji ufuatiliaji.
        - Tumia "red" kwa usomaji ambao ni wa hatari sana au unahitaji umakini wa haraka.
    ` : `
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
            title: language === "sw-TZ" ? "Haiwezekani kuchambua vitali" : "Could not analyze vitals",
            description: language === "sw-TZ" 
                ? "Kulikuwa na hitilafu katika kuchambua data ya vitali na AI. Tafadhali wasiliana na daktari."
                : "There was an error analyzing the vitals data with the AI. Please consult a doctor.",
            recommendation: language === "sw-TZ" 
                ? "Tafadhali wasiliana na mtaalamu wa afya."
                : "Please consult a healthcare professional.",
            activityInfluence: language === "sw-TZ" ? "Haijulikani" : "Unknown",
            shouldNotifyDoctor: true,
            confidence: 0,
        };
    }
}

// ✅ Generate diet recommendations
export async function generateDietRecommendations(userId: string, language: string = "en-US") {
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
    const alerts = await getDailyAlerts(userId, language);

    const latestVital = vitals[0];
    const bpStatus = latestVital ? 
      (latestVital.systolic >= 140 || latestVital.diastolic >= 90 ? 
        (language === "sw-TZ" ? "Juu" : "High") : 
       latestVital.systolic >= 120 || latestVital.diastolic >= 80 ? 
        (language === "sw-TZ" ? "Imeinuka" : "Elevated") : 
        (language === "sw-TZ" ? "Kawaida" : "Normal")) : 
      (language === "sw-TZ" ? "Haijarekodiwa" : "Not recorded");

    // Get patient demographics
    const gender = patient?.gender || (language === "sw-TZ" ? "Haijatajwa" : "Not specified");
    const weight = patient?.weight || (language === "sw-TZ" ? "Haijatajwa" : "Not specified");
    const age = patient?.dob ? computeAge(patient.dob) : (language === "sw-TZ" ? "Haijatajwa" : "Not specified");

    // Create prompt for diet recommendations (concise output)
    const prompt = language === "sw-TZ" ? `
Wewe ni mtaalamu wa lishe wa Kenya anayejihusisha na usimamizi wa shinikizo la damu. Unda mpango wa mlo wa kila siku uliolengwa kwa kutumia VYAKULA HALISI VYA KENYA tu.

Wasifu wa Mgonjwa:
- Umri: ${age}
- Jinsia: ${gender}
- Uzito: ${weight} kg
- Hali ya Shinikizo la Damu: ${bpStatus}
- Tahadhari za Leo: ${alerts.join(', ')}
- Mambo ya Maisha: Uvutaji sigara: ${lifestyle.smoking}, Pombe: ${lifestyle.alcohol}, Mazoezi: ${lifestyle.exercise}, Usingizi: ${lifestyle.sleep}

MUHIMU: AI lazima KWAANZA usome na kuchambua vitali za mgonjwa na tahadhari kabla ya kutoa mapendekezo. Mpango wa mlo unapaswa kulengwa hasa kulingana na:
1. Hali ya tahadhari ya leo (shinikizo la juu la damu, kasi ya juu ya moyo, nk)
2. Umri, jinsia, na uzito wa mgonjwa
3. Mambo ya sasa ya maisha

Unda mpango wa mlo wa kila siku kwa kutumia VYAKULA HALISI VYA KENYA tu:

WANGA: Ugali (unga wa mahindi mzima), ugali wa kahawia, viazi, viazi vitamu, muhogo, ugali wa ulezi, ugali wa mtama
PROTEINI: Omena, tilapia, mbuta, nyama ya ng'ombe, kuku, mayai, maharagwe, ndengu, njahi, kunde, githeri (mahindi + maharagwe)
MBOCA: Sukuma wiki, managu, terere, majani ya kunde, spinach, kabichi, nyanya, vitunguu
MATUNDA: Papai, mapera, ndizi, machungwa, maracuja, parachichi, nanasi
VINYWAJI: Uji (ulezi/wimbi/mtama), mursik, chai ya tangawizi, maji, maziwa

Toa, kwa ufupi:
1. CHAKULA CHA ASUBUHI: Vitu 1-2 tu, sehemu ndogo
2. CHAKULA CHA MCHANA: Vitu 1-2 tu, sehemu ndogo
3. CHAKULA CHA JIONI: Vitu 1-2 tu, sehemu ndogo
4. VITAFUNIO: hadi vitu 2
5. Ushauri wa jumla wa mlo: sentensi 2 fupi tu

Epuka: pasta, pizza, burgers, vyakula vya kigeni. Tumia vipimo vya Kenya (debe, bakuli, kibaba, kifusi).

Weza kila sehemu chini ya maneno 40. Weka muundo wazi na kila sehemu ya mlo.
` : `
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

Keep each section under 40 words. Format clearly with each meal section.
`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 450,
    });

    const rawData = completion.choices[0]?.message?.content || "";
    
    console.log("Raw AI diet response:", rawData); // Debug log
    
    // Parse the raw response into structured format
    const dietData = parseDietResponse(rawData, language);

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
      breakfast: language === "sw-TZ" 
        ? "Maziwa lala na mkate wa maharagwe na ndizi"
        : "Maziwa lala with mkate wa maharage and bananas",
      lunch: language === "sw-TZ"
        ? "Sukuma wiki na protini nyepesi na sehemu ndogo ya ugali"
        : "Sukuma wiki with lean proteins and small portion of ugali",
      dinner: language === "sw-TZ"
        ? "Samaki na mboga za kitamaduni"
        : "Fish with traditional vegetables",
      snacks: language === "sw-TZ"
        ? "Matunda matamu au mahindi ya kuchemsha"
        : "Fresh fruits or boiled maize",
      generalAdvice: language === "sw-TZ"
        ? "Lenga vyakula vya kitamaduni vya Kenya kwa chumvi kidogo na mboga zaidi."
        : "Focus on traditional Kenyan foods with less salt and more vegetables.",
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
function parseDietResponse(rawResponse: string, language: string) {
  // Default fallback
  const defaultDiet = {
    breakfast: language === "sw-TZ" 
      ? "Maziwa lala na mkate wa maharagwe na ndizi"
      : "Maziwa lala with mkate wa maharage and bananas",
    lunch: language === "sw-TZ"
      ? "Sukuma wiki na protini nyepesi na sehemu ndogo ya ugali"
      : "Sukuma wiki with lean proteins and small portion of ugali",
    dinner: language === "sw-TZ"
      ? "Samaki na mboga za kitamaduni"
      : "Fish with traditional vegetables",
    snacks: language === "sw-TZ"
      ? "Matunda matamu au mahindi ya kuchemsha"
      : "Fresh fruits or boiled maize",
    generalAdvice: language === "sw-TZ"
      ? "Lenga vyakula vya kitamaduni vya Kenya kwa chumvi kidogo na mboga zaidi."
      : "Focus on traditional Kenyan foods with less salt and more vegetables.",
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
    const sectionPattern = language === "sw-TZ" 
      ? /\*\*\s*(CHAKULA CHA ASUBUHI|CHAKULA CHA MCHANA|CHAKULA CHA JIONI|VITAFUNIO|USHAURI|USHAURI WA JUMLA)\s*\*\*/gi
      : /\*\*\s*(BREAKFAST|LUNCH|DINNER|SUPPER|SNACKS|ADVICE|GENERAL\s*ADVICE)\s*\*\*/gi;
    
    const sections: Array<{name: string, pos: number, length: number}> = [];
    let match;
    
    while ((match = sectionPattern.exec(normalizedText)) !== null) {
      if (match && match[1]) {
        const name = language === "sw-TZ" 
          ? match[1].toUpperCase().replace('SUPPER', 'DINNER').replace(/\s*ADVICE/i, 'ADVICE')
          : match[1].toUpperCase().replace('SUPPER', 'DINNER').replace(/\s*ADVICE/i, 'ADVICE');
        sections.push({ name, pos: match.index, length: match[0].length });
      }
    }
    
    // If no bold headers found, try plain headers
    if (sections.length === 0) {
      const plainPattern = language === "sw-TZ"
        ? /\b(CHAKULA CHA ASUBUHI|CHAKULA CHA MCHANA|CHAKULA CHA JIONI|VITAFUNIO|USHAURI|USHAURI WA JUMLA)\s*:?/gi
        : /\b(BREAKFAST|LUNCH|DINNER|SUPPER|SNACKS|ADVICE|GENERAL\s*ADVICE)\s*:?/gi;
      
      while ((match = plainPattern.exec(normalizedText)) !== null) {
        if (match && match[1]) {
          const name = language === "sw-TZ"
            ? match[1].toUpperCase().replace('SUPPER', 'DINNER').replace(/\s*ADVICE/i, 'ADVICE')
            : match[1].toUpperCase().replace('SUPPER', 'DINNER').replace(/\s*ADVICE/i, 'ADVICE');
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
        .replace(/\*\*\s*(BREAKFAST|LUNCH|DINNER|SNACKS|ADVICE|CHAKULA CHA ASUBUHI|CHAKULA CHA MCHANA|CHAKULA CHA JIONI|VITAFUNIO|USHAURI)\s*\*\*/gi, '')
        .replace(/\b(BREAKFAST|LUNCH|DINNER|SNACKS|ADVICE|CHAKULA CHA ASUBUHI|CHAKULA CHA MCHANA|CHAKULA CHA JIONI|VITAFUNIO|USHAURI)\s*:?\s*/gi, '')
        .trim();
      
      // Remove any trailing header markers that might have been included
      content = content.replace(/^\*\*.*?\*\*\s*/, '').trim();
      
      if (content && content.length > 0) {
        const key = section.name === 'ADVICE' || section.name.includes('ADVICE') || section.name.includes('USHAURI') ? 'generalAdvice' : 
                   section.name.toLowerCase().replace('chakula cha asubuhi', 'breakfast')
                                  .replace('chakula cha mchana', 'lunch')
                                  .replace('chakula cha jioni', 'dinner')
                                  .replace('vitafunio', 'snacks');
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
        .replace(/\*\*\s*CHAKULA CHA ASUBUHI\s*\*\*\s*:?/gi, '')
        .replace(/\bCHAKULA CHA ASUBUHI\s*:?\s*/gi, '')
        .trim();
      
      if (beforeFirst && beforeFirst.length > 5 && !beforeFirst.match(/\*\*(LUNCH|DINNER|SNACKS|ADVICE|CHAKULA CHA MCHANA|CHAKULA CHA JIONI|VITAFUNIO|USHAURI)\*\*/i)) {
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
  updates: { alcohol?: string; smoking?: string; exercise?: string; sleep?: string },
  language: string = "en-US"
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
      await generateLifestyleRecommendations(userId, language);
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
  context?: { age?: number; condition?: string },
  language: string = "en-US"
) {
  try {
    // Create prompt for medication interaction analysis
    const medicationList = medications.map(med => 
      `${med.name} (${med.dosage} - ${med.frequency})`
    ).join(", ");
    
    const conditionText = context?.condition || "Hypertension";
    const ageText = context?.age ? `Patient Age: ${context.age}` : "";

    const prompt = language === "sw-TZ" ? `
Wewe ni msaidizi wa AI wa afya unayojihusisha na usalama wa dawa. Chambua dawa zifuatazo kwa mwingiliano unaowezekana, athari mbaya, na wasiwasi wa usalama:

DAWA ZA KUCHAMBUA:
${medicationList}

Muktadha wa Kikliniki:
- Hali kuu: ${conditionText}
${ageText ? `- ${ageText}` : ""}

Tafadhali toa uchambuzi wa kina unaojumuisha:
1. Mwingiliano mkuu kati ya dawa
2. Athari mbaya za kawaida
3. Tahadhari za usalama
4. Wakati wa kutafuta huduma ya matibabu
5. Mapendekezo ya ufuatiliaji

Weka majibu yako kwa uwazi na sehemu hizi:
🔍 UCHAMBUZI WA MWINGILIANO:
[Maelezo kuhusu mwingiliano wa dawa]

⚠️ ATHARI MBABA ZINAZOWEZEEKANA:
[Athari mbaya za kawaida za kuangalia]

🛡️ TAHADHARI ZA USALAMA:
[Hatua muhimu za usalama]

🆘 WAKATI WA KUTAFUTA USAIDIZI:
[Alamu nyekundu zinazohitaji huduma ya matibabu]

📊 MAPENDEKEZO YA UFUATILIAJI:
[Nini cha kufuatilia na mara ngapi]

Weka majibu yako ya kitaalamu, yanayotegemea ushahidi, na rahisi kuelewa kwa wagonjwa.
` : `
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
      (language === "sw-TZ" 
        ? "Haijawezekana kuchambua mwingiliano wa dawa kwa sasa. Tafadhali shauriana na mtoa huduma wako wa afya."
        : "Unable to analyze medication interactions at this time. Please consult with your healthcare provider.");

    console.log("✅ Medication interactions generated via Groq");
    return analysis;
  } catch (error) {
    console.error("❌ Error generating medication interactions:", error);
    return language === "sw-TZ"
      ? "Haijawezekana kuchambua mwingiliano wa dawa kutokana na hitilafu ya kiufundi. Tafadhali wasiliana na mtoa huduma wako wa afya kwa habari ya usalama wa dawa."
      : "Unable to analyze medication interactions due to a technical error. Please contact your healthcare provider for medication safety information.";
  }
}