// routes/doctorMe.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-default-secret"
    ) as { userId: string };

    await connectMongoDB();
    
    // Find user and ensure they are a doctor
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if user is a doctor
    if (user.role !== "doctor") {
      res.status(403).json({ message: "Access denied. User is not a doctor." });
      return;
    }

    // Return comprehensive doctor data
    const doctorData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      specialization: user.specialization,
      licenseNumber: user.licenseNumber,
      hospital: user.hospital,
      diabetes: user.diabetes,
      hypertension: user.hypertension,
      conditions: user.conditions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({ doctor: doctorData });
  } catch (error) {
    console.error("Fetch doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;