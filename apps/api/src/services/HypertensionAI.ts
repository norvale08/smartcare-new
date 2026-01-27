import Groq from "groq-sdk";
import mongoose from "mongoose";
import HypertensionLifestyle, { ILifestyle } from "../models/hypertensionLifestyle";
import HypertensionVital from "../models/hypertensionVitals";
import Patient from "../models/patient";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const model = "llama-3.3-70b-versatile"; // High-quality model

// ========== HELPER FUNCTIONS ==========
function computeAge(dob: string | Date): number {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

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

  vitals.forEach((vital) => {
    const systolic = Number(vital.systolic);
    const diastolic = Number(vital.diastolic);
    const heartRate = Number(vital.heartRate);

    if (systolic >= 180 || diastolic >= 120) {
      alerts.push(language === "sw-TZ"
        ? ` MGONGANO WA SHINIKIZO LA DAMU: ${systolic}/${diastolic} mmHg - Tafuta huduma ya matibabu haraka!`
        : ` HYPERTENSIVE CRISIS: ${systolic}/${diastolic} mmHg - Seek immediate medical attention!`
      );
    } else if (systolic >= 140 || diastolic >= 90) {
      alerts.push(language === "sw-TZ"
        ? ` Hatua ya 2 ya Shinikizo la Juu la Damu: ${systolic}/${diastolic} mmHg - Wasiliana na daktari wako hivi karibuni`
        : ` Stage 2 Hypertension: ${systolic}/${diastolic} mmHg - Consult your doctor soon`
      );
    } else if (systolic >= 130 || diastolic >= 80) {
      alerts.push(language === "sw-TZ"
        ? ` Hatua ya 1 ya Shinikizo la Juu la Damu: ${systolic}/${diastolic} mmHg - Fuatilia kwa karibu`
        : ` Stage 1 Hypertension: ${systolic}/${diastolic} mmHg - Monitor closely`
      );
    } else if (systolic >= 120) {
      alerts.push(language === "sw-TZ"
        ? ` Shinikizo la Damu Lilioinuka: ${systolic}/${diastolic} mmHg - Fikiria mabadiliko ya maisha`
        : ` Elevated Blood Pressure: ${systolic}/${diastolic} mmHg - Consider lifestyle changes`
      );
    } else if (systolic < 90 || diastolic < 60) {
      alerts.push(language === "sw-TZ"
        ? ` Shinikizo la Chini la Damu: ${systolic}/${diastolic} mmHg - Wasiliana na mtoa huduma wa afya ikiwa hujisikii vizuri`
        : `Low Blood Pressure: ${systolic}/${diastolic} mmHg - Contact healthcare provider if unwell`
      );
    }

    if (heartRate < 60) {
      alerts.push(language === "sw-TZ"
        ? ` Kasi ya Chini ya Moyo: Kasi ya moyo ${heartRate} bpm - Kasi ya chini ya moyo imegunduliwa`
        : `Bradycardia: Heart rate ${heartRate} bpm - Low heart rate detected`
      );
    } else if (heartRate > 100) {
      alerts.push(language === "sw-TZ"
        ? ` Kasi ya Juu ya Moyo: Kasi ya moyo ${heartRate} bpm - Kasi ya juu ya moyo`
        : ` Tachycardia: Heart rate ${heartRate} bpm - Elevated heart rate`
      );
    }
  });

  if (alerts.length === 0) {
    alerts.push(language === "sw-TZ"
      ? " Vitali ziko imara leo - hakuna tahadhari zilizogunduliwa"
      : "Vitals stable today - no alerts detected"
    );
  }

  return alerts;
}

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

// ========== LIFESTYLE RECOMMENDATIONS ==========
export async function generateLifestyleRecommendations(
  userId: string,
  language: string = "en-US"
): Promise<{ advice: string; alerts: string[]; warnings: string[] }> {
  try {
    const alerts = await getDailyAlerts(userId, language);
    const lifestyle = await getCurrentLifestyle(userId);

    const prompt = language === "sw-TZ" ? `
Wewe ni msaidizi wa AI wa usimamizi wa shinikizo la damu. Toa mapendekezo ya maisha yanayolengwa kulingana na data ifuatayo ya mgonjwa:

TAHADHARI ZA VITALI ZA LEO:
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

 DAILY VITALS ALERTS:
${alerts.join("\n")}

 CURRENT LIFESTYLE:
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

    // console.log(" AI lifestyle advice generated via Groq");
    return { advice: structuredAdvice, alerts, warnings };
  } catch (error) {
    console.error(" Error generating Groq recommendations:", error);
    return {
      advice: getFallbackAdvice(language),
      alerts: await getDailyAlerts(userId, language),
      warnings: [],
    };
  }
}

function parseAndStructureAdvice(rawAdvice: string, language: string): string {
  let text = rawAdvice;
  
  if (language === "sw-TZ") {
    text = text
      .replace(/USHAURI WA JUMLA:/gi, "UHAKIKI MUHIMU:")
      .replace(/HATUA ZA HARAKA:/gi, "\nMPANGO WA LEO:")
      .replace(/UBORESHAJI WA MAISHA:/gi, "\nMALENGO YA MAISHA:")
      .replace(/USHAURI WA HEWA:/gi, "\nUSHAURI WA HEWA:");

    if (!text.includes("UHAKIKI MUHIMU")) {
      text = "UHAKIKI ULIO LENGWA:\n\n" + text;
    }
  } else {
    text = text
      .replace(/GENERAL ADVICE:/gi, "KEY INSIGHTS:")
      .replace(/IMMEDIATE ACTIONS:/gi, "\nTODAY'S ACTION PLAN:")
      .replace(/LIFESTYLE IMPROVEMENTS:/gi, "\nLIFESTYLE GOALS:")
      .replace(/WEATHER CONSIDERATIONS:/gi, "\nWEATHER TIPS:");

    if (!text.includes("KEY INSIGHTS")) {
      text = "PERSONALIZED INSIGHTS:\n\n" + text;
    }
  }

  return text.trim();
}

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

function getFallbackAdvice(language: string): string {
  if (language === "sw-TZ") {
    return `💡 UHAKIKI MUHIMU:

Tuko hapa kuunga mkono safari yako ya afya ya moyo. Ingawa hatukuweza kutoa mapendekezo ya AI yaliyolengwa sasa, hizi ndizo vidokezo muhimu:

MPANGO WA LEO:
• Fuatilia BP kila siku kwa wakati mmoja
• Kaa na maji mengi (glasi 6-8/siku)
• Tumia dawa kama zilivyoagizwa
• Fanya kupumua kwa kina au kutafakari mwepesi

MALENGO YA MAISHA:
• Punguza ulaji wa chumvi
• Fanya mazoezi angalau dakika 30 kila siku
• Lala masaa 7-8
• Punguza pombe, epuka uvutaji sigara

Uthabiti huleta maendeleo`;
  }

  return `KEY INSIGHTS:

We're here to support your heart health journey. While we couldn't generate personalized AI recommendations now, here are essential tips:

TODAY'S ACTION PLAN:
• Monitor BP daily at the same time
• Stay hydrated (6-8 glasses/day)
• Take medications as prescribed
• Practice deep breathing or light meditation

LIFESTYLE GOALS:
• Reduce salt intake
• Exercise at least 30 mins daily
• Sleep 7-8 hours
• Limit alcohol, avoid smoking

Consistency brings progress`;
}

// ========== DIET RECOMMENDATIONS (ENHANCED) ==========
export async function generateDietRecommendations(
  userId: string, 
  language: string = "en-US"
) {
  try {
    const lifestyle = await getCurrentLifestyle(userId);
    const patient = await Patient.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    
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

    const alerts = await getDailyAlerts(userId, language);

    const latestVital = vitals[0];
    const bpStatus = latestVital ? 
      (latestVital.systolic >= 140 || latestVital.diastolic >= 90 ? 
        (language === "sw-TZ" ? "Juu" : "High") : 
       latestVital.systolic >= 120 || latestVital.diastolic >= 80 ? 
        (language === "sw-TZ" ? "Imeinuka" : "Elevated") : 
        (language === "sw-TZ" ? "Kawaida" : "Normal")) : 
      (language === "sw-TZ" ? "Haijarekodiwa" : "Not recorded");

    const gender = patient?.gender || (language === "sw-TZ" ? "Haijatajwa" : "Not specified");
    const weight = patient?.weight || (language === "sw-TZ" ? "Haijatajwa" : "Not specified");
    const age = patient?.dob ? computeAge(patient.dob) : (language === "sw-TZ" ? "Haijatajwa" : "Not specified");

    // Get patient name for personalization if available
    const patientName = patient?.name || patient?.fullName;
    const personalGreeting = patientName 
      ? (language === "sw-TZ" 
          ? `Mapendekezo ya lishe ya ${patientName}:\n\n` 
          : `Diet recommendations for ${patientName}:\n\n`)
      : "";

    const prompt = language === "sw-TZ" ? `
${personalGreeting}Wewe ni mtaalamu wa lishe wa Kenya anayejihusisha na usimamizi wa shinikizo la damu. Unda mpango wa mlo wa kila siku uliolengwa kwa kutumia VYAKULA HALISI VYA KENYA tu.

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

Toa maelezo mafupi kwa kila kitu (maneno 15-25 tu kwa kila kitu):
1. CHAKULA CHA ASUBUHI: Vitu 1-2 tu, sehemu ndogo
   • Maelezo: Ongeza kwa nini kitu hiki kinafaida kwa shinikizo la damu na afya ya moyo

2. CHAKULA CHA MCHANA: Vitu 1-2 tu, sehemu ndogo  
   • Maelezo: Ongeza kwa nini kitu hiki kinafaida kwa shinikizo la damu na afya ya moyo

3. CHAKULA CHA JIONI: Vitu 1-2 tu, sehemu ndogo
   • Maelezo: Ongeza kwa nini kitu hiki kinafaida kwa shinikizo la damu na afya ya moyo

4. VITAFUNIO: hadi vitu 2
   • Maelezo: Ongeza kwa nini kitu hiki kinafaida kwa shinikizo la damu na afya ya moyo

5. Ushauri wa jumla wa mlo: sentensi 2 fupi tu
   • Maelezo: Ongeza ushauri maalum kuhusu vyakula vya Kenya na shinikizo la damu

Weza kila sehemu chini ya maneni 75. Weka muundo wazi na kila sehemu ya mlo.
` : `
${personalGreeting}You are a Kenyan nutritionist specializing in hypertension management. Create a personalized daily diet plan using ONLY authentic Kenyan foods.

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

Provide brief explanations for each item (15-25 words per item only):
1. BREAKFAST: 1-2 items max, short portions
   • Why: Add why this is beneficial for blood pressure and heart health

2. LUNCH: 1-2 items max, short portions
   • Why: Add why this is beneficial for blood pressure and heart health  

3. DINNER: 1-2 items max, short portions
   • Why: Add why this is beneficial for blood pressure and heart health

4. SNACKS: up to 2 items
   • Why: Add why this is beneficial for blood pressure and heart health

5. General dietary advice: 2 short sentences max
   • Why: Add specific advice about Kenyan foods and blood pressure

Keep each section under 75 words. Format clearly with each meal section.
`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 600, // Increased for more detailed explanations
    });

    const rawData = completion.choices[0]?.message?.content || "";
    const dietData = parseEnhancedDietResponse(rawData, language, patientName);
    
    // Limit text length for storage
    const limit = (t: string, n = 250) => (t && t.length > n ? t.slice(0, n).trimEnd() + '…' : t);
    const conciseDiet = {
      breakfast: limit(dietData.breakfast),
      lunch: limit(dietData.lunch),
      dinner: limit(dietData.dinner),
      snacks: limit(dietData.snacks),
      generalAdvice: limit(dietData.generalAdvice, 250),
      calorieTarget: dietData.calorieTarget,
      whyBreakfast: limit(dietData.whyBreakfast, 150),
      whyLunch: limit(dietData.whyLunch, 150),
      whyDinner: limit(dietData.whyDinner, 150),
      whySnacks: limit(dietData.whySnacks, 150),
    };
    
    await HypertensionLifestyle.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { 
        dietData: conciseDiet,
        dietUpdatedAt: new Date() 
      },
      { new: true, upsert: true }
    );

    // console.log(" Enhanced diet recommendations generated via Groq");
    return conciseDiet;
  } catch (error) {
    console.error(" Error generating diet recommendations:", error);
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
      whyBreakfast: language === "sw-TZ"
        ? "Maziwa lala huongeza kalsiamu, na maharagwe huongeza protini na oksidi ya nitriki inayopunguza shinikizo la damu."
        : "Maziwa lala adds calcium, and beans provide protein and nitric oxide precursors that help lower blood pressure.",
      whyLunch: language === "sw-TZ"
        ? "Sukuma wiki ina potasiamu na magnesiamu, na protini nyepesi huhifadhi misa ya misuli."
        : "Sukuma wiki provides potassium and magnesium, while lean proteins preserve muscle mass.",
      whyDinner: language === "sw-TZ"
        ? "Samaki ya Omega-3 husaidia kupunguza uvimbe na kudhibiti shinikizo la damu."
        : "Omega-3 fish helps reduce inflammation and regulate blood pressure.",
      whySnacks: language === "sw-TZ"
        ? "Matunda hutoa vitanini na madini kwa chini ya kalori na chumvi."
        : "Fruits provide vitamins and minerals with low calories and sodium."
    };
  }
}

function parseEnhancedDietResponse(rawResponse: string, language: string, patientName?: string) {
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
    whyBreakfast: language === "sw-TZ"
      ? "Maziwa lala huongeza kalsiamu, na maharagwe huongeza protini na oksidi ya nitriki inayopunguza shinikizo la damu."
      : "Maziwa lala adds calcium, and beans provide protein and nitric oxide precursors that help lower blood pressure.",
    whyLunch: language === "sw-TZ"
      ? "Sukuma wiki ina potasiamu na magnesiamu, na protini nyepesi huhifadhi misa ya misuli."
      : "Sukuma wiki provides potassium and magnesium, while lean proteins preserve muscle mass.",
    whyDinner: language === "sw-TZ"
      ? "Samaki ya Omega-3 husaidia kupunguza uvimbe na kudhibiti shinikizo la damu."
      : "Omega-3 fish helps reduce inflammation and regulate blood pressure.",
    whySnacks: language === "sw-TZ"
      ? "Matunda hutoa vitanini na madini kwa chini ya kalori na chumvi."
      : "Fruits provide vitamins and minerals with low calories and sodium."
  };

  if (!rawResponse || rawResponse.trim().length === 0) {
    console.log("No raw response received, using default diet");
    return defaultDiet;
  }

  try {
    // Enhanced parsing for the new format with "Why" explanations
    const result: { [key: string]: string } = {};
    
    // Extract breakfast
    const breakfastMatch = rawResponse.match(/(?:BREAKFAST|CHAKULA CHA ASUBUHI)[:\s]*([^•]*?)(?:•|Why|Maelezo|LUNCH|CHAKULA CHA MCHANA|DINNER|CHAKULA CHA JIONI|SNACKS|VITAFUNIO|ADVICE|USHAURI|$)/i);
    const whyBreakfastMatch = rawResponse.match(/(?:•|Why|Maelezo)[:\s]*(.*?)(?:LUNCH|CHAKULA CHA MCHANA|DINNER|CHAKULA CHA JIONI|SNACKS|VITAFUNIO|ADVICE|USHAURI|$)/i);
    
    if (breakfastMatch && breakfastMatch[1]) {
      result.breakfast = breakfastMatch[1].trim();
    }
    if (whyBreakfastMatch && whyBreakfastMatch[1]) {
      result.whyBreakfast = whyBreakfastMatch[1].trim();
    }
    
    // Extract lunch
    const lunchMatch = rawResponse.match(/(?:LUNCH|CHAKULA CHA MCHANA)[:\s]*([^•]*?)(?:•|Why|Maelezo|DINNER|CHAKULA CHA JIONI|SNACKS|VITAFUNIO|ADVICE|USHAURI|$)/i);
    const whyLunchMatch = rawResponse.substring(rawResponse.indexOf("LUNCH") || rawResponse.indexOf("CHAKULA CHA MCHANA") || 0)
      .match(/(?:•|Why|Maelezo)[:\s]*(.*?)(?:DINNER|CHAKULA CHA JIONI|SNACKS|VITAFUNIO|ADVICE|USHAURI|$)/i);
    
    if (lunchMatch && lunchMatch[1]) {
      result.lunch = lunchMatch[1].trim();
    }
    if (whyLunchMatch && whyLunchMatch[1]) {
      result.whyLunch = whyLunchMatch[1].trim();
    }
    
    // Extract dinner
    const dinnerMatch = rawResponse.match(/(?:DINNER|SUPPER|CHAKULA CHA JIONI)[:\s]*([^•]*?)(?:•|Why|Maelezo|SNACKS|VITAFUNIO|ADVICE|USHAURI|$)/i);
    const whyDinnerMatch = rawResponse.substring(rawResponse.indexOf("DINNER") || rawResponse.indexOf("SUPPER") || rawResponse.indexOf("CHAKULA CHA JIONI") || 0)
      .match(/(?:•|Why|Maelezo)[:\s]*(.*?)(?:SNACKS|VITAFUNIO|ADVICE|USHAURI|$)/i);
    
    if (dinnerMatch && dinnerMatch[1]) {
      result.dinner = dinnerMatch[1].trim();
    }
    if (whyDinnerMatch && whyDinnerMatch[1]) {
      result.whyDinner = whyDinnerMatch[1].trim();
    }
    
    // Extract snacks
    const snacksMatch = rawResponse.match(/(?:SNACKS|VITAFUNIO)[:\s]*([^•]*?)(?:•|Why|Maelezo|ADVICE|USHAURI|$)/i);
    const whySnacksMatch = rawResponse.substring(rawResponse.indexOf("SNACKS") || rawResponse.indexOf("VITAFUNIO") || 0)
      .match(/(?:•|Why|Maelezo)[:\s]*(.*?)(?:ADVICE|USHAURI|$)/i);
    
    if (snacksMatch && snacksMatch[1]) {
      result.snacks = snacksMatch[1].trim();
    }
    if (whySnacksMatch && whySnacksMatch[1]) {
      result.whySnacks = whySnacksMatch[1].trim();
    }
    
    // Extract general advice
    const adviceMatch = rawResponse.match(/(?:General dietary advice|Ushauri wa jumla wa mlo|ADVICE|USHAURI)[:\s]*([^•]*?)(?:•|Why|Maelezo|$)/i);
    if (adviceMatch && adviceMatch[1]) {
      result.generalAdvice = adviceMatch[1].trim();
    }
    
    // Calculate calorie target based on weight
    const weightMatch = patientName ? 70 : 65; // Default weight if not specified
    result.calorieTarget = Math.round(weightMatch * 30).toString(); // Basic calorie calculation
    
    const dietData = {
      breakfast: result.breakfast || defaultDiet.breakfast,
      lunch: result.lunch || defaultDiet.lunch,
      dinner: result.dinner || defaultDiet.dinner,
      snacks: result.snacks || defaultDiet.snacks,
      generalAdvice: result.generalAdvice || defaultDiet.generalAdvice,
      calorieTarget: parseInt(result.calorieTarget) || defaultDiet.calorieTarget,
      whyBreakfast: result.whyBreakfast || defaultDiet.whyBreakfast,
      whyLunch: result.whyLunch || defaultDiet.whyLunch,
      whyDinner: result.whyDinner || defaultDiet.whyDinner,
      whySnacks: result.whySnacks || defaultDiet.whySnacks,
    };

    return dietData;
  } catch (error) {
    console.error("Error parsing enhanced diet response:", error);
    return defaultDiet;
  }
}


// ========== MEDICATION INTERACTIONS (FIXED FOR BACKWARD COMPATIBILITY) ==========
// Main function with original signature
export async function generateMedicationInteractions(
  medications: Array<{ name: string; dosage: string; frequency: string }>,
  language: string = "en-US"
) {
  return generateMedicationInteractionsEnhanced(medications, language);
}

// Enhanced function that can be called internally or by routes that want the 3-argument version
export async function generateMedicationInteractionsEnhanced(
  medications: Array<{ name: string; dosage: string; frequency: string }>,
  language: string = "en-US",
  context?: { age?: number; condition?: string; patientName?: string }
) {
  try {
    // Extract patient name from context if provided
    const patientName = context?.patientName;
    
    // Add patient name personalization
    const greeting = patientName 
      ? (language === "sw-TZ" 
          ? `Habari, ${patientName}.` 
          : `Hello, ${patientName}.`)
      : "";
    
    const medicationList = medications.map(med => 
      `${med.name} (${med.dosage} - ${med.frequency})`
    ).join(", ");
    
    const conditionText = context?.condition || "Hypertension";
    const ageText = context?.age ? `Patient Age: ${context.age}` : "";

    const prompt = language === "sw-TZ" ? `
${greeting} Wewe ni msaidizi wa AI wa afya unayojihusisha na usalama wa dawa. Chambua dawa zifuatazo kwa mwingiliano unaowezekana, athari mbaya, na ushauri wa kina:

DAWA ZA KUCHAMBUA:
${medicationList}

Muktadha wa Kikliniki:
- Hali kuu: ${conditionText}
${ageText ? `- ${ageText}` : ""}

MUHIMU SANA: Wakati wa kutoa ushauri, tumia lugha ya kibinafsi. Badala ya kusema "wagonjwa wanaotumia dawa X", sema "UNAKITUMIA dawa X" au "UNAWACHUKUA dawa X".

Tafadhali toa uchambuzi wa kina unaojumuisha:
1. Uchambuzi kamili wa mwingiliano kati ya dawa
2. Jinsi ya kuchukua dawa kwa usalama (muda, chakula, vinywaji)
3. Athari mbaya za kawaida na zile za hatari
4. Ushauri maalum kwa mgonjwa kuhusu kuhudumia dawa
5. Wakati wa kutafuta huduma ya matibabu ya haraka

Weka majibu yako kwa uwazi na sehemu hizi:
UCHAMBUZI WA MWINGILIANO WA DAWA:
[Maelezo ya kina juu ya jinsi dawa zinavyoingiliana na athari zake. Tumia lugha ya kibinafsi kama "UNAKITUMIA" badala ya "wagonjwa wanaotumia".]

JINSI YA KUTUMIA DAWA KWA USALAMA:
[Muda bora wa kuchukua, chakula cha kuepuka, vinywaji, n.k. Tumia lugha ya kibinafsi.]

ATHARI MBABA ZINAZOWEZEEKANA:
[Athari za kawaida na zile za hatari kwa kila dawa. Tumia lugha ya kibinafsi kama "UNAWEZA kuona" badala ya "wagonjwa wanaweza kuona".]

USHAURI MAALUMA KWA MGONJWA:
[Mapendekezo ya vitendo kuhusu namna ya kuhudumia dawa zako. Tumia lugha ya kibinafsi.]

WAKATI WA KUTAFUTA USAIDIZI WA HARAKA:
[Alamu nyekundu zinazohitaji huduma ya matibabu ya haraka. Tumia lugha ya kibinafsi.]

MAPENDEKEZO YA UFUATILIAJI:
[Nini cha kufuatilia na mara ngapi. Tumia lugha ya kibinafsi.]

Weka majibu yako ya kitaalamu, yanayotegemea ushahidi, na rahisi kuelewa kwa wagonjwa. Tumia lugha ya kibinafsi kila wakati.
` : `
${greeting} You are a healthcare AI assistant specializing in medication safety. Analyze the following medications for potential interactions, side effects, and detailed guidance:

MEDICATIONS TO ANALYZE:
${medicationList}

Clinical Context:
- Primary condition: ${conditionText}
${ageText ? `- ${ageText}` : ""}

CRITICALLY IMPORTANT: When providing advice, use PERSONALIZED LANGUAGE. Instead of saying "patients taking medication X", say "YOU ARE TAKING medication X" or "YOUR medication X".

Please provide comprehensive analysis covering:
1. Complete interaction analysis between medications
2. How to take medications safely (timing, food, beverages)
3. Common side effects and dangerous ones
4. Specific patient advice on managing your medications
5. When to seek urgent medical attention

Format your response clearly with these sections:
COMPREHENSIVE MEDICATION INTERACTION ANALYSIS:
[Detailed explanation of how medications interact and effects. Use personalized language like "YOU ARE TAKING" instead of "patients taking".]

HOW TO TAKE MEDICATIONS SAFELY:
[Best time to take, foods to avoid, beverages, etc. Use personalized language.]

POTENTIAL SIDE EFFECTS:
[Common side effects and dangerous ones for each medication. Use personalized language like "YOU MAY experience" instead of "patients may experience".]

SPECIFIC PATIENT ADVICE:
[Actionable recommendations on managing YOUR medications. Use personalized language.]

WHEN TO SEEK URGENT HELP:
[Red flags requiring urgent medical attention. Use personalized language.]

MONITORING RECOMMENDATIONS:
[What to monitor and how often. Use personalized language.]

Keep your response professional, evidence-based, and easy to understand for patients. Use personalized language throughout.
`;

    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1200, // Increased for more detailed analysis
    });

    const analysis = completion.choices[0]?.message?.content || 
      (language === "sw-TZ" 
        ? "Haijawezekana kuchambua mwingiliano wa dawa kwa sasa. Tafadhali shauriana na mtoa huduma wako wa afya."
        : "Unable to analyze medication interactions at this time. Please consult with your healthcare provider.");

    // console.log("Enhanced medication interactions generated via Groq");
    return analysis;
  } catch (error) {
    console.error(" Error generating medication interactions:", error);
    return language === "sw-TZ"
      ? "Haijawezekana kuchambua mwingiliano wa dawa kutokana na hitilafu ya kiufundi. Tafadhali wasiliana na mtoa huduma wako wa afya kwa habari ya usalama wa dawa."
      : "Unable to analyze medication interactions due to a technical error. Please contact your healthcare provider for medication safety information.";
  }
}

// ========== VITALS ANALYSIS ==========
export async function analyzeVitalsWithAI(input: { vitals: any; activity: any; userId?: string }, language: string = "en-US"): Promise<any> {
    const { vitals, activity, userId } = input;

    // AHA/ACC Blood Pressure Guidelines
    const bloodPressureGuidelines = {
        "normal": { systolic: { max: 120 }, diastolic: { max: 80 } },
        "elevated": { systolic: { min: 120, max: 129 }, diastolic: { max: 80 } },
        "hypertension_stage_1": { systolic: { min: 130, max: 139 }, diastolic: { min: 80, max: 89 } },
        "hypertension_stage_2": { systolic: { min: 140 }, diastolic: { min: 90 } },
        "hypertensive_crisis": { systolic: { min: 180 }, diastolic: { min: 120 } }
    };

    // Blood pressure chart based on age and gender
    const bloodPressureChart = {
        "18-39": {
            "Male": { systolic: 119, diastolic: 70 },
            "Female": { systolic: 119, diastolic: 70 }
        },
        "40-59": {
            "Male": { systolic: 124, diastolic: 77 },
            "Female": { systolic: 122, diastolic: 74 }
        },
        "60+": {
            "Male": { systolic: 139, diastolic: 68 },
            "Female": { systolic: 139, diastolic: 68 }
        }
    };

    // Get patient information to determine age group and gender
    let ageGroup = "40-59";
    let gender = "Male";
    let normalSystolic = 124;
    let normalDiastolic = 77;
    let patientName = "Patient";
    let patientAge = "unknown";

    // Try to get patient information from database
    try {
        if (userId) {
            const patient = await Patient.findOne({ userId: new mongoose.Types.ObjectId(userId) });
            if (patient) {
                // Use fullName directly since it's required in the Patient model
                patientName = patient.fullName;

                // Calculate age if date of birth is available
                if (patient.dob) {
                    const age = computeAge(patient.dob);
                    patientAge = age.toString();
                    if (age < 40) ageGroup = "18-39";
                    else if (age >= 60) ageGroup = "60+";
                    else ageGroup = "40-59";
                }

                // Handle gender properly - capitalize first letter
                gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "Male";
                // Ensure ageGroup is a valid key
                const validAgeGroup = ageGroup in bloodPressureChart ? ageGroup : "40-59";
                // Ensure gender is a valid key for the age group
                const ageGroupData = bloodPressureChart[validAgeGroup as keyof typeof bloodPressureChart];
                const validGender = gender in ageGroupData ? gender : "Male";
                normalSystolic = ageGroupData[validGender as keyof typeof ageGroupData].systolic;
                normalDiastolic = ageGroupData[validGender as keyof typeof ageGroupData].diastolic;
            }
        }
    } catch (error) {
        console.log("Could not retrieve patient data for personalized analysis, using defaults");
    }

    // Determine AHA/ACC category
    let ahaAccCategory = "normal";
    if (vitals.systolic >= 180 || vitals.diastolic >= 120) {
        ahaAccCategory = "hypertensive_crisis";
    } else if (vitals.systolic >= 140 || vitals.diastolic >= 90) {
        ahaAccCategory = "hypertension_stage_2";
    } else if (vitals.systolic >= 130 || vitals.diastolic >= 80) {
        ahaAccCategory = "hypertension_stage_1";
    } else if (vitals.systolic >= 120) {
        ahaAccCategory = "elevated";
    }

    const prompt = language === "sw-TZ" ? `
        Wewe ni msaidizi wa matibabu wa AI. Chambua data ifuatayo ya mgonjwa ili kubaini ikiwa usomaji wao wa shinikizo la damu ni wa kushtua au athari ya kawaida kwa shughuli yao ya hivi karibuni.

        Taarifa za Mgonjwa:
        - Jina: ${patientName}
        - Umri: ${patientAge}
        - Jinsia: ${gender}

        Vitali za Mgonjwa:
        - Sistolic: ${vitals.systolic} mmHg
        - Diastolic: ${vitals.diastolic} mmHg
        - Kasi ya Moyo: ${vitals.heartRate} bpm

        Shinikizo la Damu la Kawaida kwa Umri na Jinsia (kufuatana na chati ya shinikizo la damu):
        - Kikundi cha Umri: ${ageGroup}
        - Jinsia: ${gender}
        - Shinikizo la Damu la Kawaida: ${normalSystolic}/${normalDiastolic} mmHg

        Mwongozo wa AHA/ACC wa Shinikizo la Damu:
        - ${ahaAccCategory.replace(/_/g, ' ')}: ${vitals.systolic}/${vitals.diastolic} mmHg

        Shughuli ya Hivi Karibuni ya Mgonjwa:
        - Aina ya Shughuli: ${activity.activityType}
        - Muda: ${activity.duration} dakika
        - Ukali: ${activity.intensity}
        - Muda Ulio Pita Tangu Shughuli: ${activity.timeSinceActivity} dakika zilizopita
        - Maelezo: ${activity.notes || "Hakuna"}

        Kulingana na data hii, chati ya shinikizo la damu, na mwongozo wa AHA/ACC, toa majibu ya JSON na muundo ufuatao:

        MUHIMU SANA: Kwa kila uchambuzi, toa maelezo ya kina juu ya iwapo shughuli ya hivi karibuni imesababisha au kuathiri usomaji wa shinikizo la damu. Jumuisha:
        1. Uchambuzi wa athari ya shughuli (ukali, muda, na wakati uliopita) kwa shinikizo la damu
        2. Tathmini ya iwapo usomaji unaonyesha mabadiliko ya kawaida baada ya shughuli hii
        3. Ushauri maalum kwa mgonjwa kuhusu jinsi ya kufuatilia au kutibu athari zozote

        {
          "severity": "green" | "yellow" | "red",
          "title": "Kichwa kifupi, kinachoelezea kwa uchambuzi",
          "description": "Maelezo mafupi ya hali hiyo, ikijumuisha linganishi na shinikizo la damu la kawaida kwa umri na jinsia, na kitengo cha AHA/ACC",
          "recommendation": "Mapendekezo yanayoweza kutekelezeka kwa mgonjwa",
          "activityInfluence": "Uchambuzi wa kina wa jinsi shughuli ya hivi karibuni imesababisha au kuathiri usomaji wa shinikizo la damu, ikijumuisha tathmini ya iwapo hii ni mabadiliko ya kawaida baada ya shughuli hii",
          "shouldNotifyDoctor": boolean,
          "confidence": nambari (kutoka 0 hadi 100),
          "normalRange": {
            "systolic": ${normalSystolic},
            "diastolic": ${normalDiastolic},
            "ageGroup": "${ageGroup}",
            "gender": "${gender}"
          },
          "ahaAccCategory": "${ahaAccCategory}",
          "patientInfo": {
            "name": "${patientName}",
            "age": "${patientAge}",
            "gender": "${gender}"
          }
        }

        - Tumia "green" kwa usomaji wa kawaida unaolengwa na umri na jinsia.
        - Tumia "yellow" kwa usomaji ambao umeinuka kidogo lakini uwezekano ni kutokana na shughuli, au unahitaji ufuatiliaji.
        - Tumia "red" kwa usomaji ambao ni wa hatari sana au unahitaji umakini wa haraka, haswa ikiwa ni mgongano wa shinikizo la damu.
        - Jumuisha linganishi na shinikizo la damu la kawaida kwa umri na jinsia na kitengo cha AHA/ACC katika maelezo.
        - Weka mapendekezo yanayolingana na kitengo cha AHA/ACC.
        - Kwa "activityInfluence", toa uchambuzi wa kina wa athari ya shughuli kwa shinikizo la damu, ukizingatia ukali, muda, na wakati uliopita.
    ` : `
        You are an AI medical assistant. Analyze the following patient data to determine if their blood pressure reading is a cause for concern or a normal reaction to their recent activity.

        Patient Information:
        - Name: ${patientName}
        - Age: ${patientAge}
        - Gender: ${gender}

        Patient's Vitals:
        - Systolic: ${vitals.systolic} mmHg
        - Diastolic: ${vitals.diastolic} mmHg
        - Heart Rate: ${vitals.heartRate} bpm

        Normal Blood Pressure for Age and Gender (based on blood pressure chart):
        - Age Group: ${ageGroup}
        - Gender: ${gender}
        - Normal Blood Pressure: ${normalSystolic}/${normalDiastolic} mmHg

        AHA/ACC Blood Pressure Guideline Category:
        - ${ahaAccCategory.replace(/_/g, ' ')}: ${vitals.systolic}/${vitals.diastolic} mmHg

        Patient's Recent Activity:
        - Activity Type: ${activity.activityType}
        - Duration: ${activity.duration} minutes
        - Intensity: ${activity.intensity}
        - Time Since Activity: ${activity.timeSinceActivity} minutes ago
        - Notes: ${activity.notes || "None"}

        Based on this data, the blood pressure chart, and AHA/ACC guidelines, provide a JSON response with the following structure:
        {
          "severity": "green" | "yellow" | "red",
          "title": "A short, descriptive title for the analysis",
          "description": "A brief explanation of the situation, including comparison with normal blood pressure for age and gender, and AHA/ACC category",
          "recommendation": "A clear, actionable recommendation for the patient",
          "activityInfluence": "How the recent activity is likely influencing the vitals",
          "shouldNotifyDoctor": boolean,
          "confidence": number (from 0 to 100),
          "normalRange": {
            "systolic": ${normalSystolic},
            "diastolic": ${normalDiastolic},
            "ageGroup": "${ageGroup}",
            "gender": "${gender}"
          },
          "ahaAccCategory": "${ahaAccCategory}",
          "patientInfo": {
            "name": "${patientName}",
            "age": "${patientAge}",
            "gender": "${gender}"
          }
        }

        - Use "green" for normal readings targeted for age and gender.
        - Use "yellow" for readings that are slightly elevated but likely due to activity, or require monitoring.
        - Use "red" for readings that are dangerously high or require immediate attention, especially if hypertensive crisis.
        - Include comparison with normal blood pressure for age and gender and AHA/ACC category in the description.
        - Provide recommendations appropriate for the AHA/ACC category.
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

// ========== UTILITY FUNCTIONS ==========

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
      console.log(" Regenerating lifestyle advice via Groq...");
      await generateLifestyleRecommendations(userId, language);
    }

    return updated;
  } catch (error) {
    console.error("Error updating lifestyle:", error);
    return null;
  }
}