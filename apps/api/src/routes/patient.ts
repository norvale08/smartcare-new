// COMPLETE UPDATED patient.ts router with location features AND email

import express from "express";
import jwt from "jsonwebtoken";
import Patient from "../models/patient";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

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

    console.log("🔍 Fetching profile for userId:", req.userId);

    // Try to get Patient document first
    let patient = await Patient.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    
    if (patient) {
      console.log("✅ Patient profile found:", patient._id);
      return res.status(200).json({ 
        success: true,
        data: {
          _id: patient._id,
          userId: patient.userId,
          fullName: patient.fullName,
          firstname: patient.firstname,
          lastname: patient.lastname,
          email: patient.email, // ✅ ADDED email field
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
          location: patient.location,
          createdAt: patient.createdAt
        }
      });
    }

    // If no Patient document, try to get data from User
    console.log("⚠️ No Patient document found, checking User...");
    const user = await User.findById(req.userId);
    
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ 
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Check if user has profile data
    if (!user.profileCompleted) {
      console.log("⚠️ User profile not completed");
      return res.status(404).json({ 
        success: false,
        message: "Profile not completed. Please complete your profile.",
        code: "PROFILE_NOT_COMPLETED"
      });
    }

    console.log("✅ Returning User data as fallback");
    
    // Return User data in Patient format
    return res.status(200).json({ 
      success: true,
      data: {
        _id: user._id,
        userId: user._id,
        fullName: user.fullName || `${user.firstname} ${user.lastname}`,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email, // User's login email (not emergency contact)
        dob: user.dob,
        gender: user.gender,
        weight: user.weight,
        height: user.height,
        picture: user.picture,
        phoneNumber: user.phoneNumber,
        relationship: user.relationship,
        diabetes: user.diabetes || false,
        hypertension: user.hypertension || false,
        cardiovascular: user.cardiovascular || false,
        allergies: user.allergies || "",
        surgeries: user.surgeries || "",
        location: null,
        createdAt: user.createdAt
      },
      source: "user"
    });

  } catch (error) {
    console.error("❌ Fetch patient error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch patient profile",
      code: "SERVER_ERROR"
    });
  }
});

// Debug endpoint
router.get("/debug", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const patient = await Patient.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    const user = await User.findById(req.userId);

    res.status(200).json({
      success: true,
      debug: {
        userId: req.userId,
        patientExists: !!patient,
        userExists: !!user,
        patientData: patient || null,
        userData: user ? {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          firstname: user.firstname,
          lastname: user.lastname,
          profileCompleted: user.profileCompleted,
          phoneNumber: user.phoneNumber,
          dob: user.dob,
          gender: user.gender,
          weight: user.weight,
          height: user.height,
          diabetes: user.diabetes,
          hypertension: user.hypertension,
          cardiovascular: user.cardiovascular
        } : null
      }
    });
  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({ success: false, message: "Debug failed" });
  }
});

// Create patient profile
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
      ...body,
      userId: req.userId,
      selectedDiseases,
      diabetes: body.diabetes === true || body.diabetes === "true",
      hypertension: body.hypertension === true || body.hypertension === "true",
      cardiovascular:
        body.cardiovascular === true || body.cardiovascular === "true",
      // Include email if provided
      email: body.email || null, // ✅ ADDED email field
      location: body.location || null
    };

    const newPatient = new Patient(patientData);
    const savedPatient = await newPatient.save();
    console.log("✅ Patient saved:", savedPatient._id);

    // Update User record
    const userUpdateData = {
      fullName: body.fullName,
      firstname: body.firstname,
      lastname: body.lastname,
      phoneNumber: body.phoneNumber,
      dob: body.dob ? new Date(body.dob) : undefined,
      gender: body.gender,
      weight: body.weight ? parseInt(body.weight) : undefined,
      height: body.height ? parseInt(body.height) : undefined,
      relationship: body.relationship,

      diabetes: body.diabetes === true || body.diabetes === "true",
      hypertension: body.hypertension === true || body.hypertension === "true",
      cardiovascular:
        body.cardiovascular === true || body.cardiovascular === "true",

      allergies: body.allergies || "",
      surgeries: body.surgeries || "",
      conditions: body.conditions || "",

      selectedDiseases,
      profileCompleted: true,
      isFirstLogin: false,
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
        name: `${updatedUser.firstname} ${updatedUser.lastname}`,
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
        name: `${updatedUser.firstname} ${updatedUser.lastname}`,
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
      error: "Failed to save patient's profile",
      details: process.env.NODE_ENV === "development" ? details : undefined,
    });
  }
});

// Update patient profile
router.put("/", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const updatableFields = [
      "fullName",
      "dob",
      "gender",
      "weight",
      "height",
      "picture",
      "firstname",
      "lastname",
      "email", // ✅ ADDED email field
      "phoneNumber",
      "relationship",
      "diabetes",
      "hypertension",
      "cardiovascular",
      "allergies",
      "surgeries",
      "location",
    ];

    const update: any = {};
    for (const key of updatableFields) {
      if (key in req.body && req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    if (update.dob) update.dob = new Date(update.dob);
    if (update.location) update.location.updatedAt = new Date();

    const patient = await Patient.findOneAndUpdate(
      { userId: req.userId },
      { $set: update, $setOnInsert: { userId: req.userId } },
      { new: true, upsert: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // Mirror to User (but NOT email - keep emergency contact email only in Patient)
    try {
      const userUpdate: any = {};
      for (const field of ["weight", "height", "firstname", "lastname", "fullName", "phoneNumber", "dob", "gender", "diabetes", "hypertension", "cardiovascular", "allergies", "surgeries"]) {
        if (update[field] !== undefined) userUpdate[field] = update[field];
      }
      userUpdate.profileCompleted = true;
      await User.findByIdAndUpdate(req.userId, userUpdate, { new: true });
    } catch (e) {
      console.warn("Non-critical: failed to mirror fields to User", e);
    }

    // Determine redirect
    const selectedDiseases: string[] = [];
    if (patient.diabetes) selectedDiseases.push("diabetes");
    if (patient.hypertension) selectedDiseases.push("hypertension");
    if (patient.cardiovascular) selectedDiseases.push("cardiovascular");

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

    res.status(200).json({
      success: true,
      message: "Patient profile updated",
      data: patient,
      redirectTo,
    });
  } catch (error) {
    console.error("❌ Update patient error:", error);
    res.status(500).json({ message: "Failed to update patient profile" });
  }
});

// ==================== LOCATION ENDPOINTS ====================

// Update patient location
router.put("/location", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const { lat, lng, address } = req.body;

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false,
        message: "Latitude and longitude are required" 
      });
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid coordinates" 
      });
    }

    console.log("📍 Updating location for userId:", req.userId);
    console.log("Coordinates:", { lat, lng, address });

    // Update patient location
    const patient = await Patient.findOneAndUpdate(
      { userId: req.userId },
      { 
        $set: { 
          location: {
            lat,
            lng,
            address: address || "Address not provided",
            updatedAt: new Date()
          }
        } 
      },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: "Patient profile not found. Please complete your profile first." 
      });
    }

    console.log("✅ Location updated successfully");

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        location: patient.location
      }
    });
  } catch (error) {
    console.error("❌ Location update error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update location" 
    });
  }
});

// Get patient location
router.get("/location", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const patient = await Patient.findOne({ userId: req.userId });

    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: "Patient profile not found" 
      });
    }

    if (!patient.location) {
      return res.status(404).json({ 
        success: false,
        message: "Location not set. Please update your location." 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        location: patient.location
      }
    });
  } catch (error) {
    console.error("❌ Get location error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch location" 
    });
  }
});

export default router;