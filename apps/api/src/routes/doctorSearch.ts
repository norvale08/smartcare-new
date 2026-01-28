// routes/doctorsearch.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// GET /api/doctors/search?q=query
router.get("/", async (req: Request, res: Response) => {
  try {
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
     
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    

    let decoded: any;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-default-secret"
      ) as { userId: string };
      console.log("✅ Token decoded successfully, user ID:", decoded.userId);
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError);
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    await connectMongoDB();
    

    // Ensure user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      
      res.status(404).json({ message: "User not found" });
      return;
    }
   

    // Get query params
    const query = (req.query.q as string) || "";
   

    // Build search query for doctors
    let searchQuery: any = { role: "doctor" };
    

    if (query) {
      const searchRegex = new RegExp(query, "i");
      searchQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
      ];
      
    }

    // Find doctors
    
    const doctors = await User.find(searchQuery)
      .select("firstName lastName fullName email phoneNumber specialization hospital licenseNumber diabetes hypertension cardiovascular createdAt")
      .limit(20)
      .sort({ createdAt: -1 });

   

    // Format response
    const formattedDoctors = doctors.map((doctor) => {
      // Calculate experience based on account creation date
      const accountAge = doctor.createdAt ? 
        new Date().getFullYear() - new Date(doctor.createdAt).getFullYear() : 1;
      
      const experience = Math.max(1, Math.min(accountAge, 30));
      const rating = 3.5 + (Math.random() * 1.5); // 3.5 - 5.0

      const formattedDoctor = {
        id: doctor._id.toString(),
        fullName: doctor.fullName || `${doctor.firstName} ${doctor.lastName}`,
        email: doctor.email,
        specialization: doctor.specialization || 'General Medicine',
        hospital: doctor.hospital || 'Medical Center',
        phoneNumber: doctor.phoneNumber?.toString(),
        licenseNumber: doctor.licenseNumber || `LIC-${doctor._id.toString().substring(0, 8)}`,
        experience,
        rating: parseFloat(rating.toFixed(1)),
        isAvailable: true,
        conditions: [],
        treatsDiabetes: doctor.diabetes || false,
        treatsHypertension: doctor.hypertension || false,
        treatsCardiovascular: doctor.cardiovascular || false,
        createdAt: doctor.createdAt,
      };

      
      return formattedDoctor;
    });

    
    
    res.json({ 
      success: true,
      doctors: formattedDoctors,
      count: formattedDoctors.length,
      message: `Found ${formattedDoctors.length} doctors`
    });
    
  } catch (error) {
    console.error("❌ DOCTOR SEARCH ERROR:", error);
    console.error("Error stack:", (error as Error).stack);
    
    res.status(500).json({ 
      success: false,
      message: "Server error during doctor search", 
      error: (error as Error).message 
    });
  }
});

// Test endpoint to check doctors in database
router.get("/test-doctors", async (req: Request, res: Response) => {
  try {
   
    await connectMongoDB();
    
    // Count total doctors
    const doctorCount = await User.countDocuments({ role: "doctor" });
   
    
    // Get all doctors with their basic info
    const allDoctors = await User.find({ role: "doctor" })
      .select("firstName lastName email specialization hospital role")
      .limit(10);

    

    res.json({
      success: true,
      totalDoctors: doctorCount,
      doctors: allDoctors,
      message: `Found ${doctorCount} doctors in database`
    });
  } catch (error) {
    console.error("❌ Test doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test doctors",
      error: (error as Error).message
    });
  }
});

// Create demo doctors if none exist
router.post("/create-demo-doctors", async (req: Request, res: Response) => {
  try {
    
    await connectMongoDB();

    // Check if demo doctors already exist
    const existingCount = await User.countDocuments({ 
      role: "doctor"
    });

   

    if (existingCount > 0) {
      return res.json({
        success: true,
        message: "Doctors already exist in database",
        count: existingCount
      });
    }

    const demoDoctors = [
      {
        firstName: "John",
        lastName: "Smith",
        fullName: "Dr. John Smith",
        email: "john.smith@hospital.com",
        phoneNumber: 15550101,
        password: "$2b$10$examplehashedpassword", // In real app, hash properly
        role: "doctor",
        specialization: "Cardiology",
        hospital: "City General Hospital",
        licenseNumber: "CARD-12345",
        diabetes: true,
        hypertension: true,
        cardiovascular: true,
        isFirstLogin: false,
        profileCompleted: true
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        fullName: "Dr. Sarah Johnson",
        email: "sarah.johnson@clinic.com",
        phoneNumber: 15550102,
        password: "$2b$10$examplehashedpassword",
        role: "doctor",
        specialization: "Endocrinology",
        hospital: "Diabetes Care Center",
        licenseNumber: "ENDO-67890",
        diabetes: true,
        hypertension: false,
        cardiovascular: false,
        isFirstLogin: false,
        profileCompleted: true
      },
      {
        firstName: "Michael",
        lastName: "Chen",
        fullName: "Dr. Michael Chen",
        email: "michael.chen@health.com",
        phoneNumber: 15550103,
        password: "$2b$10$examplehashedpassword",
        role: "doctor",
        specialization: "General Medicine",
        hospital: "Community Health Clinic",
        licenseNumber: "GEN-54321",
        diabetes: true,
        hypertension: true,
        cardiovascular: false,
        isFirstLogin: false,
        profileCompleted: true
      }
    ];

    
    await User.insertMany(demoDoctors);
    

    res.json({
      success: true,
      message: "Demo doctors created successfully",
      count: demoDoctors.length
    });
  } catch (error) {
    console.error("❌ Create demo doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create demo doctors",
      error: (error as Error).message
    });
  }
});

export default router;