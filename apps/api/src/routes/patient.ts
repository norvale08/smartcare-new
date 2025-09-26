import express from "express";
import jwt from "jsonwebtoken";
import Patient from "../models/patient";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Simple authentication middleware
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
      userId: req.userId,
      fullName: body.fullName,
      firstname: body.firstname,
      lastname: body.lastname,
      phoneNumber: body.phoneNumber,
      dob: body.dob ? new Date(body.dob) : null,
      gender: body.gender,
      weight: body.weight ? parseInt(body.weight) : null,
      height: body.height ? parseInt(body.height) : null,
      picture: body.picture || null,
      relationship: body.relationship,

      diabetes: body.diabetes === true || body.diabetes === "true",
      hypertension: body.hypertension === true || body.hypertension === "true",
      cardiovascular: body.cardiovascular === true || body.cardiovascular === "true",

      allergies: body.allergies || "",
      surgeries: body.surgeries || "",
      doctorId: body.doctorId || null,
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
      cardiovascular: body.cardiovascular === true || body.cardiovascular === "true",

      allergies: body.allergies || "",
      surgeries: body.surgeries || "",

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

    // Safe TypeScript handling of unknown error
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

// Get the authenticated user's patient profile
router.get("/me", authenticateUser, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const patient = await Patient.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    res.status(200).json({ data: patient });
  } catch (error) {
    console.error("❌ Fetch patient error:", error);
    res.status(500).json({ message: "Failed to fetch patient profile" });
  }
});

// Update the authenticated user's patient profile
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
      "phoneNumber",
      "relationship",
      "diabetes",
      "hypertension",
      "cardiovascular",
      "allergies",
      "surgeries",
      "doctorId",
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
      { userId: req.userId },
      { $set: update, $setOnInsert: { userId: req.userId } },
      { new: true, upsert: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    // Optionally mirror some fields to User
    try {
      const userUpdate: any = {};
      if (update.weight !== undefined) userUpdate.weight = parseInt(update.weight);
      if (update.height !== undefined) userUpdate.height = parseInt(update.height);
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(req.userId, userUpdate, { new: true });
      }
    } catch (e) {
      console.warn("Non-critical: failed to mirror fields to User", e);
    }

    res.status(200).json({ message: "Patient profile updated", data: patient });
  } catch (error) {
    console.error("❌ Update patient error:", error);
    res.status(500).json({ message: "Failed to update patient profile" });
  }
});

export default router;
