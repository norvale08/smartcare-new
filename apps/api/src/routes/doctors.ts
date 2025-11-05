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

    // Create doctor with all necessary fields
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
      // Initialize arrays for patient management
      pendingRequests: [],
      assignedPatients: []
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
        treatsHypertension: doctor.hypertension,
        pendingRequests: doctor.pendingRequests,
        assignedPatients: doctor.assignedPatients
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
      .select("firstName lastName email phoneNumber specialization licenseNumber hospital diabetes hypertension conditions pendingRequests assignedPatients createdAt")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${doctors.length} doctors`);
    
    // Enhanced logging for debugging
    doctors.forEach((doctor: any) => {
      console.log(`Doctor ${doctor.firstName} ${doctor.lastName}:`, {
        phoneNumber: doctor.phoneNumber,
        pendingRequests: doctor.pendingRequests?.length || 0,
        assignedPatients: doctor.assignedPatients?.length || 0,
        hasPendingRequestsField: doctor.pendingRequests !== undefined,
        hasAssignedPatientsField: doctor.assignedPatients !== undefined
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
      .select("firstName lastName email phoneNumber specialization licenseNumber hospital diabetes hypertension conditions pendingRequests assignedPatients");
    
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
        pendingRequests: doctor.pendingRequests || [],
        assignedPatients: doctor.assignedPatients || [],
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

    // Update doctor
    const updatedDoctor = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber.toString(),
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
        conditions: updatedDoctor?.conditions,
        pendingRequests: updatedDoctor?.pendingRequests,
        assignedPatients: updatedDoctor?.assignedPatients
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

// Get doctor's pending requests
router.get("/:id/pending-requests", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    
    await connectMongoDB();
    
    const doctor = await User.findById(id).populate('pendingRequests.patientId');
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    if (doctor.role !== "doctor") {
      return res.status(400).json({ message: "User is not a doctor" });
    }
    
    const pendingRequests = (doctor.pendingRequests || [])
      .filter((req: any) => req.status === 'pending')
      .map((req: any) => ({
        requestId: req._id,
        patientId: req.patientId?._id,
        patientName: req.patientName || `${req.patientId?.firstName} ${req.patientId?.lastName}`,
        requestedAt: req.requestedAt,
        status: req.status
      }));
    
    res.status(200).json({ 
      pendingRequests,
      count: pendingRequests.length
    });
  } catch (err: any) {
    console.error("Get pending requests error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get doctor's assigned patients
router.get("/:id/assigned-patients", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    
    await connectMongoDB();
    
    const doctor = await User.findById(id).populate('assignedPatients');
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    if (doctor.role !== "doctor") {
      return res.status(400).json({ message: "User is not a doctor" });
    }
    
    const assignedPatients = (doctor.assignedPatients || []).map((patient: any) => ({
      id: patient._id.toString(),
      fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
      age: patient.age || calculateAge(patient.dob),
      gender: patient.gender,
      condition: getPatientCondition(patient),
      lastVisit: patient.lastVisit || new Date().toISOString(),
      status: 'stable',
      phoneNumber: patient.phoneNumber,
      email: patient.email
    }));

    // Helper function to calculate age from DOB
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

    // Helper function to determine patient condition
    function getPatientCondition(patient: any): "hypertension" | "diabetes" | "both" {
      if (patient.hypertension && patient.diabetes) return "both";
      if (patient.hypertension) return "hypertension";
      if (patient.diabetes) return "diabetes";
      return "hypertension"; // default
    }
    
    res.status(200).json({ 
      assignedPatients,
      count: assignedPatients.length
    });
  } catch (err: any) {
    console.error("Get assigned patients error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;