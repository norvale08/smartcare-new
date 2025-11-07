// routes/doctors/registration.ts
import express from "express";
import bcrypt from "bcryptjs";
import User from "../../models/user";
import { connectMongoDB } from "../../lib/mongodb";

const router = express.Router();

interface CreateDoctorRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | number;
  password: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  treatsDiabetes?: boolean;
  treatsHypertension?: boolean;
}


router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const { 
      firstName, lastName, email, phoneNumber, password,
      specialization, licenseNumber, hospital, treatsDiabetes, treatsHypertension
    }: CreateDoctorRequest = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["firstName", "lastName", "email", "password", "phoneNumber"]
      });
    }

    if (!specialization || !licenseNumber || !hospital) {
      return res.status(400).json({ 
        message: "Missing professional fields",
        required: ["specialization", "licenseNumber", "hospital"]
      });
    }

    await connectMongoDB();

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    
    const doctor = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber.toString(),
      password: hashedPassword,
      role: "doctor",
      specialization,
      licenseNumber,
      hospital,
      diabetes: Boolean(treatsDiabetes),
      hypertension: Boolean(treatsHypertension),
      conditions: `Treats: ${treatsDiabetes ? 'Diabetes' : ''}${treatsDiabetes && treatsHypertension ? ', ' : ''}${treatsHypertension ? 'Hypertension' : ''}`.trim(),
      profileCompleted: false, // Profile not completed yet
      isFirstLogin: true, // First login flag
      pendingRequests: [],
      assignedPatients: []
    });

    res.status(201).json({ 
      message: "Doctor registered successfully. Please complete your profile.",
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        profileCompleted: doctor.profileCompleted,
        isFirstLogin: doctor.isFirstLogin
      }
    });
  } catch (err: any) {
    console.error("Doctor registration error:", err);
    res.status(500).json({ 
      message: "Server error during registration",
      error: err.message 
    });
  }
});

export default router;