// routes/patientSearch.ts
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-default-secret"
    ) as { userId: string };

    await connectMongoDB();

    // Ensure user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Optional: allow only doctors to search for patients
    if (user.role !== "doctor") {
      res.status(403).json({ message: "Access denied. Only doctors can search patients." });
      return;
    }

    // Get query params
    const query = (req.query.q as string) || "";
    const condition = (req.query.condition as string) || "all";

    // Build search query for patients
    let searchQuery: any = { role: "patient" };

    if (query) {
      searchQuery.$or = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    // Filter by condition
    if (condition !== "all") {
      if (condition === "hypertension") {
        searchQuery.hypertension = true;
      } else if (condition === "diabetes") {
        searchQuery.diabetes = true;
      } else if (condition === "both") {
        searchQuery.$and = [{ hypertension: true }, { diabetes: true }];
      }
    }

    // Find patients
    const patients = await User.find(searchQuery)
      .select("firstName lastName fullName email phoneNumber diabetes hypertension cardiovascular createdAt")
      .limit(20)
      .sort({ createdAt: -1 });

    // Format response
    const formattedPatients = patients.map((patient) => {
      let condition: "hypertension" | "diabetes" | "both" | "cardiovascular" = "hypertension";

      if (patient.diabetes && patient.hypertension) condition = "both";
      else if (patient.diabetes) condition = "diabetes";
      else if (patient.hypertension) condition = "hypertension";
      else if (patient.cardiovascular) condition = "cardiovascular";

      return {
        id: patient._id.toString(),
        fullName: patient.fullName || `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phoneNumber: patient.phoneNumber?.toString(),
        condition,
        createdAt: patient.createdAt,
      };
    });

    res.json({ patients: formattedPatients });
  } catch (error) {
    console.error("Patient search error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

export default router;
