import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Patient from "../models/patient";
import User from "../models/user";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

// Admin authentication middleware
const authenticateAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || req.body.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your-default-secret");
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin rights required." });
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    console.log("✅ Admin authenticated:", decoded.userId);
    next();
  } catch (error) {
    console.error("❌ Admin authentication failed:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get all patients for admin dashboard
router.get("/patients", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const {
      page = 1,
      limit = 10,
      search = "",
      disease = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};

    // Search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } },
        { "user.phoneNumber": { $regex: search, $options: "i" } }
      ];
    }

    // Disease filter
    if (disease) {
      if (disease === "diabetes") {
        filter.diabetes = true;
      } else if (disease === "hypertension") {
        filter.hypertension = true;
      }
    }

    // Get patients with user data
    const patients = await Patient.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: filter
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          firstname: 1, // Emergency contact first name
          lastname: 1, // Emergency contact last name
          phoneNumber: 1, // Emergency contact phone number
          relationship: 1, // Emergency contact relationship
          dob: 1,
          gender: 1,
          weight: 1,
          height: 1,
          diabetes: 1,
          hypertension: 1,
          picture: 1,
          profileCompleted: "$user.profileCompleted",
          createdAt: 1,
          updatedAt: 1,
          // Patient's actual contact info from User model
          patientEmail: "$user.email",
          patientPhone: "$user.phoneNumber",
          patientFirstName: "$user.firstName",
          patientLastName: "$user.lastName"
        }
      },
      {
        $sort: { [sortBy as string]: sortOrder === "desc" ? -1 : 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limitNum
      }
    ]);

    // Get total count for pagination
    const totalPatients = await Patient.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: filter
      },
      {
        $count: "total"
      }
    ]);

    const totalPatientsCount = totalPatients.length > 0 ? totalPatients[0].total : 0;

    // Get disease statistics
    const diabetesCount = await Patient.countDocuments({ diabetes: true });
    const hypertensionCount = await Patient.countDocuments({ hypertension: true });
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

    res.status(200).json({
      success: true,
      data: {
        patients,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalPatientsCount / limitNum),
          totalPatients: totalPatientsCount,
          hasNext: pageNum < Math.ceil(totalPatientsCount / limitNum),
          hasPrev: pageNum > 1
        },
        statistics: {
          totalPatients: totalPatientsCount,
          totalUsers,
          diabetesCount,
          hypertensionCount
        }
      }
    });

  } catch (error) {
    console.error("❌ Admin fetch patients error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch patients",
      code: "SERVER_ERROR"
    });
  }
});

// Get patient details by ID
router.get("/patients/:id", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const patient = await Patient.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          firstname: 1, // Emergency contact first name
          lastname: 1, // Emergency contact last name
          phoneNumber: 1, // Emergency contact phone number
          relationship: 1, // Emergency contact relationship
          dob: 1,
          gender: 1,
          weight: 1,
          height: 1,
          diabetes: 1,
          hypertension: 1,
          allergies: 1,
          surgeries: 1,
          picture: 1,
          profileCompleted: "$user.profileCompleted",
          createdAt: 1,
          updatedAt: 1,
          // Patient's actual contact info from User model
          patientEmail: "$user.email",
          patientPhone: "$user.phoneNumber",
          patientFirstName: "$user.firstName",
          patientLastName: "$user.lastName"
        }
      }
    ]);

    if (!patient || patient.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    res.status(200).json({
      success: true,
      data: patient[0]
    });

  } catch (error) {
    console.error("❌ Admin fetch patient details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient details"
    });
  }
});

// Get dashboard statistics
router.get("/statistics", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const [
      totalPatients,
      totalUsers,
      diabetesCount,
      hypertensionCount,
      recentPatients
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: { $ne: "admin" } }),
      Patient.countDocuments({ diabetes: true }),
      Patient.countDocuments({ hypertension: true }),
      Patient.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            fullName: 1,
            diabetes: 1,
            hypertension: 1,
            patientEmail: "$user.email",
            createdAt: 1
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 5
        }
      ])
    ]);

    // Get monthly registration stats
    const monthlyStats = await Patient.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        totalUsers,
        diabetesCount,
        hypertensionCount,
        recentPatients,
        monthlyStats
      }
    });

  } catch (error) {
    console.error("❌ Admin statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
});

// Delete patient
router.delete("/patients/:id", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Delete the patient record
    await Patient.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully"
    });

  } catch (error) {
    console.error("❌ Admin delete patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete patient"
    });
  }
});

// Search patients with enhanced search
router.get("/search", authenticateAdmin, async (req: any, res: any) => {
  try {
    await connectMongoDB();

    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Search term is required"
      });
    }

    const patients = await Patient.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          $or: [
            { fullName: { $regex: searchTerm, $options: "i" } },
            { firstname: { $regex: searchTerm, $options: "i" } },
            { lastname: { $regex: searchTerm, $options: "i" } },
            { "user.email": { $regex: searchTerm, $options: "i" } },
            { "user.phoneNumber": { $regex: searchTerm, $options: "i" } },
            { "user.firstName": { $regex: searchTerm, $options: "i" } },
            { "user.lastName": { $regex: searchTerm, $options: "i" } }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          firstname: 1,
          lastname: 1,
          phoneNumber: 1,
          relationship: 1,
          diabetes: 1,
          hypertension: 1,
          patientEmail: "$user.email",
          patientPhone: "$user.phoneNumber",
          patientFirstName: "$user.firstName",
          patientLastName: "$user.lastName",
          createdAt: 1
        }
      },
      {
        $limit: 20
      }
    ]);

    res.status(200).json({
      success: true,
      data: patients
    });

  } catch (error) {
    console.error("❌ Admin search patients error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search patients"
    });
  }
});

export default router;