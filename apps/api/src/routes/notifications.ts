import express from "express";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

router.use(verifyToken);

// Get unread notifications count (for doctors and patients)
router.get("/unread-count", async (req: AuthenticatedRequest, res) => {
  try {
    // For now, return 0 as notifications are not implemented
    // Later, query a Notifications model based on user.role and req.user.userId
    res.json({ count: 0 });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

export default router;
