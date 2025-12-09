import { Request, Response } from "express";
import { connectMongoDB } from "../../../lib/mongodb";
import Patient from "../../../models/patient";

export const searchPatients = async (req: Request, res: Response) => {
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
            { fullName: { $regex: searchTerm as string, $options: "i" } },
            { firstname: { $regex: searchTerm as string, $options: "i" } },
            { lastname: { $regex: searchTerm as string, $options: "i" } },
            { email: { $regex: searchTerm as string, $options: "i" } },
            { phoneNumber: { $regex: searchTerm as string, $options: "i" } },
            { "user.email": { $regex: searchTerm as string, $options: "i" } },
            { "user.phoneNumber": { $regex: searchTerm as string, $options: "i" } },
            { "user.firstName": { $regex: searchTerm as string, $options: "i" } },
            { "user.lastName": { $regex: searchTerm as string, $options: "i" } }
          ]
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
};