//routes/admin.ts
import express from "express";
import User from "../models/user";
import Patient from "../models/patient";

const router = express.Router();

// Middleware to check admin
function isAdmin(req: any, res: any, next: any) {
  if (req.session?.user && req.session.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
}

// Get all users (patients + doctors)
router.get("/users", isAdmin, async (_req, res) => {
  try {
    const users = await User.find({}, "-password"); // hide password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get all patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().populate("doctorId", "firstName lastName specialty");
    res.json(patients);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get all doctors (for assignment dropdown)
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" });
    res.json(doctors);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Assign a doctor to a patient
router.put("/assign", async (req, res) => {
  const { patientId, doctorId } = req.body;
  try {
    const updated = await Patient.findByIdAndUpdate(
      patientId,
      { doctorId },
      { new: true }
    ).populate("doctorId", "firstName lastName specialty");

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
