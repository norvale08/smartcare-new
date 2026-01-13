import express, { Request, Response } from "express";
import Lifestyle from "../models/lifestyleModel";
import Patient from "../models/patient";
import Diabetes from "../models/diabetesModel";
import { SmartCareAI, LifestyleAIInput } from "../services/SmartCareAI";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

// ✅ Create ONE shared instance instead of per-request
let smartCareAI: SmartCareAI | null = null;

const getAIService = () => {
  if (!smartCareAI) {
    console.log("🤖 Initializing SmartCareAI service for lifestyle...");
    smartCareAI = new SmartCareAI();
  }
  return smartCareAI;
};

// Utility: calculate age from DOB
const calculateAge = (dob: Date | string | undefined): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 ? age : 0;
};

// ✅ Helper function to get patient name
const getPatientName = (patient: any): string => {
  if (!patient) return "Patient";
  
  if (patient.fullName && patient.fullName.trim() !== "") {
    return patient.fullName.trim();
  }
  
  if (patient.firstname && patient.lastname) {
    return `${patient.firstname.trim()} ${patient.lastname.trim()}`.trim();
  }
  
  if (patient.firstName && patient.lastName) {
    return `${patient.firstName.trim()} ${patient.lastName.trim()}`.trim();
  }
  
  if (patient.firstname) {
    return patient.firstname.trim();
  }
  
  if (patient.firstName) {
    return patient.firstName.trim();
  }
  
  return "Patient";
};

// ✅ Helper function to get selected diseases
const getPatientDiseases = (patient: any): ("diabetes" | "hypertension")[] => {
  const diseases: ("diabetes" | "hypertension")[] = [];
  
  if (!patient) {
    return ["diabetes"];
  }
  
  if (patient.diabetes === true) {
    diseases.push("diabetes");
  }
  
  if (patient.hypertension === true) {
    diseases.push("hypertension");
  }
  
  if (diseases.length === 0) {
    diseases.push("diabetes");
  }
  
  return diseases;
};

// ✅ GET latest lifestyle for user
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    console.log("📊 Fetching latest lifestyle for user:", userId);

    const latestLifestyle = await Lifestyle.findOne({ userId }).sort({ createdAt: -1 });
    
    if (!latestLifestyle) {
      console.log("⚠️ No lifestyle records found");
      return res.status(200).json({ success: true, data: null });
    }

    console.log("✅ Latest lifestyle found:", {
      id: latestLifestyle._id,
      createdAt: latestLifestyle.createdAt,
      hasAIAdvice: !!latestLifestyle.aiAdvice,
      language: latestLifestyle.language || 'en'
    });

    res.status(200).json({ success: true, data: latestLifestyle });
  } catch (error: any) {
    console.error("❌ Fetch latest lifestyle error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ POST new lifestyle (creates NEW record)
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    console.log("📝 Creating new lifestyle record for user:", userId);
    console.log("Request body:", req.body);

    const { alcohol, smoking, exercise, sleep, language } = req.body;

    // Validate required fields
    if (!alcohol || !smoking || !exercise || !sleep) {
      return res.status(400).json({ message: "All lifestyle fields are required" });
    }

    // Fetch patient info
    const patient = await Patient.findOne({ userId });
    if (!patient) {
      console.error("❌ Patient profile not found for userId:", userId);
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const age = calculateAge(patient.dob);
    const patientName = getPatientName(patient);
    
    // ✅ GET SELECTED DISEASES
    const selectedDiseases = getPatientDiseases(patient);
    const hasBothConditions = selectedDiseases.includes("diabetes") && selectedDiseases.includes("hypertension");
    
    console.log(`👤 Patient found - Name: ${patientName}, Age: ${age}, Gender: ${patient.gender}`);
    console.log(`🏥 Disease Profile:`, {
      diseases: selectedDiseases,
      managementType: hasBothConditions ? "DUAL (Diabetes + Hypertension)" : "DIABETES ONLY"
    });

    // Get latest glucose reading with ALL context
    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    const glucose = latestVitals?.glucose || 0;
    const context = (latestVitals?.context as "Fasting" | "Post-meal" | "Random") || "Random";
    
    // Use diseases from vitals if available, otherwise from patient profile
    const vitalDiseases = latestVitals?.selectedDiseases || selectedDiseases;

    console.log("🩺 Latest vitals context:", {
      glucose,
      context,
      vitalsDate: latestVitals?.createdAt,
      vitalsLanguage: latestVitals?.language,
      selectedDiseases: vitalDiseases,
      systolic: latestVitals?.systolic,
      diastolic: latestVitals?.diastolic,
      heartRate: latestVitals?.heartRate
    });

    // ✅ PRIORITY: Use language from request body first, then vitals, then default to 'en'
    const userLanguage = (language || latestVitals?.language || "en") as "en" | "sw";
    console.log(`🌐 Using language: ${userLanguage} (source: ${language ? 'request' : latestVitals?.language ? 'vitals' : 'default'})`);

    // Save lifestyle with pending AI advice
    const lifestyleDoc = new Lifestyle({
      userId,
      alcohol,
      smoking,
      exercise,
      sleep,
      glucoseContext: {
        glucose,
        context,
        readingDate: latestVitals?.createdAt || new Date(),
      },
      language: userLanguage,
      aiAdvice: userLanguage === "sw" 
        ? "Inaendeleza ushauri wa kibinafsi..." 
        : "Generating personalized advice...",
    });
    await lifestyleDoc.save();
    console.log("✅ Lifestyle record saved:", lifestyleDoc._id);

    // Prepare COMPLETE input for AI with all available context and diseases
    const aiInput: LifestyleAIInput & {
      systolic?: number;
      diastolic?: number;
      heartRate?: number;
      exerciseRecent?: string;
      exerciseIntensity?: string;
      patientName?: string;
      selectedDiseases?: ("diabetes" | "hypertension")[];
    } = {
      glucose,
      context,
      language: userLanguage,
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
      lifestyle: { alcohol, smoking, exercise, sleep },
      patientName: patientName,
      selectedDiseases: vitalDiseases,
      systolic: latestVitals?.systolic,
      diastolic: latestVitals?.diastolic,
      heartRate: latestVitals?.heartRate,
      exerciseRecent: latestVitals?.exerciseRecent,
      exerciseIntensity: latestVitals?.exerciseIntensity,
    };

    const hasBoth = vitalDiseases.includes("diabetes") && vitalDiseases.includes("hypertension");

    console.log("🤖 Generating lifestyle feedback with context:", {
      glucose: aiInput.glucose,
      context: aiInput.context,
      language: aiInput.language,
      patientName: aiInput.patientName,
      selectedDiseases: aiInput.selectedDiseases,
      managementType: hasBoth ? "DUAL" : "DIABETES ONLY",
      bp: `${aiInput.systolic || 'N/A'}/${aiInput.diastolic || 'N/A'}`,
      hr: aiInput.heartRate || 'N/A',
      exercise: `${aiInput.exerciseRecent || 'N/A'} (${aiInput.exerciseIntensity || 'N/A'})`
    });

    try {
      const ai = getAIService();
      const aiAdvice = await ai.generateLifestyleFeedback(aiInput);
      
      console.log("✅ AI advice generated:");
      console.log("- Length:", aiAdvice.length);
      console.log("- First 100 chars:", aiAdvice.substring(0, 100));
      console.log("- Language used:", userLanguage);
      console.log("- Disease focus:", hasBoth ? "DUAL" : "DIABETES ONLY");
      
      // Update the document with AI advice
      lifestyleDoc.aiAdvice = aiAdvice;
      await lifestyleDoc.save();
      console.log("✅ AI advice saved to document");

      res.status(200).json({ 
        success: true, 
        recordId: lifestyleDoc._id, 
        aiAdvice,
        patientName,
        selectedDiseases: vitalDiseases,
        diseaseManagement: hasBoth ? "dual" : "diabetes-only",
        conditions: {
          diabetes: vitalDiseases.includes("diabetes"),
          hypertension: vitalDiseases.includes("hypertension"),
        },
        language: userLanguage,
        contextUsed: {
          glucose,
          context,
          patientName: patientName,
          selectedDiseases: vitalDiseases,
          language: userLanguage,
          bloodPressure: aiInput.systolic && aiInput.diastolic ? 
            `${aiInput.systolic}/${aiInput.diastolic}` : 'Not provided',
          heartRate: aiInput.heartRate || 'Not provided',
          exercise: aiInput.exerciseRecent && aiInput.exerciseIntensity ? 
            `${aiInput.exerciseRecent} (${aiInput.exerciseIntensity})` : 'Not provided'
        }
      });
    } catch (aiError: any) {
      console.error("❌ AI generation failed:", aiError.message);
      console.error("Full error:", aiError);
      
      const errorMessage = userLanguage === "sw" 
        ? "Haiwezekani kutengeneza ushauri wa kibinafsi kwa sasa. Tafadhali jaribu tena baadaye."
        : "Unable to generate personalized advice at this time. Please try again later.";
      
      lifestyleDoc.aiAdvice = errorMessage;
      await lifestyleDoc.save();
      
      res.status(200).json({ 
        success: true, 
        recordId: lifestyleDoc._id, 
        aiAdvice: lifestyleDoc.aiAdvice,
        patientName,
        selectedDiseases: vitalDiseases,
        aiError: true,
        language: userLanguage,
        errorDetails: aiError.message
      });
    }
  } catch (error: any) {
    console.error("❌ Save lifestyle error:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ PUT update existing lifestyle (regenerates AI advice)
router.put("/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { alcohol, smoking, exercise, sleep, language } = req.body;

    console.log("📝 Updating lifestyle record:", id);
    console.log("Update data:", { alcohol, smoking, exercise, sleep, language });

    const lifestyleDoc = await Lifestyle.findOne({ _id: id, userId });
    if (!lifestyleDoc) {
      return res.status(404).json({ message: "Lifestyle record not found" });
    }

    // Update fields
    if (alcohol) lifestyleDoc.alcohol = alcohol;
    if (smoking) lifestyleDoc.smoking = smoking;
    if (exercise) lifestyleDoc.exercise = exercise;
    if (sleep) lifestyleDoc.sleep = sleep;

    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const age = calculateAge(patient.dob);
    const patientName = getPatientName(patient);
    
    // ✅ GET SELECTED DISEASES
    const selectedDiseases = getPatientDiseases(patient);

    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    const glucose = latestVitals?.glucose || lifestyleDoc.glucoseContext?.glucose || 0;
    const context = (latestVitals?.context as "Fasting" | "Post-meal" | "Random") || 
                    lifestyleDoc.glucoseContext?.context || "Random";
    
    const vitalDiseases = latestVitals?.selectedDiseases || selectedDiseases;

    lifestyleDoc.glucoseContext = {
      glucose,
      context,
      readingDate: latestVitals?.createdAt || new Date(),
    };

    // ✅ PRIORITY: language from request body → existing doc → vitals → default
    const userLanguage = (language || lifestyleDoc.language || latestVitals?.language || "en") as "en" | "sw";
    console.log(`🌐 Using language for update: ${userLanguage} (source: ${language ? 'request' : lifestyleDoc.language ? 'existing' : latestVitals?.language ? 'vitals' : 'default'})`);
    
    lifestyleDoc.language = userLanguage;
    lifestyleDoc.aiAdvice = userLanguage === "sw" 
      ? "Inaendeleza ushauri wa kibinafsi upya..."
      : "Regenerating personalized advice...";
    await lifestyleDoc.save();

    const aiInput: LifestyleAIInput & {
      systolic?: number;
      diastolic?: number;
      heartRate?: number;
      exerciseRecent?: string;
      exerciseIntensity?: string;
      patientName?: string;
      selectedDiseases?: ("diabetes" | "hypertension")[];
    } = {
      glucose,
      context,
      language: userLanguage,
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
      patientName: patientName,
      selectedDiseases: vitalDiseases,
      lifestyle: { 
        alcohol: lifestyleDoc.alcohol, 
        smoking: lifestyleDoc.smoking, 
        exercise: lifestyleDoc.exercise, 
        sleep: lifestyleDoc.sleep 
      },
      systolic: latestVitals?.systolic,
      diastolic: latestVitals?.diastolic,
      heartRate: latestVitals?.heartRate,
      exerciseRecent: latestVitals?.exerciseRecent,
      exerciseIntensity: latestVitals?.exerciseIntensity,
    };

    const hasBoth = vitalDiseases.includes("diabetes") && vitalDiseases.includes("hypertension");

    console.log("🤖 Regenerating lifestyle feedback with:", {
      language: userLanguage,
      patientName: patientName,
      selectedDiseases: vitalDiseases,
      managementType: hasBoth ? "DUAL" : "DIABETES ONLY",
      glucose,
      context
    });

    try {
      const ai = getAIService();
      const aiAdvice = await ai.generateLifestyleFeedback(aiInput);
      
      lifestyleDoc.aiAdvice = aiAdvice;
      await lifestyleDoc.save();
      console.log("✅ AI advice regenerated, length:", aiAdvice.length);

      res.status(200).json({ 
        success: true, 
        recordId: lifestyleDoc._id, 
        aiAdvice,
        patientName,
        selectedDiseases: vitalDiseases,
        diseaseManagement: hasBoth ? "dual" : "diabetes-only",
        conditions: {
          diabetes: vitalDiseases.includes("diabetes"),
          hypertension: vitalDiseases.includes("hypertension"),
        },
        language: userLanguage,
        updated: true
      });
    } catch (aiError: any) {
      console.error("❌ AI regeneration failed:", aiError.message);
      
      const errorMessage = userLanguage === "sw" 
        ? "Haiwezekani kutengeneza ushauri wa kibinafsi upya kwa sasa."
        : "Unable to regenerate personalized advice at this time.";
      
      lifestyleDoc.aiAdvice = errorMessage;
      await lifestyleDoc.save();
      
      res.status(200).json({ 
        success: true, 
        recordId: lifestyleDoc._id, 
        aiAdvice: lifestyleDoc.aiAdvice,
        patientName,
        selectedDiseases: vitalDiseases,
        aiError: true,
        language: userLanguage,
        errorDetails: aiError.message
      });
    }
  } catch (error: any) {
    console.error("❌ Update lifestyle error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ POST regenerate AI advice for existing record (with language support)
router.post("/:id/regenerate", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { language } = req.body;

    console.log("🔄 Regenerating AI advice for record:", id);
    console.log("🌐 Requested language:", language || 'not specified');

    const lifestyleDoc = await Lifestyle.findOne({ _id: id, userId });
    if (!lifestyleDoc) {
      return res.status(404).json({ message: "Lifestyle record not found" });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const age = calculateAge(patient.dob);
    const patientName = getPatientName(patient);
    
    // ✅ GET SELECTED DISEASES
    const selectedDiseases = getPatientDiseases(patient);

    const latestVitals = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    const glucose = latestVitals?.glucose || lifestyleDoc.glucoseContext?.glucose || 0;
    const context = (latestVitals?.context as "Fasting" | "Post-meal" | "Random") || 
                    lifestyleDoc.glucoseContext?.context || "Random";
    
    const vitalDiseases = latestVitals?.selectedDiseases || selectedDiseases;

    lifestyleDoc.glucoseContext = {
      glucose,
      context,
      readingDate: latestVitals?.createdAt || new Date(),
    };

    // ✅ PRIORITY: language from request → existing doc → vitals → default
    const userLanguage = (language || lifestyleDoc.language || latestVitals?.language || "en") as "en" | "sw";
    console.log(`🌐 Using language: ${userLanguage} (source: ${language ? 'request' : lifestyleDoc.language ? 'existing' : latestVitals?.language ? 'vitals' : 'default'})`);
    
    lifestyleDoc.language = userLanguage;
    lifestyleDoc.aiAdvice = userLanguage === "sw" 
      ? "Inaendeleza ushauri wa kibinafsi upya..."
      : "Regenerating personalized advice...";
    await lifestyleDoc.save();

    const aiInput: LifestyleAIInput & {
      systolic?: number;
      diastolic?: number;
      heartRate?: number;
      exerciseRecent?: string;
      exerciseIntensity?: string;
      patientName?: string;
      selectedDiseases?: ("diabetes" | "hypertension")[];
    } = {
      glucose,
      context,
      language: userLanguage,
      age,
      gender: patient.gender,
      weight: patient.weight,
      height: patient.height,
      patientName: patientName,
      selectedDiseases: vitalDiseases,
      lifestyle: { 
        alcohol: lifestyleDoc.alcohol, 
        smoking: lifestyleDoc.smoking, 
        exercise: lifestyleDoc.exercise, 
        sleep: lifestyleDoc.sleep 
      },
      systolic: latestVitals?.systolic,
      diastolic: latestVitals?.diastolic,
      heartRate: latestVitals?.heartRate,
      exerciseRecent: latestVitals?.exerciseRecent,
      exerciseIntensity: latestVitals?.exerciseIntensity,
    };

    const hasBoth = vitalDiseases.includes("diabetes") && vitalDiseases.includes("hypertension");

    console.log("🤖 Regenerating with full context:", {
      language: userLanguage,
      patientName: patientName,
      selectedDiseases: vitalDiseases,
      managementType: hasBoth ? "DUAL" : "DIABETES ONLY",
      glucose,
      context,
      hasBP: !!(latestVitals?.systolic && latestVitals?.diastolic),
      hasHR: !!latestVitals?.heartRate
    });

    try {
      const ai = getAIService();
      const aiAdvice = await ai.generateLifestyleFeedback(aiInput);
      
      lifestyleDoc.aiAdvice = aiAdvice;
      await lifestyleDoc.save();
      
      console.log("✅ AI advice regenerated successfully");
      console.log("- Length:", aiAdvice.length);
      console.log("- Language:", userLanguage);
      console.log("- First 100 chars:", aiAdvice.substring(0, 100));

      res.status(200).json({ 
        success: true, 
        aiAdvice,
        patientName,
        selectedDiseases: vitalDiseases,
        diseaseManagement: hasBoth ? "dual" : "diabetes-only",
        conditions: {
          diabetes: vitalDiseases.includes("diabetes"),
          hypertension: vitalDiseases.includes("hypertension"),
        },
        language: userLanguage,
        regenerated: true,
        timestamp: new Date()
      });
    } catch (aiError: any) {
      console.error("❌ AI regeneration failed:", aiError.message);
      
      const errorMessage = userLanguage === "sw" 
        ? "Haiwezekani kutengeneza ushauri wa kibinafsi upya kwa sasa."
        : "Unable to regenerate personalized advice at this time.";
      
      lifestyleDoc.aiAdvice = errorMessage;
      await lifestyleDoc.save();
      
      res.status(500).json({ 
        success: false,
        message: "AI generation failed",
        error: aiError.message
      });
    }
  } catch (error: any) {
    console.error("❌ Regenerate error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ GET AI advice by record ID
router.get("/advice/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const lifestyle = await Lifestyle.findOne({ _id: id, userId });

    if (!lifestyle) {
      return res.status(404).json({ success: false, message: "Lifestyle record not found" });
    }

    const patient = await Patient.findOne({ userId });
    const patientName = getPatientName(patient);

    const isGenerating = !lifestyle.aiAdvice || 
                        lifestyle.aiAdvice === "" ||
                        lifestyle.aiAdvice.includes("Generating") ||
                        lifestyle.aiAdvice.includes("Regenerating") ||
                        lifestyle.aiAdvice.includes("Inaendeleza");

    if (isGenerating) {
      return res.status(200).json({
        success: true,
        isGenerating: true,
        aiAdvice: lifestyle.aiAdvice || "Generating personalized advice...",
        patientName,
        lastUpdated: lifestyle.updatedAt,
        language: lifestyle.language || 'en'
      });
    }

    res.status(200).json({
      success: true,
      isGenerating: false,
      aiAdvice: lifestyle.aiAdvice,
      patientName,
      lastUpdated: lifestyle.updatedAt,
      language: lifestyle.language || 'en'
    });
  } catch (error: any) {
    console.error("❌ Fetch lifestyle advice error:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ GET all lifestyle records for user (with pagination)
router.get("/history", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    console.log(`📊 Fetching lifestyle history for user: ${userId} (page ${page})`);

    const lifestyleRecords = await Lifestyle.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await Lifestyle.countDocuments({ userId });

    const patient = await Patient.findOne({ userId });
    const patientName = getPatientName(patient);

    res.status(200).json({
      success: true,
      data: lifestyleRecords,
      patientName,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        recordsPerPage: limit
      }
    });
  } catch (error: any) {
    console.error("❌ Fetch lifestyle history error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ DELETE lifestyle record
router.delete("/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const lifestyleDoc = await Lifestyle.findOneAndDelete({ _id: id, userId });

    if (!lifestyleDoc) {
      return res.status(404).json({ message: "Lifestyle record not found" });
    }

    console.log("✅ Lifestyle record deleted:", id);

    res.status(200).json({
      success: true,
      message: "Lifestyle record deleted successfully"
    });
  } catch (error: any) {
    console.error("❌ Delete lifestyle error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;