// routes/patientMedications.ts
import express from "express";
import jwt from "jsonwebtoken";
import { MedicationModel } from "../models/medicationModels";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Authentication middleware
const authenticateUser = (req: any, res: any, next: any) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || req.body.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret");
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;

   
    next();
  } catch (error) {
    console.error(" Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/medications/patient/my-medications - Patient gets their medications
router.get("/my-medications", authenticateUser, async (req: any, res: any) => {
  try {
   

    await connectMongoDB();

    const medications = await MedicationModel.find({ 
      patientId: req.userId,
      status: 'active'
    })
    .populate('prescribedBy', 'fullName specialization')
    .sort({ createdAt: -1 });

   

    res.json({
      success: true,
      medications: medications
    });

  } catch (error: any) {
    console.error('Error fetching patient medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medications",
      error: error.message
    });
  }
});

// GET /api/medications/patient/history - Get medication history for patient
router.get("/history", authenticateUser, async (req: any, res: any) => {
  try {
   

    await connectMongoDB();

    const medications = await MedicationModel.find({ 
      patientId: req.userId 
    })
    .populate('prescribedBy', 'fullName specialization')
    .sort({ createdAt: -1 });

    

    res.json({
      success: true,
      data: medications
    });

  } catch (error: any) {
    console.error('Error fetching medication history:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medication history",
      error: error.message
    });
  }
});

// GET /api/medications/patient/active - Get only active medications
router.get("/active", authenticateUser, async (req: any, res: any) => {
  try {
    

    await connectMongoDB();

    const activeMedications = await MedicationModel.find({ 
      patientId: req.userId,
      status: 'active'
    })
    .populate('prescribedBy', 'fullName specialization')
    .sort({ medicationName: 1 });

    

    res.json({
      success: true,
      data: activeMedications
    });

  } catch (error: any) {
    console.error('Error fetching active medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active medications",
      error: error.message
    });
  }
});

export default router;