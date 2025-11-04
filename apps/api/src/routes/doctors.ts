import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user";
import PasswordResetToken from "../models/resetToken";
import { emailService } from "../lib/emailService";
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

// Send password reset email to doctor
router.post("/:id/send-reset-email", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    
    console.log("=== SEND RESET EMAIL REQUEST ===");
    console.log("Doctor ID:", id);

    await connectMongoDB();

    // Find doctor
    const doctor = await User.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.role !== "doctor") {
      return res.status(400).json({ message: "User is not a doctor" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Create reset token document
    const passwordResetToken = new PasswordResetToken({
      email: doctor.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await passwordResetToken.save();

    // Send email
    const emailSent = await emailService.sendPasswordResetEmail(
      doctor.email,
      resetToken,
      `${doctor.firstName} ${doctor.lastName}`
    );

    if (emailSent) {
      console.log("Password reset email sent successfully to:", doctor.email);
      res.json({ 
        message: 'Password reset email sent successfully',
        doctorEmail: doctor.email
      });
    } else {
      console.log("Failed to send email to:", doctor.email);
      res.status(500).json({ message: 'Failed to send password reset email' });
    }
  } catch (error: any) {
    console.error("Send reset email error:", error);
    res.status(500).json({ 
      message: "Error sending reset email",
      error: error.message 
    });
  }
});

// Send communication to multiple doctors
router.post("/send-communication", async (req: express.Request, res: express.Response) => {
  try {
    const { doctorIds, subject, message } = req.body;

    console.log("=== SEND COMMUNICATION REQUEST ===");
    console.log("Doctor IDs:", doctorIds);
    console.log("Subject:", subject);

    if (!doctorIds || !Array.isArray(doctorIds) || doctorIds.length === 0) {
      return res.status(400).json({ message: "No doctors selected" });
    }

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    await connectMongoDB();

    // Find all selected doctors
    const doctors = await User.find({ 
      _id: { $in: doctorIds },
      role: "doctor" 
    });

    if (doctors.length === 0) {
      return res.status(404).json({ message: "No doctors found" });
    }

    let successfulEmails = 0;
    let failedEmails = 0;

    // Send email to each doctor
    for (const doctor of doctors) {
      try {
        const emailSent = await emailService.sendGeneralCommunication(
          doctor.email,
          `${doctor.firstName} ${doctor.lastName}`,
          subject,
          message
        );

        if (emailSent) {
          successfulEmails++;
          console.log(`Email sent successfully to: ${doctor.email}`);
        } else {
          failedEmails++;
          console.log(`Failed to send email to: ${doctor.email}`);
        }
      } catch (error) {
        failedEmails++;
        console.error(`Error sending email to ${doctor.email}:`, error);
      }
    }

    const resultMessage = `Communication sent to ${successfulEmails} doctor(s). ${failedEmails} failed.`;
    console.log(resultMessage);

    res.json({ 
      message: resultMessage,
      successful: successfulEmails,
      failed: failedEmails
    });
  } catch (error: any) {
    console.error("Send communication error:", error);
    res.status(500).json({ 
      message: "Error sending communication",
      error: error.message 
    });
  }
});

// NEW: Test Gmail connection route
router.post("/test-gmail-connection", async (req: express.Request, res: express.Response) => {
  try {
    console.log("🧪 Testing Gmail connection...");
    console.log("📧 SMTP_USER:", process.env.SMTP_USER);
    console.log("🔑 SMTP_PASS length:", process.env.SMTP_PASS?.length);
    console.log("🔑 SMTP_PASS sample:", process.env.SMTP_PASS ? 
      `${process.env.SMTP_PASS.substring(0, 4)}...${process.env.SMTP_PASS.substring(process.env.SMTP_PASS.length - 4)}` : 
      "No password");

    // Check if environment variables are set
    if (!process.env.SMTP_USER) {
      console.log("❌ SMTP_USER is not set in environment variables");
      return res.status(500).json({ 
        success: false, 
        message: "SMTP_USER is not configured" 
      });
    }

    if (!process.env.SMTP_PASS) {
      console.log("❌ SMTP_PASS is not set in environment variables");
      return res.status(500).json({ 
        success: false, 
        message: "SMTP_PASS is not configured" 
      });
    }

    // Test direct email sending - use the SMTP_USER as recipient
    const testEmail = process.env.SMTP_USER; // This is now guaranteed to be a string
    const testToken = "test-token-" + Date.now();
    const testName = "Test Doctor";

    console.log("📤 Attempting to send test email to:", testEmail);
    
    const emailSent = await emailService.sendPasswordResetEmail(
      testEmail,
      testToken,
      testName
    );

    if (emailSent) {
      console.log("✅ Gmail test successful! Check your inbox at:", testEmail);
      res.json({ 
        success: true, 
        message: "Gmail test successful! Check your email inbox.",
        sentTo: testEmail
      });
    } else {
      console.log("❌ Gmail test failed - email service returned false");
      res.status(500).json({ 
        success: false, 
        message: "Gmail test failed - email service returned false" 
      });
    }
    
  } catch (error: any) {
    console.error("💥 Gmail test error:", error);
    console.error("📝 Error details:", error.message);
    
    res.status(500).json({ 
      success: false, 
      message: "Gmail test failed",
      error: error.message,
      code: error.code 
    });
  }
});

// NEW: Test email with custom recipient
router.post("/test-email-custom", async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required in request body" 
      });
    }

    console.log("🧪 Testing email to custom address:", email);
    console.log("📧 SMTP_USER:", process.env.SMTP_USER);
    console.log("🔑 SMTP_PASS configured:", !!process.env.SMTP_PASS);

    const testToken = "test-token-" + Date.now();
    const testName = "Test Doctor";

    console.log("📤 Attempting to send test email to:", email);
    
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      testToken,
      testName
    );

    if (emailSent) {
      console.log("✅ Email test successful! Check inbox at:", email);
      res.json({ 
        success: true, 
        message: "Email test successful! Check your email inbox.",
        sentTo: email
      });
    } else {
      console.log("❌ Email test failed - email service returned false");
      res.status(500).json({ 
        success: false, 
        message: "Email test failed - email service returned false" 
      });
    }
    
  } catch (error: any) {
    console.error("💥 Email test error:", error);
    console.error("📝 Error details:", error.message);
    
    res.status(500).json({ 
      success: false, 
      message: "Email test failed",
      error: error.message,
      code: error.code 
    });
  }
});

export default router;