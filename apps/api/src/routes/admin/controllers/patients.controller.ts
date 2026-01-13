import { Request, Response } from "express";
import mongoose from "mongoose";
import { connectMongoDB } from "../../../lib/mongodb";
import Patient from "../../../models/patient";
import User from "../../../models/user";

interface PatientQuery {
  page?: string;
  limit?: string;
  search?: string;
  disease?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const getPatients = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const {
      page = "1",
      limit = "10",
      search = "",
      disease = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query as PatientQuery;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};

    // Search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
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
          firstname: 1,
          lastname: 1,
          email: 1,
          phoneNumber: 1,
          relationship: 1,
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
    
    // Get relatives statistics
    const totalRelatives = await User.countDocuments({ role: "relative" });
    const pendingRelatives = await User.countDocuments({ 
      role: "relative", 
      invitationStatus: "pending" 
    });

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
          hypertensionCount,
          totalRelatives,
          pendingRelatives
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
};

export const getPatientDetails = async (req: Request, res: Response) => {
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
          firstname: 1,
          lastname: 1,
          email: 1,
          phoneNumber: 1,
          relationship: 1,
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
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

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
};