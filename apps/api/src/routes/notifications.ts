// apps/api/src/routes/notifications.ts
import express, { Request, Response } from "express";
import Notification from "../models/notifications";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

// Get all notifications for the current user
router.get("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { limit = "50", read } = req.query;
    
    let query: any = { userId };
    
    if (read === "false" || read === "true") {
      query.read = read === "true";
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch notifications" 
    });
  }
});

// Get unread notifications count
router.get("/unread/count", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const count = await Notification.countDocuments({ 
      userId, 
      read: false 
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error("❌ Error counting unread notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to count unread notifications" 
    });
  }
});

// Mark notification as read
router.post("/:id/read", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark notification as read" 
    });
  }
});

// Mark all notifications as read
router.post("/read-all", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error: any) {
    console.error("❌ Error marking all notifications as read:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark all notifications as read" 
    });
  }
});

// Delete notification
router.delete("/:id", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete notification" 
    });
  }
});

export default router;