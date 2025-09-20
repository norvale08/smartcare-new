import express, { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import Patient from "../models/patient";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

router.use(verifyToken);

// Register doctor (admin only)
router.post("/register", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!; // ✅ ensure req.user is not undefined

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { firstName, lastName, email, phoneNumber, password, specialty } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "doctor",
      specialty,
    });

    await doctor.save();
    res.status(201).json({ message: "Doctor registered successfully", data: doctor });
  } catch (error) {
    console.error("Error registering doctor:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all doctors (admin and patient)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!; // ✅

    if (user.role !== "admin" && user.role !== "patient") {
      return res.status(403).json({ message: "Access denied. Admin or patient role required." });
    }

    const doctors = await User.find({ role: "doctor" }).select("-password").lean();
    res.json({ data: doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// Get assigned patients for the doctor
router.get("/patients", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!; // ✅

    if (user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied. Doctor role required." });
    }

    const doctorId = user._id || user.userId; // support both
    const patients = await Patient.find({ assignedDoctor: doctorId })
      .populate("userId", "firstName lastName email phoneNumber")
      .lean();

    const formattedPatients = patients.map((p) => ({
      id: p._id,
      name: p.fullName,
      age: new Date().getFullYear() - new Date(p.dob).getFullYear(),
      gender: p.gender.charAt(0).toUpperCase() + p.gender.slice(1),
      condition: p.diabetes
        ? "Diabetes"
        : p.hypertension
        ? "Hypertension"
        : "Cardiovascular",
      vitals: {
        heartRate: "N/A",
        bloodPressure: "N/A",
        glucose: "N/A",
      },
      riskLevel: "low",
      location: p.location || null,
      lastUpdate: new Date(p.createdAt).toLocaleString(),
    }));

    res.json({ data: formattedPatients });
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ message: "Failed to fetch patients" });
  }
});

export default router;
