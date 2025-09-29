import express, { Request, Response } from "express";
import { SmartCareAI } from "../services/SmartCareAI"; 
import Diabetes from "../models/diabetesModel";
import Lifestyle from "../models/lifestyleModel";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

// Initialize AI service
let aiService: SmartCareAI;
try {
  aiService = new SmartCareAI();
  console.log("✅ SmartCareAI service initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize SmartCareAI service:", error);
  aiService = null as any;
}

interface LifestyleData {
  alcohol?: string;
  smoking?: string;
  exercise?: string;
  sleep?: string;
}

// Allow preflight OPTIONS requests
router.options("*", (_req, res) => res.sendStatus(200));

// POST lifestyle data
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const lifestyleData: LifestyleData = req.body;
    console.log("📝 Received lifestyle data for user:", userId, lifestyleData);

    // Validate
    const requiredFields = ['alcohol', 'smoking', 'exercise', 'sleep'];
    const missingFields = requiredFields.filter(field => !lifestyleData[field as keyof LifestyleData]);
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Latest glucose reading
    const latestGlucoseReading = await Diabetes.findOne({ userId }).sort({ createdAt: -1 });
    if (!latestGlucoseReading) {
      return res.status(404).json({ success: false, message: "No glucose readings found. Please add a glucose reading first." });
    }

    console.log("🩸 Found latest glucose reading:", {
      glucose: latestGlucoseReading.glucose,
      context: latestGlucoseReading.context,
      date: latestGlucoseReading.createdAt
    });

    // Warnings
    const warnings: string[] = [];
    if (lifestyleData.alcohol === "Frequently") warnings.push("High alcohol consumption can affect blood sugar control");
    if (lifestyleData.smoking === "Heavy") warnings.push("Smoking significantly increases diabetes complications risk");
    if (lifestyleData.exercise === "None") warnings.push("Regular exercise is crucial for blood sugar management");
    if (lifestyleData.sleep === "<5 hrs" || lifestyleData.sleep === "Irregular") warnings.push("Poor sleep patterns can worsen blood sugar control");

    // Save lifestyle record with initial state
    const lifestyleRecord = new Lifestyle({
      userId,
      ...lifestyleData,
      aiAdvice: "Generating personalized advice...",
      isGenerating: true,
      warnings,
      glucoseContext: {
        glucose: latestGlucoseReading.glucose,
        context: latestGlucoseReading.context,
        readingDate: latestGlucoseReading.createdAt
      }
    });

    const savedRecord = await lifestyleRecord.save();
    console.log("💾 Saved lifestyle record with ID:", savedRecord._id);

    // Send immediate response
    res.json({
      success: true,
      message: "Lifestyle data saved successfully",
      recordId: savedRecord._id,
      warning: warnings.length > 0 ? warnings.join(". ") : null,
      data: savedRecord
    });

    // Generate AI advice in background (don't await)
    generateAIAdviceBackground(savedRecord._id.toString(), {
      glucose: latestGlucoseReading.glucose,
      context: latestGlucoseReading.context,
      language: latestGlucoseReading.language || "en",
      lifestyle: lifestyleData
    }).catch(error => {
      console.error("❌ Background AI generation failed:", error);
    });

  } catch (error) {
    console.error("❌ Error in lifestyle POST:", error);
    res.status(500).json({ success: false, message: "Failed to process lifestyle data" });
  }
});

// Background AI generation function
async function generateAIAdviceBackground(recordId: string, aiInput: any) {
  try {
    console.log("🤖 Starting AI advice generation for record:", recordId);
    
    if (!aiService) {
      console.log("❌ AI service not available");
      await Lifestyle.findByIdAndUpdate(recordId, {
        aiAdvice: "AI service is currently unavailable. Please try again later.",
        isGenerating: false
      });
      return;
    }

    // Mark as generating
    await Lifestyle.findByIdAndUpdate(recordId, {
      aiAdvice: "Generating personalized advice...",
      isGenerating: true
    });

    // Generate advice
    console.log("🔄 Calling AI service with input:", aiInput);
    const aiGeneratedAdvice = await aiService.generateLifestyleFeedback(aiInput);
    console.log("✅ AI advice generated:", aiGeneratedAdvice.substring(0, 100) + "...");

    // Update database with generated advice
    const updatedRecord = await Lifestyle.findByIdAndUpdate(recordId, {
      aiAdvice: aiGeneratedAdvice || "AI advice generation completed but no response received.",
      isGenerating: false
    }, { new: true });

    console.log("💾 Updated lifestyle record with AI advice");

  } catch (error) {
    console.error("❌ Error in AI advice generation:", error);
    await Lifestyle.findByIdAndUpdate(recordId, {
      aiAdvice: "Sorry, AI advice generation failed. Please try again later.",
      isGenerating: false
    });
  }
}

// Get AI advice with detailed logging
router.get("/advice/:recordId", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recordId } = req.params;
    const userId = req.user?.userId;
    
    console.log("📡 Fetching AI advice for record:", recordId, "user:", userId);
    
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const record = await Lifestyle.findOne({ _id: recordId, userId });
    if (!record) {
      console.log("❌ Record not found:", recordId);
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    const isGenerating = record.aiAdvice === "Generating personalized advice..." || record.isGenerating;
    
    console.log("📊 Record status:", {
      aiAdvice: record.aiAdvice.substring(0, 50) + "...",
      isGenerating,
      lastUpdated: record.updatedAt
    });

    res.json({ 
      success: true, 
      aiAdvice: record.aiAdvice, 
      isGenerating, 
      lastUpdated: record.updatedAt 
    });

  } catch (error) {
    console.error("❌ Error fetching AI advice:", error);
    res.status(500).json({ success: false, message: "Failed to fetch AI advice" });
  }
});

// Get latest lifestyle data for a user
router.get("/latest", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const latestRecord = await Lifestyle.findOne({ userId }).sort({ createdAt: -1 });
    
    if (!latestRecord) {
      return res.status(404).json({ success: false, message: "No lifestyle data found" });
    }

    res.json({ success: true, data: latestRecord });
  } catch (error) {
    console.error("❌ Error fetching latest lifestyle data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch lifestyle data" });
  }
});

export default router;