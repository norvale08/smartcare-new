import { Request, Response } from "express";
import { connectMongoDB } from "../../../lib/mongodb";
import Patient from "../../../models/patient";
import User from "../../../models/user";

export const getStatistics = async (req: Request, res: Response) => {
  try {
    await connectMongoDB();

    const [
      totalPatients,
      totalUsers,
      diabetesCount,
      hypertensionCount,
      recentPatients,
      totalRelatives,
      pendingRelatives,
      activeRelatives,
      completedRelativeProfiles
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
            email: 1,
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
      ]),
      User.countDocuments({ role: "relative" }),
      User.countDocuments({ role: "relative", invitationStatus: "pending" }),
      User.countDocuments({ role: "relative", invitationStatus: "accepted" }),
      User.countDocuments({ role: "relative", profileCompleted: true })
    ]);

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

    const relativeMonthlyStats = await User.aggregate([
      {
        $match: { role: "relative" }
      },
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
        totalRelatives,
        pendingRelatives,
        activeRelatives,
        completedRelativeProfiles,
        recentPatients,
        monthlyStats,
        relativeMonthlyStats
      }
    });

  } catch (error) {
    console.error("❌ Admin statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
};