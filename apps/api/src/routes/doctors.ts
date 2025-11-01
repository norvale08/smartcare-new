import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

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

router.post("/create", async (req: express.Request, res: express.Response) => {
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
    }: CreateDoctorRequest = req.body;

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

    // Keep phoneNumber as string to avoid formatting issues
    const doctor = await User.create({
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber.toString(), // Keep as string
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
        phoneNumber: doctor.phoneNumber,
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
router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    console.log("=== FETCHING DOCTORS REQUEST ===");
    
    await connectMongoDB();
    console.log("Connected to MongoDB");
    
    const doctors = await User.find({ role: "doctor" })
      .select("firstName lastName email phoneNumber specialization licenseNumber hospital diabetes hypertension conditions createdAt")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${doctors.length} doctors`);
    
    // Log phone numbers for debugging
    doctors.forEach((doctor: any) => {
      console.log(`Doctor ${doctor.firstName} ${doctor.lastName}:`, {
        phoneNumber: doctor.phoneNumber,
        type: typeof doctor.phoneNumber
      });
    });
    
    res.status(200).json({ doctors });
  } catch (err: any) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

interface SpecializationQuery {
  specialization?: string;
  treatsDiabetes?: string;
  treatsHypertension?: string;
}

// Get doctors by specialization/treatment
router.get("/by-specialization", async (req: express.Request<{}, {}, {}, SpecializationQuery>, res: express.Response) => {
  try {
    const { specialization, treatsDiabetes, treatsHypertension } = req.query;
    
    await connectMongoDB();
    
    let query: any = { role: "doctor" };
    
    if (specialization) query.specialization = specialization;
    if (treatsDiabetes === 'true') query.diabetes = true;
    if (treatsHypertension === 'true') query.hypertension = true;
    
    const doctors = await User.find(query)
      .select("firstName lastName email phoneNumber specialization licenseNumber hospital diabetes hypertension conditions");
    
    res.status(200).json({ doctors });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single doctor by ID
router.get("/:id", async (req: express.Request, res: express.Response) => {
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
    
    res.status(200).json({ 
      doctor: {
        _id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phoneNumber: doctor.phoneNumber,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        hospital: doctor.hospital,
        diabetes: doctor.diabetes,
        hypertension: doctor.hypertension,
        conditions: doctor.conditions,
        createdAt: doctor.createdAt
      }
    });
  } catch (err: any) {
    console.error("Get doctor error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

interface UpdateDoctorRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | number;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  treatsDiabetes?: boolean;
  treatsHypertension?: boolean;
}

// Update doctor by ID
router.put("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      specialization,
      licenseNumber,
      hospital,
      treatsDiabetes,
      treatsHypertension
    }: UpdateDoctorRequest = req.body;

    console.log("=== DOCTOR UPDATE REQUEST ===");
    console.log("Updating doctor ID:", id);
    console.log("Update data:", req.body);

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["firstName", "lastName", "email", "phoneNumber"]
      });
    }

    if (!specialization || !licenseNumber || !hospital) {
      return res.status(400).json({ 
        message: "Missing doctor-specific fields",
        required: ["specialization", "licenseNumber", "hospital"]
      });
    }

    await connectMongoDB();

    // Check if doctor exists
    const existingDoctor = await User.findById(id);
    if (!existingDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if email is taken by another user
    const emailExists = await User.findOne({ 
      email, 
      _id: { $ne: id } 
    });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Update doctor - keep phoneNumber as string
    const updatedDoctor = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber.toString(), // Keep as string
        specialization,
        licenseNumber,
        hospital,
        diabetes: Boolean(treatsDiabetes),
        hypertension: Boolean(treatsHypertension),
        conditions: `Treats: ${treatsDiabetes ? 'Diabetes' : ''}${treatsDiabetes && treatsHypertension ? ', ' : ''}${treatsHypertension ? 'Hypertension' : ''}`.trim(),
      },
      { new: true, runValidators: true }
    );

    console.log("Doctor updated successfully:", updatedDoctor?._id);
    res.status(200).json({ 
      message: "Doctor updated successfully", 
      doctor: {
        _id: updatedDoctor?._id,
        firstName: updatedDoctor?.firstName,
        lastName: updatedDoctor?.lastName,
        email: updatedDoctor?.email,
        phoneNumber: updatedDoctor?.phoneNumber,
        specialization: updatedDoctor?.specialization,
        licenseNumber: updatedDoctor?.licenseNumber,
        hospital: updatedDoctor?.hospital,
        diabetes: updatedDoctor?.diabetes,
        hypertension: updatedDoctor?.hypertension,
        conditions: updatedDoctor?.conditions
      }
    });
  } catch (err: any) {
    console.error("Doctor update error:", err);
    res.status(500).json({ 
      message: "Server error",
      error: err.message 
    });
  }
});

// Delete doctor by ID
router.delete("/:id", async (req: express.Request, res: express.Response) => {
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