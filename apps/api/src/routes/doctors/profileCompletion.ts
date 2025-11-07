import express from "express";
import User from "../../models/user";
import { connectMongoDB } from "../../lib/mongodb";

const router = express.Router();

interface ProfileCompletionData {
  bio: string;
  experienceYears: number;
  consultationHours: string;
  services: string[];
  location: string;
  profilePicture?: string;
}

// Get profile completion status
router.get("/status", async (req: express.Request, res: express.Response) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret");
    
    await connectMongoDB();
    const doctor = await User.findById(decoded.userId);
    
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    res.status(200).json({
      profileCompleted: doctor.profileCompleted || false,
      isFirstLogin: doctor.isFirstLogin || false,
      hasBasicInfo: !!(doctor.specialization && doctor.licenseNumber && doctor.hospital)
    });
  } catch (error) {
    console.error("Profile status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Complete doctor profile
router.post("/complete", async (req: express.Request, res: express.Response) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret");
    
    const {
      bio,
      experienceYears,
      consultationHours,
      services,
      location,
      profilePicture
    }: ProfileCompletionData = req.body;

    // Validate required profile fields
    if (!bio || !experienceYears || !consultationHours || !location) {
      return res.status(400).json({ 
        message: "Missing profile fields",
        required: ["bio", "experienceYears", "consultationHours", "location"]
      });
    }

    await connectMongoDB();

    // Update doctor with profile completion data
    const updatedDoctor = await User.findByIdAndUpdate(
      decoded.userId,
      {
        bio,
        experienceYears: parseInt(experienceYears.toString()) || 0,
        consultationHours,
        services: Array.isArray(services) ? services : [services].filter(Boolean),
        location,
        ...(profilePicture && { profilePicture }),
        profileCompleted: true, // Mark profile as completed
        isFirstLogin: false // No longer first login
      },
      { new: true, runValidators: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({
      message: "Profile completed successfully",
      profileCompleted: true,
      doctor: {
        bio: updatedDoctor.bio,
        experienceYears: updatedDoctor.experienceYears,
        consultationHours: updatedDoctor.consultationHours,
        services: updatedDoctor.services,
        location: updatedDoctor.location,
        profilePicture: updatedDoctor.profilePicture
      }
    });
  } catch (error: any) {
    console.error("Profile completion error:", error);
    res.status(500).json({ 
      message: "Server error completing profile", 
      error: error.message 
    });
  }
});

// Get current profile data
router.get("/current", async (req: express.Request, res: express.Response) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret");
    
    await connectMongoDB();
    const doctor = await User.findById(decoded.userId);
    
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    res.status(200).json({
      profileCompleted: doctor.profileCompleted || false,
      profileData: {
        bio: doctor.bio,
        experienceYears: doctor.experienceYears,
        consultationHours: doctor.consultationHours,
        services: doctor.services || [],
        location: doctor.location,
        profilePicture: doctor.profilePicture,
        // Basic info from registration
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        hospital: doctor.hospital,
        treatsDiabetes: doctor.diabetes,
        treatsHypertension: doctor.hypertension
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;