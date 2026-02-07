import express, { Request, Response } from "express";
import Message from "../models/Message";
import Notification from "../models/notifications";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";

const router = express.Router();

// Get conversation between two users
router.get("/conversation", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId, patientId, page = 1, limit = 50 } = req.query;

    if (!userId || !otherUserId) {
      return res.status(400).json({ 
        success: false, 
        message: "User IDs are required" 
      });
    }

    const query: any = {
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    };

    if (patientId) {
      query.patientId = patientId;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .populate('senderId', 'fullName profilePicture')
      .populate('receiverId', 'fullName profilePicture')
      .populate('patientId', 'fullName');

    // Mark messages as read if they were received by current user
    await Message.updateMany(
      { receiverId: userId, senderId: otherUserId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: messages.length
      }
    });
  } catch (error: any) {
    console.error("❌ Error fetching conversation:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch conversation" 
    });
  }
});

// Get all conversations for the current user
router.get("/conversations", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { patientId, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const matchStage: any = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };

    if (patientId) {
      matchStage.patientId = patientId;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $sort: { createdAt: -1 }
      },
      {
        $facet: {
          conversations: [
            {
              $group: {
                _id: {
                  $cond: {
                    if: { $eq: ["$senderId", userId] },
                    then: "$receiverId",
                    else: "$senderId"
                  }
                },
                lastMessage: { $first: "$content" },
                lastMessageTime: { $first: "$createdAt" },
                unreadCount: {
                  $sum: {
                    $cond: [
                      { $and: [
                        { $ne: ["$senderId", userId] },
                        { $eq: ["$read", false] }
                      ]},
                      1,
                      0
                    ]
                  }
                },
                patientId: { $first: "$patientId" },
                messageType: { $first: "$type" }
              }
            },
            {
              $sort: { lastMessageTime: -1 }
            },
            {
              $skip: (parseInt(page as string) - 1) * parseInt(limit as string)
            },
            {
              $limit: parseInt(limit as string)
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user"
              }
            },
            {
              $unwind: "$user"
            },
            {
              $lookup: {
                from: "patients",
                localField: "patientId",
                foreignField: "_id",
                as: "patient"
              }
            },
            {
              $unwind: {
                path: "$patient",
                preserveNullAndEmptyArrays: true
              }
            }
          ]
        }
      }
    ];

    const result = await Message.aggregate(pipeline as any[]);
    const conversations = result[0]?.conversations || [];

    res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: conversations.length
      }
    });
  } catch (error: any) {
    console.error(" Error fetching conversations:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch conversations" 
    });
  }
});

// Send a new message
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { receiverId, patientId, content, type = 'text', metadata } = req.body;

    if (!userId || !receiverId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    const message = new Message({
      senderId: userId,
      receiverId,
      patientId,
      content,
      type,
      metadata
    });

    await message.save();
    await message.populate('senderId', 'fullName profilePicture');
    await message.populate('receiverId', 'fullName profilePicture');
    await message.populate('patientId', 'fullName');

    // Create notification for the receiver
    const notification = new Notification({
      userId: receiverId,
      type: 'message',
      title: 'New Message',
      message: `You have a new message from ${req.user?.fullName || 'Someone'}`,
      patientId,
      priority: 'medium'
    });

    await notification.save();

    res.status(201).json({
      success: true,
      data: message,
      message: "Message sent successfully"
    });
  } catch (error: any) {
    console.error(" Error sending message:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send message" 
    });
  }
});

// Mark message as read
router.patch("/:id/read", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const message = await Message.findOneAndUpdate(
      { _id: id, receiverId: userId },
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: message,
      message: "Message marked as read"
    });
  } catch (error: any) {
    console.error(" Error marking message as read:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark message as read" 
    });
  }
});

// Get unread messages count
router.get("/unread/count", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const count = await Message.countDocuments({ 
      receiverId: userId, 
      read: false 
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error: any) {
    console.error("Error counting unread messages:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to count unread messages" 
    });
  }
});

export default router;