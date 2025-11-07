// routes/doctors/management.ts
import express from "express";
import User from "../../models/user";
import { connectMongoDB } from "../../lib/mongodb";

const router = express.Router();

// ✅ Get all doctors (for admin)
router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    await connectMongoDB();

    const doctors = await User.find({ role: "doctor" })
      .select("firstName lastName email phoneNumber specialization licenseNumber hospital diabetes hypertension conditions profileCompleted isFirstLogin createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({ doctors });
  } catch (err: any) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get single doctor by ID
router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    await connectMongoDB();

    const doctor = await User.findById(id);

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
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
        profileCompleted: doctor.profileCompleted,
        isFirstLogin: doctor.isFirstLogin,
        bio: doctor.bio,
        experienceYears: doctor.experienceYears,
        consultationHours: doctor.consultationHours,
        services: doctor.services,
        location: doctor.location,
        profilePicture: doctor.profilePicture,
        createdAt: doctor.createdAt
      }
    });
  } catch (err: any) {
    console.error("Get doctor error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Update doctor (for admin)
router.put("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await connectMongoDB();

    const updatedDoctor = await User.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({
      message: "Doctor updated successfully",
      doctor: updatedDoctor
    });
  } catch (err: any) {
    console.error("Update doctor error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Delete doctor (for admin)
router.delete("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await connectMongoDB();

    const deletedDoctor = await User.findByIdAndDelete(id);

    if (!deletedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (err: any) {
    console.error("Delete doctor error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
