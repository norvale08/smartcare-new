// COMPLETE FIXED patient.ts router with proper ObjectId handling

import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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

    
    next();
  } catch (error) {
    console.error(" Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Helper function to convert userId to ObjectId
const toObjectId = (userId: any) => {
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      return new mongoose.Types.ObjectId(userId);
    }
  } catch (e) {
    console.error("ObjectId conversion failed:", e);
  }
  return userId;
};

// Get the authenticated user's patient profile
router.get("/me", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

   

    // Convert userId to ObjectId for consistent querying
    const userIdObj = toObjectId(req.userId);
    

    // Try to get Patient document with ObjectId
    let patient = await Patient.findOne({ userId: userIdObj }).sort({ createdAt: -1 });
    
    if (patient) {
      
      return res.status(200).json({ 
        success: true,
        data: {
          _id: patient._id,
          userId: patient.userId,
          fullName: patient.fullName,
          firstname: patient.firstname,
          lastname: patient.lastname,
          email: patient.email,
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
    
    const user = await User.findById(userIdObj);
    
    if (!user) {
      
      return res.status(404).json({ 
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }


    // Check if user has profile data
    if (!user.profileCompleted) {
      
      return res.status(404).json({ 
        success: false,
        message: "Profile not completed. Please complete your profile.",
        code: "PROFILE_NOT_COMPLETED"
      });
    }

   
    
    // Return User data in Patient format
    return res.status(200).json({ 
      success: true,
      data: {
        _id: user._id,
        userId: user._id,
        fullName: user.fullName || `${user.firstName} ${user.lastName}`,
        firstname: user.firstName || user.firstname,
        lastname: user.lastName || user.lastname,
        email: user.email,
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
    console.error(" Fetch patient error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch patient profile",
      code: "SERVER_ERROR",
      error: process.env.NODE_ENV === "development" ? String(error) : undefined
    });
  }
});

// Debug endpoint
router.get("/debug", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const userIdObj = toObjectId(req.userId);

    const patient = await Patient.findOne({ userId: userIdObj }).sort({ createdAt: -1 });
    const user = await User.findById(userIdObj);

    // Also check if there are ANY patients with string userId
    const patientWithString = await Patient.findOne({ userId: req.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      debug: {
        userId: req.userId,
        userIdType: typeof req.userId,
        convertedUserId: userIdObj,
        patientExists: !!patient,
        patientWithStringExists: !!patientWithString,
        userExists: !!user,
        patientData: patient || null,
        patientWithStringData: patientWithString || null,
        userData: user ? {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
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
    console.error(" Debug error:", error);
    res.status(500).json({ success: false, message: "Debug failed", error: String(error) });
  }
});

// Create patient profile
router.post("/", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const body = req.body;

    // Convert userId to ObjectId
    const userIdObj = toObjectId(req.userId);

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

   

    // Save to Patient model with ObjectId
    const patientData = {
      ...body,
      userId: userIdObj, // Use ObjectId here
      selectedDiseases,
      diabetes: body.diabetes === true || body.diabetes === "true",
      hypertension: body.hypertension === true || body.hypertension === "true",
      cardiovascular: body.cardiovascular === true || body.cardiovascular === "true",
      email: body.email || null,
      location: body.location || null
    };

    const newPatient = new Patient(patientData);
    const savedPatient = await newPatient.save();
    

    // Update User record with ObjectId
    const userUpdateData = {
      fullName: body.fullName,
      firstName: body.firstname,
      lastName: body.lastname,
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
      cardiovascular: body.cardiovascular === true || body.cardiovascular === "true",

      allergies: body.allergies || "",
      surgeries: body.surgeries || "",
      conditions: body.conditions || "",

      selectedDiseases,
      profileCompleted: true,
      isFirstLogin: false,
      updatedAt: new Date(),
    };

    const updatedUser = await User.findByIdAndUpdate(
      userIdObj, // Use ObjectId here
      userUpdateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate new JWT
    const newToken = jwt.sign(
      {
        userId: updatedUser._id.toString(),
        email: updatedUser.email,
        name: `${updatedUser.firstName || updatedUser.firstname} ${updatedUser.lastName || updatedUser.lastname}`,
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

    

    res.status(201).json({
      success: true,
      message: "Profile completed successfully",
      patientId: savedPatient._id,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: `${updatedUser.firstName || updatedUser.firstname} ${updatedUser.lastName || updatedUser.lastname}`,
        profileCompleted: true,
        selectedDiseases,
      },
      token: newToken,
      redirectTo,
    });
  } catch (error) {
    console.error("Profile save error:", error);

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

    const userIdObj = toObjectId(req.userId);

    const updatableFields = [
      "fullName",
      "dob",
      "gender",
      "weight",
      "height",
      "picture",
      "firstname",
      "lastname",
      "email",
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
      { userId: userIdObj },
      { $set: update, $setOnInsert: { userId: userIdObj } },
      { new: true, upsert: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // Mirror to User
    try {
      const userUpdate: any = {};
      for (const field of ["weight", "height", "firstname", "lastname", "fullName", "phoneNumber", "dob", "gender", "diabetes", "hypertension", "cardiovascular", "allergies", "surgeries"]) {
        if (update[field] !== undefined) userUpdate[field] = update[field];
      }
      
      // Also update firstName/lastName for consistency
      if (update.firstname) userUpdate.firstName = update.firstname;
      if (update.lastname) userUpdate.lastName = update.lastname;
      
      userUpdate.profileCompleted = true;
      await User.findByIdAndUpdate(userIdObj, userUpdate, { new: true });
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
    console.error("Update patient error:", error);
    res.status(500).json({ message: "Failed to update patient profile" });
  }
});


// Update patient location
router.put("/location", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const { lat, lng, address } = req.body;
    const userIdObj = toObjectId(req.userId);

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

  
    // Update patient location
    const patient = await Patient.findOneAndUpdate(
      { userId: userIdObj },
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

    

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        location: patient.location
      }
    });
  } catch (error) {
    console.error("Location update error:", error);
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

    const userIdObj = toObjectId(req.userId);
    const patient = await Patient.findOne({ userId: userIdObj });

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
    console.error(" Get location error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch location" 
    });
  }
});

export default router;