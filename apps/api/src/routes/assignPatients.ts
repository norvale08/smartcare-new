// routes/assignPatient.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    // Check for token
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

    const { patientId } = req.body;

    if (!patientId) {
      res.status(400).json({ message: "Patient ID is required" });
      return;
    }

    await connectMongoDB();

    // Find doctor (current logged-in user)
    const doctor = await User.findById(decoded.userId);
    if (!doctor) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    if (doctor.role !== "doctor") {
      res.status(403).json({ message: "Only doctors can assign patients" });
      return;
    }

    // Find patient
    const patient = await User.findById(patientId);
    if (!patient) {
      res.status(404).json({ message: "Patient not found" });
      return;
    }

    if (patient.role !== "patient") {
      res.status(400).json({ message: "Can only assign patients" });
      return;
    }

    // Ensure assignedPatients exists
    if (!doctor.assignedPatients) {
      doctor.assignedPatients = [];
    }

    // Check if already assigned
    if (doctor.assignedPatients.includes(patientId)) {
      res.status(400).json({ message: "Patient already assigned" });
      return;
    }

    // Assign and save
    doctor.assignedPatients.push(patientId);
    await doctor.save();

    res.json({
      message: "Patient assigned successfully",
      patient: {
        id: patient._id,
        fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
      },
    });
  } catch (error) {
    console.error("Patient assignment error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

export default router;
