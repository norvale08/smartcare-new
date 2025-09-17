import express from "express";
import Diabetes from "../models/diabetesModel";
import { connectMongoDB } from "../lib/mongodb";
import { SmartCareAI } from "ai-service";



const router = express.Router();
const smartCareAI = new SmartCareAI();

// Connect to MongoDB once when this module is loaded
connectMongoDB();

router.post('/', async (req, res) => {
    try {
        // 1. Save vitals to database
        const newVitals = new Diabetes(req.body);
        const saved = await newVitals.save();

        // 2. Extract necessary fields for AI feedback
        const { glucose, context = 'Random', language = 'en' } = req.body;

        let aiFeedback = null;

        // 3. Generate AI feedback if glucose is valid
        if (typeof glucose === 'number') {
            try {
                aiFeedback = await smartCareAI.generateGlucoseFeedback({
                    glucose,
                    context,
                    language
                });
                console.log("✅ AI Feedback Generated:", aiFeedback);
            } catch (aiError:any) {
                console.error("❌ AI feedback generation failed:", aiError.message);
            }
        } else {
            console.warn("⚠️ No valid glucose value provided for AI feedback.");
        }

        // 4. Return response with AI feedback if available
        res.status(201).json({
            message: "Saved successfully",
            id: saved.id,
            aiFeedback: aiFeedback
        });

    } catch (error: any) {
        console.error("❌ Database error:", error.message);
        res.status(500).json({
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
