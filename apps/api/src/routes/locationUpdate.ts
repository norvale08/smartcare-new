// routes/locationUpdate.ts
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Patient from "../models/patient";

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string };
}

const authenticateUser = (req: AuthRequest, res: Response, next: any) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Update patient location
router.post("/update", authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, latitude, longitude, address } = req.body;
    
    // Support both field name conventions
    const finalLat = lat || latitude;
    const finalLng = lng || longitude;
    
    if (!finalLat || !finalLng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

  

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user?.id },
      {
        $set: {
          location: {
            lat: finalLat,
            lng: finalLng,
            address: address || "Unknown address",
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!patient) {
      console.error(" Patient not found for userId:", req.user?.id);
      return res.status(404).json({ message: "Patient not found" });
    }

    
    res.json({ message: "Location updated successfully", location: patient.location });
  } catch (err: any) {
    console.error(" Error updating location:", err.message);
    res.status(500).json({ error: "Failed to update location" });
  }
});

export default router;
