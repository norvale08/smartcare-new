import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../../models/user";
import PasswordResetToken from "../../models/resetToken";
import { emailService } from "../../lib/emailService";
import { connectMongoDB } from "../../lib/mongodb";

const router = express.Router();

// Send password reset email to doctor
router.post("/send-reset-email/:id", async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    console.log("=== SEND RESET EMAIL REQUEST ===");
    console.log("Doctor ID:", id);

    await connectMongoDB();

    const doctor = await User.findById(id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (doctor.role !== "doctor") return res.status(400).json({ message: "User is not a doctor" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    const passwordResetToken = new PasswordResetToken({
      email: doctor.email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await passwordResetToken.save();

    const emailSent = await emailService.sendPasswordResetEmail(
      doctor.email,
      resetToken,
      `${doctor.firstName} ${doctor.lastName}`
    );

    if (emailSent) {
      console.log("✅ Password reset email sent to:", doctor.email);
      res.json({ message: "Password reset email sent successfully", doctorEmail: doctor.email });
    } else {
      res.status(500).json({ message: "Failed to send password reset email" });
    }
  } catch (error: any) {
    console.error("Send reset email error:", error);
    res.status(500).json({ message: "Error sending reset email", error: error.message });
  }
});

// ✅ NEW: Reset password route (doctor clicks link and updates password)
router.post("/reset-password", async (req: express.Request, res: express.Response) => {
  try {
    const { token, newPassword } = req.body;

    console.log("=== RESET PASSWORD REQUEST ===");
    console.log("Token:", token ? token.substring(0, 10) + "..." : "none");

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    await connectMongoDB();

    const resetRecord = await PasswordResetToken.findOne({ token });
    if (!resetRecord) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (resetRecord.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ token });
      return res.status(400).json({ message: "Token expired" });
    }

    const doctor = await User.findOne({ email: resetRecord.email, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    doctor.password = hashedPassword;
    await doctor.save();

    // Delete used token
    await PasswordResetToken.deleteOne({ token });

    console.log("✅ Password reset successful for:", doctor.email);
    res.json({ message: "Password reset successful" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
});

// Send communication to multiple doctors
router.post("/send-communication", async (req: express.Request, res: express.Response) => {
  try {
    const { doctorIds, subject, message } = req.body;

    console.log("=== SEND COMMUNICATION REQUEST ===");
    console.log("Doctor IDs:", doctorIds);
    console.log("Subject:", subject);

    if (!doctorIds || !Array.isArray(doctorIds) || doctorIds.length === 0) {
      return res.status(400).json({ message: "No doctors selected" });
    }

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    await connectMongoDB();

    const doctors = await User.find({
      _id: { $in: doctorIds },
      role: "doctor",
    });

    if (doctors.length === 0) {
      return res.status(404).json({ message: "No doctors found" });
    }

    let successfulEmails = 0;
    let failedEmails = 0;

    for (const doctor of doctors) {
      try {
        const emailSent = await emailService.sendGeneralCommunication(
          doctor.email,
          `${doctor.firstName} ${doctor.lastName}`,
          subject,
          message
        );

        if (emailSent) {
          successfulEmails++;
          console.log(`✅ Email sent to: ${doctor.email}`);
        } else {
          failedEmails++;
          console.log(`❌ Failed to send email to: ${doctor.email}`);
        }
      } catch (error) {
        failedEmails++;
        console.error(`Error sending email to ${doctor.email}:`, error);
      }
    }

    res.json({
      message: `Communication sent to ${successfulEmails} doctor(s). ${failedEmails} failed.`,
      successful: successfulEmails,
      failed: failedEmails,
    });
  } catch (error: any) {
    console.error("Send communication error:", error);
    res.status(500).json({ message: "Error sending communication", error: error.message });
  }
});

// Test Gmail connection route
router.post("/test-gmail-connection", async (req: express.Request, res: express.Response) => {
  try {
    console.log("🧪 Testing Gmail connection...");
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ success: false, message: "SMTP credentials not configured" });
    }

    const testEmail = process.env.SMTP_USER;
    const emailSent = await emailService.sendPasswordResetEmail(testEmail, "test-token", "Test Doctor");

    if (emailSent) {
      res.json({ success: true, message: "Gmail test successful! Check your email inbox.", sentTo: testEmail });
    } else {
      res.status(500).json({ success: false, message: "Gmail test failed - email service returned false" });
    }
  } catch (error: any) {
    console.error("💥 Gmail test error:", error);
    res.status(500).json({ success: false, message: "Gmail test failed", error: error.message });
  }
});

// Test email with custom recipient
router.post("/test-email-custom", async (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const emailSent = await emailService.sendPasswordResetEmail(email, "test-token", "Test Doctor");

    if (emailSent) {
      res.json({ success: true, message: "Email test successful! Check your email inbox.", sentTo: email });
    } else {
      res.status(500).json({ success: false, message: "Email test failed - email service returned false" });
    }
  } catch (error: any) {
    console.error("💥 Email test error:", error);
    res.status(500).json({ success: false, message: "Email test failed", error: error.message });
  }
});

export default router;
