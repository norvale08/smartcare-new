// routes/medicine.ts
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
    console.error("❌ Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/medications - Get all medications (admin/doctor overview)
router.get("/", authenticateUser, async (req: any, res: any) => {
  try {
   
    await connectMongoDB();

    let medications;

    if (req.userRole === 'admin') {
      // Admin can see all medications
      medications = await MedicationModel.find()
        .populate('patientId', 'fullName email')
        .populate('prescribedBy', 'fullName specialization')
        .sort({ createdAt: -1 });
    } else if (req.userRole === 'doctor') {
      // Doctor can only see medications they prescribed
      medications = await MedicationModel.find({ prescribedBy: req.userId })
        .populate('patientId', 'fullName email')
        .populate('prescribedBy', 'fullName specialization')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    

    res.json({
      success: true,
      data: medications
    });

  } catch (error: any) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medications",
      error: error.message
    });
  }
});

// PUT /api/medications/:id - Update medication
router.put("/:id", authenticateUser, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    
    await connectMongoDB();

    const medication = await MedicationModel.findById(id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found"
      });
    }

    // Check permissions
    if (req.userRole === 'doctor' && medication.prescribedBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update medications you prescribed"
      });
    }

    const updatedMedication = await MedicationModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    ).populate('patientId', 'fullName email')
     .populate('prescribedBy', 'fullName specialization');

   

    res.json({
      success: true,
      message: "Medication updated successfully",
      data: updatedMedication
    });

  } catch (error: any) {
    console.error('Error updating medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update medication",
      error: error.message
    });
  }
});

// DELETE /api/medications/:id - Delete medication
router.delete("/:id", authenticateUser, async (req: any, res: any) => {
  try {
    const { id } = req.params;

   

    await connectMongoDB();

    const medication = await MedicationModel.findById(id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found"
      });
    }

    // Check permissions
    if (req.userRole === 'doctor' && medication.prescribedBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete medications you prescribed"
      });
    }

    await MedicationModel.findByIdAndDelete(id);

    
    res.json({
      success: true,
      message: "Medication deleted successfully"
    });

  } catch (error: any) {
    console.error('Error deleting medication:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete medication",
      error: error.message
    });
  }
});

export default router;