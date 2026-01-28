//routes/patientRelativeMessages.ts - FIXED
import express, { Response } from "express";
import Message from "../models/Message";
import Notification from "../models/notifications";
import User from "../models/user";
import { verifyToken, AuthenticatedRequest } from "../middleware/verifyToken";
import mongoose from "mongoose";

const router = express.Router();

// Get patient's relatives (Used by Patient to see who they can chat with)
router.get("/patient-relatives", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    console.log('👥 Fetching relatives for patient:', userId);

    // Find relatives monitoring this patient (userId here is the Patient's User ID)
    const relatives = await User.find({
      role: 'relative',
      monitoredPatient: new mongoose.Types.ObjectId(userId),
      invitationStatus: 'accepted'
    })
      .select('_id fullName email relationshipToPatient phoneNumber accessLevel isEmergencyContact')
      .lean();

    console.log(`✅ Found ${relatives.length} relatives`);

    res.status(200).json({ success: true, data: relatives });
  } catch (error) {
    console.error('❌ Error fetching relatives:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fetch conversation (Strictly Relative <-> Patient)
router.get("/conversation", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId } = req.query;

    console.log('📬 Fetching conversation:', { userId, otherUserId });

    if (!userId || !otherUserId) {
      return res.status(400).json({ 
        success: false, 
        message: "Both user IDs are required" 
      });
    }

    // Simple query: messages between these two users
    const query = {
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    };

    console.log('📬 Query:', JSON.stringify(query, null, 2));

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('senderId', 'fullName profilePicture email')
      .populate('receiverId', 'fullName profilePicture email')
      .lean();

    console.log(`✅ Found ${messages.length} messages`);
    
    if (messages.length > 0) {
      console.log('📨 Sample message:', {
        senderId: messages[0].senderId,
        receiverId: messages[0].receiverId,
        content: messages[0].content?.substring(0, 50)
      });
    }

    // Mark as read
    const updateResult = await Message.updateMany(
      { 
        receiverId: userId, 
        senderId: otherUserId, 
        read: false 
      },
      { read: true }
    );

    console.log(`✅ Marked ${updateResult.modifiedCount} messages as read`);

    res.status(200).json({ 
      success: true, 
      data: messages.reverse() 
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ success: false, message: "Error fetching messages" });
  }
});

// Send message (Strictly Relative <-> Patient)
router.post("/", verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { receiverId, content, type = 'text' } = req.body;

    console.log('📤 Sending message:', { 
      senderId: userId, 
      receiverId, 
      contentLength: content?.length 
    });

    if (!userId || !receiverId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: receiverId and content" 
      });
    }

    // Validate users exist
    const [sender, receiver] = await Promise.all([
      User.findById(userId).select('fullName email role'),
      User.findById(receiverId).select('fullName email role')
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log('✅ Users validated:', {
      sender: { id: sender._id, name: sender.fullName, role: sender.role },
      receiver: { id: receiver._id, name: receiver.fullName, role: receiver.role }
    });

    // Create message
    const message = new Message({
      senderId: userId,
      receiverId,
      content: content.trim(),
      type,
      read: false
    });

    await message.save();

    // Populate with full user data
    await message.populate([
      { path: 'senderId', select: '_id fullName email profilePicture' },
      { path: 'receiverId', select: '_id fullName email profilePicture' }
    ]);

    console.log('✅ Message saved:', message._id);

    // Notification Logic
    try {
      const senderName = sender.fullName || 'A family member';
      await new Notification({
        userId: receiverId,
        type: 'message',
        title: 'Family Message',
        message: `New message from ${senderName}`,
        priority: 'medium'
      }).save();
      console.log('✅ Notification created');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError);
    }

    res.status(201).json({ 
      success: true, 
      data: message, 
      message: "Message sent successfully" 
    });
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send message",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;