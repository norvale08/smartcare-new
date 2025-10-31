import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    console.log("=== DOCTOR CREATION REQUEST ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    
    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      password,
      specialization,
      licenseNumber,
      hospital,
      treatsDiabetes,
      treatsHypertension
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      console.log("Missing required fields");
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["firstName", "lastName", "email", "password", "phoneNumber"]
      });
    }

    if (!specialization || !licenseNumber || !hospital) {
      console.log("Missing doctor-specific fields");
      return res.status(400).json({ 
        message: "Missing doctor-specific fields",
        required: ["specialization", "licenseNumber", "hospital"]
      });
    }

    await connectMongoDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already exists:", email);
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber: Number(phoneNumber), // Convert to number for schema
      password: hashedPassword,
      role: "doctor",
      specialization,
      licenseNumber,
      hospital,
      diabetes: Boolean(treatsDiabetes),
      hypertension: Boolean(treatsHypertension),
      conditions: `Treats: ${treatsDiabetes ? 'Diabetes' : ''}${treatsDiabetes && treatsHypertension ? ', ' : ''}${treatsHypertension ? 'Hypertension' : ''}`.trim(),
    });

    console.log("Doctor created successfully:", doctor._id);
    res.status(201).json({ 
      message: "Doctor created successfully", 
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        hospital: doctor.hospital,
        treatsDiabetes: doctor.diabetes,
        treatsHypertension: doctor.hypertension
      }
    });
  } catch (err: any) {
    console.error("Doctor creation error:", err);
    res.status(500).json({ 
      message: "Server error",
      error: err.message 
    });
  }
});

// Get all doctors route (for admin to view doctors)
router.get("/", async (req, res) => {
  try {
    await connectMongoDB();
    
    const doctors = await User.find({ role: "doctor" })
      .select("firstName lastName email specialization licenseNumber hospital diabetes hypertension conditions createdAt")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ doctors });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get doctors by specialization/treatment
router.get("/by-specialization", async (req, res) => {
  try {
    const { specialization, treatsDiabetes, treatsHypertension } = req.query;
    
    await connectMongoDB();
    
    let query: any = { role: "doctor" };
    
    if (specialization) query.specialization = specialization;
    if (treatsDiabetes === 'true') query.diabetes = true;
    if (treatsHypertension === 'true') query.hypertension = true;
    
    const doctors = await User.find(query)
      .select("firstName lastName email specialization licenseNumber hospital diabetes hypertension conditions");
    
    res.status(200).json({ doctors });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Add this to your routes/doctors.ts
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await connectMongoDB();
    
    const doctor = await User.findById(id);
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    if (doctor.role !== "doctor") {
      return res.status(400).json({ message: "User is not a doctor" });
    }
    
    await User.findByIdAndDelete(id);
    
    res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (err: any) {
    console.error("Delete doctor error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
export default router;