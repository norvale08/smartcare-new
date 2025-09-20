import express, { Response } from "express";
import Hospital from "../models/hospital";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

router.use(verifyToken);

// Create hospital (admin only)
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { name, address, phoneNumber, email, location } = req.body;

    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res.status(400).json({ message: "Hospital already exists" });
    }

    const hospital = new Hospital({
      name,
      address,
      phoneNumber,
      email,
      location
    });

    await hospital.save();
    res.status(201).json({ message: "Hospital registered successfully", data: hospital });
  } catch (error) {
    console.error("Error registering hospital:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all hospitals (admin and patient)
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'patient') {
      return res.status(403).json({ message: "Access denied. Admin or patient role required." });
    }

    const hospitals = await Hospital.find().lean();
    res.json({ data: hospitals });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({ message: "Failed to fetch hospitals" });
  }
});

export default router;
