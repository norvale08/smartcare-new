// FILE: ./routes/adminDoctors.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Admin authentication middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-default-secret"
    );
    
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.adminId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/admin/doctors - Get all doctors for admin
router.get("/", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    
    await connectMongoDB();

    // Get all doctors
    const doctors = await User.find({ role: "doctor" })
      .select("firstName lastName fullName email specialization hospital phoneNumber")
      .sort({ fullName: 1 });

    // Format doctors for admin component
    const formattedDoctors = doctors.map((doctor: any) => ({
      id: doctor._id.toString(),
      fullName: doctor.fullName || `${doctor.firstName} ${doctor.lastName}`,
      email: doctor.email,
      specialization: doctor.specialization || "General Medicine",
      hospital: doctor.hospital || "Medical Center",
      phoneNumber: doctor.phoneNumber
    }));

  
    res.json({
      success: true,
      doctors: formattedDoctors,
      count: formattedDoctors.length
    });

  } catch (error: any) {
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: error.message
    });
  }
});

export default router;