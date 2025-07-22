import express from "express";
import Patient from "../models/patient";
import User from "../models/user"; // make sure this is imported
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();
connectMongoDB();

router.post("/", async (req, res) => {
  try {
    console.log("=== PROFILE SAVE DEBUG ===");
    console.log("Request body:", req.body);
    
    const { userId, selectedDiseases } = req.body;
    
    console.log("Extracted userId:", userId);
    console.log("Extracted selectedDiseases:", selectedDiseases);

    // Save to Patient model
    const newPatient = new Patient(req.body);
    const saved = await newPatient.save();
    console.log("✅ Patient saved successfully:", saved._id);

    // Update the corresponding User
    console.log("🔄 Attempting to update User with ID:", userId);
    
    const updateResult = await User.findByIdAndUpdate(userId, {
      selectedDiseases: selectedDiseases,
      profileCompleted: true
    }, { new: true });

    console.log("User update result:", updateResult);
    console.log("========================");

    res.status(201).json({ message: "Saved", id: saved._id });
  } catch (error) {
    console.error("❌ Profile save error:", error);
    res.status(500).json({ error: "Failed to save patient's profile" });
  }
});

export default router;