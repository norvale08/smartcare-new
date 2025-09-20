import express from "express";
import AssignmentRequest from "../models/assignmentRequest";
import Patient from "../models/patient";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import { connectMongoDB } from "../lib/mongodb";

const router = express.Router();

router.use(verifyToken);

// Create assignment request (patient only)
router.post("/request", async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!; // ✅ non-null assertion

    if (user.role !== "patient") {
      return res.status(403).json({ message: "Access denied. Patient role required." });
    }

    await connectMongoDB();

    const { doctorId, hospitalId, type, message } = req.body;

    if (!doctorId && !hospitalId) {
      return res.status(400).json({ message: "Doctor or hospital ID required" });
    }

    if (type !== "doctor" && type !== "hospital") {
      return res.status(400).json({ message: "Invalid type" });
    }

    // Fetch the patient's Patient profile ID
    const patientProfile = await Patient.findOne({ userId: user.userId });
    if (!patientProfile) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    const patientId = patientProfile._id;

    // Check if request already exists
    const existingRequest = await AssignmentRequest.findOne({
      patientId,
      doctorId: doctorId || null,
      hospitalId: hospitalId || null,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already pending" });
    }

    const requestData = {
      patientId,
      doctorId: doctorId || undefined,
      hospitalId: hospitalId || undefined,
      type,
      message: message || "",
    };

    const newRequest = new AssignmentRequest(requestData);
    await newRequest.save();

    res.status(201).json({ message: "Request sent successfully", data: newRequest });
  } catch (error) {
    console.error("Error creating assignment request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get pending requests for doctor
router.get("/requests", async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!; // ✅

    if (user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied. Doctor role required." });
    }

    await connectMongoDB();

    const requests = await AssignmentRequest.find({
      doctorId: user.userId,
      status: "pending",
    })
      .populate("patientId", "fullName email phoneNumber")
      .populate("hospitalId", "name address")
      .lean();

    res.json({ data: requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
});

// Accept request
router.patch("/:id/accept", async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!; // ✅

    if (user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied. Doctor role required." });
    }

    await connectMongoDB();

    const request = await AssignmentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.doctorId?.toString() !== user.userId) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already assessed" });
    }

    request.status = "accepted";
    request.assessedAt = new Date();
    await request.save();

    // Optional: Update patient's assignedDoctor field here

    res.json({ message: "Request accepted", data: request });
  } catch (error) {
    console.error("Error accepting request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reject request
router.patch("/:id/reject", async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!; // ✅

    if (user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied. Doctor role required." });
    }

    await connectMongoDB();

    const request = await AssignmentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.doctorId?.toString() !== user.userId) {
      return res.status(403).json({ message: "Not authorized to reject this request" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already assessed" });
    }

    request.status = "rejected";
    request.assessedAt = new Date();
    await request.save();

    res.json({ message: "Request rejected", data: request });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
