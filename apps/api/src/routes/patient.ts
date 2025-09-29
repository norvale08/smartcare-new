import express from "express";
import jwt from "jsonwebtoken";
import Patient from "../models/patient";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";
import mongoose from "mongoose";

const router = express.Router();

// Authentication middleware
const authenticateUser = (req: any, res: any, next: any) => {
  try {
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.body.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-default-secret"
    );
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    console.log("✅ Authenticated user:", decoded.userId);
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get the authenticated user's patient profile
router.get("/me", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    console.log("=== PROFILE FETCH DEBUG ===");
    console.log("🔍 Looking for userId:", req.userId);
    console.log("🔍 userId type:", typeof req.userId);
    console.log("🔍 Is valid ObjectId:", mongoose.Types.ObjectId.isValid(req.userId));

    // Ensure userId is ObjectId
    const userId = new mongoose.Types.ObjectId(req.userId);
    console.log("🔍 Converted to ObjectId:", userId);

    // Try to get Patient document
    const patient = await Patient.findOne({ userId: userId }).sort({ createdAt: -1 });
    
    console.log("🔍 Patient query result:", patient ? "FOUND" : "NOT FOUND");
    
    if (patient) {
      console.log("✅ Patient profile found:", patient._id);
      console.log("📋 Patient data:", {
        fullName: patient.fullName,
        dob: patient.dob,
        gender: patient.gender,
        weight: patient.weight,
        height: patient.height
      });

      return res.status(200).json({ 
        success: true,
        data: {
          _id: patient._id,
          userId: patient.userId,
          fullName: patient.fullName,
          firstname: patient.firstname,
          lastname: patient.lastname,
          dob: patient.dob,
          gender: patient.gender,
          weight: patient.weight,
          height: patient.height,
          picture: patient.picture,
          phoneNumber: patient.phoneNumber,
          relationship: patient.relationship,
          diabetes: patient.diabetes,
          hypertension: patient.hypertension,
          cardiovascular: patient.cardiovascular,
          allergies: patient.allergies,
          surgeries: patient.surgeries,
          createdAt: patient.createdAt
        }
      });
    }

    // If no Patient document found, check how many exist
    const allPatients = await Patient.find({});
    console.log("📊 Total Patient documents in DB:", allPatients.length);
    
    if (allPatients.length > 0) {
      console.log("📋 Sample Patient userIds:", allPatients.slice(0, 3).map(p => ({
        _id: p._id,
        userId: p.userId,
        fullName: p.fullName
      })));
    }

    // Check if User exists
    const user = await User.findById(userId);
    console.log("🔍 User found:", user ? "YES" : "NO");
    
    if (user) {
      console.log("📋 User data:", {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileCompleted: user.profileCompleted
      });
    }

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ 
        success: false,
        message: "User account not found",
        code: "USER_NOT_FOUND"
      });
    }

    console.log("⚠️ No Patient document found for this user");
    return res.status(404).json({ 
      success: false,
      message: "Patient profile not found. Please complete your profile.",
      code: "PROFILE_NOT_FOUND",
      hint: "You may need to complete the multi-step profile form"
    });

  } catch (error) {
    console.error("❌ Fetch patient error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch patient profile",
      code: "SERVER_ERROR",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Debug endpoint - shows all data
router.get("/debug", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const userId = new mongoose.Types.ObjectId(req.userId);
    
    const patient = await Patient.findOne({ userId: userId }).sort({ createdAt: -1 });
    const allPatients = await Patient.find({}).limit(5);
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      debug: {
        requestedUserId: req.userId,
        userIdType: typeof req.userId,
        convertedUserId: userId.toString(),
        
        patientFound: !!patient,
        patientData: patient || null,
        
        userFound: !!user,
        userData: user ? {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileCompleted: user.profileCompleted,
          role: user.role
        } : null,
        
        totalPatientsInDB: allPatients.length,
        samplePatients: allPatients.map(p => ({
          _id: p._id,
          userId: p.userId.toString(),
          fullName: p.fullName,
          createdAt: p.createdAt
        }))
      }
    });
  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Debug failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.post("/", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    console.log("=== PROFILE SAVE DEBUG ===");
    console.log("Authenticated userId:", req.userId);
    console.log("Request body:", req.body);

    const body = req.body;

    // Create selectedDiseases array
    const selectedDiseases: string[] = [];
    if (body.diabetes === true || body.diabetes === "true") {
      selectedDiseases.push("diabetes");
    }
    if (body.hypertension === true || body.hypertension === "true") {
      selectedDiseases.push("hypertension");
    }
    if (body.cardiovascular === true || body.cardiovascular === "true") {
      selectedDiseases.push("cardiovascular");
    }

    console.log("🏥 Extracted diseases:", selectedDiseases);

    // Save to Patient model
    const patientData = {
      userId: new mongoose.Types.ObjectId(req.userId),
      fullName: body.fullName,
      firstname: body.firstname,
      lastname: body.lastname,
      dob: new Date(body.dob),
      gender: body.gender,
      weight: parseInt(body.weight),
      height: parseInt(body.height),
      picture: body.picture,
      phoneNumber: body.phoneNumber,
      relationship: body.relationship,
      diabetes: body.diabetes === true || body.diabetes === "true",
      hypertension: body.hypertension === true || body.hypertension === "true",
      cardiovascular: body.cardiovascular === true || body.cardiovascular === "true",
      allergies: body.allergies || "",
      surgeries: body.surgeries || "",
    };

    console.log("💾 Saving Patient data:", patientData);

    const newPatient = new Patient(patientData);
    const savedPatient = await newPatient.save();
    console.log("✅ Patient saved with _id:", savedPatient._id);
    console.log("✅ Patient userId:", savedPatient.userId);

    // Update User record
    const userUpdateData = {
      selectedDiseases,
      profileCompleted: true,
      isFirstLogin: false,
      patientProfileId: savedPatient._id,
      updatedAt: new Date(),
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      userUpdateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ User updated successfully");

    // Generate new JWT
    const newToken = jwt.sign(
      {
        userId: updatedUser._id,
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        role: updatedUser.role,
        status: "complete",
        disease: selectedDiseases,
        isFirstLogin: false,
      },
      process.env.JWT_SECRET || "your-default-secret",
      { expiresIn: "24h" }
    );

    // Determine redirect
    let redirectTo = "/dashboard";
    if (selectedDiseases.length > 0) {
      const primaryDisease = selectedDiseases[0];
      switch (primaryDisease) {
        case "diabetes":
          redirectTo = "/diabetes";
          break;
        case "hypertension":
          redirectTo = "/hypertension";
          break;
        case "cardiovascular":
          redirectTo = "/cardiovascular";
          break;
      }
    }

    console.log("🚀 Redirecting to:", redirectTo);

    res.status(201).json({
      success: true,
      message: "Profile completed successfully",
      patientId: savedPatient._id,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        profileCompleted: true,
        selectedDiseases,
      },
      token: newToken,
      redirectTo,
    });
  } catch (error) {
    console.error("❌ Profile save error:", error);

    let details: string | undefined;
    if (error instanceof Error) {
      details = error.message;
    }

    res.status(500).json({
      success: false,
      error: "Failed to save patient's profile",
      details: process.env.NODE_ENV === "development" ? details : undefined,
    });
  }
});

// Update patient profile
router.put("/", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const userId = new mongoose.Types.ObjectId(req.userId);

    const updatableFields = [
      "fullName",
      "dob",
      "gender",
      "weight",
      "height",
      "picture",
      "firstname",
      "lastname",
      "phoneNumber",
      "relationship",
      "diabetes",
      "hypertension",
      "cardiovascular",
      "allergies",
      "surgeries",
    ];

    const update: any = {};
    for (const key of updatableFields) {
      if (key in req.body && req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    if (update.dob) {
      update.dob = new Date(update.dob);
    }

    const patient = await Patient.findOneAndUpdate(
      { userId: userId },
      { $set: update, $setOnInsert: { userId: userId } },
      { new: true, upsert: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    res.status(200).json({ 
      success: true,
      message: "Patient profile updated", 
      data: patient 
    });
  } catch (error) {
    console.error("❌ Update patient error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update patient profile" 
    });
  }
});

export default router;