import express from "express";
import Diabetes from "../models/diabetesModel";
import { connectMongoDB } from "../lib/mongodb";
import { SmartCareAI, type GlucoseData } from "../services/SmartCareAI";

const router = express.Router();
const smartCareAI = new SmartCareAI();

// Connect to MongoDB once when this module is loaded
connectMongoDB();


router.post("/", async (req, res) => {
  try {
    // 1. Save vitals to database

    const newVitals = new Diabetes(req.body);
    const saved = await newVitals.save();

    // 2. Extract necessary fields for AI feedback
    const { glucose, context = "Random", language = "en" } = req.body;

    let aiFeedback: string | null = null;

    // 3. Generate AI feedback if glucose is valid
    if (typeof glucose === "number" && !isNaN(glucose) && glucose > 0) {
      try {
        console.log(`🤖 Generating AI feedback for glucose: ${glucose} mg/dL (${context})`);

        const glucoseData: GlucoseData = {
          glucose,
          context: context as "Fasting" | "Post-meal" | "Random",
          language: language as "en" | "sw",
        };

        aiFeedback = await smartCareAI.generateGlucoseFeedback(glucoseData);
        console.log("✅ AI Feedback Generated successfully");
      } catch (aiError: any) {
        console.error("❌ AI feedback generation failed:", aiError.message);
      }
    } else {
      console.warn("⚠️ No valid glucose value provided for AI feedback.");
    }

    // 4. Return response with AI feedback if available
    res.status(201).json({
      message: "Diabetes vitals saved successfully",
      id: saved._id,
      data: saved,
      aiFeedback,
      aiProvider: "SmartCareAI-Ollama",
    });
  } catch (error: any) {
    console.error("❌ Database error:", error.message);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET: Health check for SmartCareAI
 * (⚠️ Must be BEFORE '/:id' to avoid conflicts)
 */
router.get("/ai/health", async (req, res) => {
  try {
    const isConnected = await smartCareAI.checkConnection();
    const models = isConnected ? await smartCareAI.getAvailableModels() : [];

    res.status(200).json({
      smartCareAI: {
        connected: isConnected,
        availableModels: models,
        provider: "Ollama",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      smartCareAI: {
        connected: false,
        error: error.message,
        provider: "Ollama",
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET: Retrieve all diabetes vitals
 */
router.get("/", async (req, res) => {
  try {
    const vitals = await Diabetes.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "Diabetes vitals retrieved successfully",
      data: vitals,
      count: vitals.length,
    });
  } catch (error: any) {
    console.error("❌ Database error:", error.message);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET: Retrieve a specific diabetes vital by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const vital = await Diabetes.findById(req.params.id);
    if (!vital) {
      return res.status(404).json({
        message: "Diabetes vital not found",
      });
    }
    res.status(200).json({
      message: "Diabetes vital retrieved successfully",
      data: vital,
    });
  } catch (error: any) {
    console.error("❌ Database error:", error.message);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
