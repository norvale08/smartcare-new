// routes/doctor/assignedPatients.ts

import express from "express";
import User from "../../models/user";
import { connectMongoDB } from "../../lib/mongodb";

const router = express.Router();

/**
 * ===========================
 * GET /:id/pending-requests
 * ===========================
 * Fetch all pending patient requests for a given doctor.
 */
router.get("/:id/pending-requests", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    await connectMongoDB();

    const doctor = await User.findById(id).populate("pendingRequests.patientId");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.role !== "doctor") {
      return res.status(400).json({ message: "User is not a doctor" });
    }

    const pendingRequests = (doctor.pendingRequests || [])
      .filter((req: any) => req.status === "pending")
      .map((req: any) => ({
        requestId: req._id,
        patientId: req.patientId?._id,
        patientName: req.patientName || `${req.patientId?.firstName} ${req.patientId?.lastName}`,
        requestedAt: req.requestedAt,
        status: req.status,
      }));

    res.status(200).json({
      pendingRequests,
      count: pendingRequests.length,
    });
  } catch (err: any) {
    console.error("Get pending requests error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * ==============================
 * GET /:id/assigned-patients
 * ==============================
 * Fetch all assigned patients for a given doctor.
 */
router.get("/:id/assigned-patients", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    await connectMongoDB();

    const doctor = await User.findById(id).populate("assignedPatients");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.role !== "doctor") {
      return res.status(400).json({ message: "User is not a doctor" });
    }

    const assignedPatients = (doctor.assignedPatients || []).map((patient: any) => ({
      id: patient._id.toString(),
      userId: patient._id.toString(), 
      fullName: patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
      age: patient.age || calculateAge(patient.dob),
      gender: patient.gender,
      condition: getPatientCondition(patient),
      lastVisit: patient.lastVisit || new Date().toISOString(),
      status: "stable",
      phoneNumber: patient.phoneNumber,
      email: patient.email,
    }));

    res.status(200).json({
      assignedPatients,
      count: assignedPatients.length,
    });
  } catch (err: any) {
    console.error("Get assigned patients error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



function calculateAge(dob: Date): number {
  if (!dob) return 0;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getPatientCondition(patient: any): "hypertension" | "diabetes" | "both" {
  if (patient.hypertension && patient.diabetes) return "both";
  if (patient.hypertension) return "hypertension";
  if (patient.diabetes) return "diabetes";
  return "hypertension"; // default
}

export default router;
