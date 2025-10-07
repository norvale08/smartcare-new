import express, { Request, Response } from "express";
import { connectMongoDB } from "../lib/mongodb";
import Hypertension from "../models/hypertensionVitals";
import Patient from "../models/patient";
import mongoose from "mongoose";

const router = express.Router();

interface HypertensionReading {
  systolic: number;
  diastolic: number;
  heartRate: number;
  createdAt: Date;
}

router.get("/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectMongoDB();
    const { userId } = req.params;

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const patient = await Patient.findOne({ userId: userObjectId });
    if (!patient || !patient.dob) {
      res.status(404).json({ message: "Patient DOB not found" });
      return;
    }

    const age = Math.floor(
      (Date.now() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );

    // Explicitly type the reading
    const latestReading = (await Hypertension.findOne({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean()) as HypertensionReading | null;

    if (!latestReading) {
      res.status(404).json({ message: "No readings found" });
      return;
    }

    const { systolic, diastolic, heartRate } = latestReading;

    const isHigh = systolic > 140 || diastolic > 90;
    const isLow = systolic < 90 || diastolic < 60;
    const heartRateAlert = heartRate < 60 || heartRate > 100;

    const status = isHigh || isLow || heartRateAlert ? "alert" : "stable";

    res.json({
      systolic,
      diastolic,
      heartRate,
      age,
      status,
    });
  } catch (error) {
    console.error("Error checking hypertension:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
