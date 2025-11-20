// routes/assignPatient.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    // 🔐 Check for token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-default-secret"
    ) as { userId: string };

    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    await connectMongoDB();

    // 🩺 Find doctor (current logged-in user)
    const doctor = await User.findById(decoded.userId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    if (doctor.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can assign patients" });
    }

    // 👤 Find patient
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.role !== "patient") {
      return res.status(400).json({ message: "Can only assign patients" });
    }

    // 🧩 Ensure assignedPatients array exists
    if (!doctor.assignedPatients) {
      doctor.assignedPatients = [];
    }

    // 🚫 Check if already assigned
    if (doctor.assignedPatients.includes(patientId)) {
      return res.status(400).json({ message: "Patient already assigned" });
    }

    // ✅ Assign and save
    doctor.assignedPatients.push(patientId);
    await doctor.save();

    // 🧾 Return full structured patient info with userId
    res.json({
      message: "Patient assigned successfully",
      patient: {
        id: patient._id.toString(),
        userId: patient._id.toString(), // <-- 🔥 include this
        fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phoneNumber: patient.phoneNumber || null,
        condition: patient.condition || "unknown",
        createdAt: patient.createdAt || new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Patient assignment error:", error);
    res.status(500).json({
      message: "Server error",
      error: (error as Error).message,
    });
  }
});

export default router;
