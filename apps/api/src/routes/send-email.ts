// routes/send-email.ts
import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

interface EmailRequest {
  name: string;
  email: string;
  message: string;
}

router.post('/send-email', async (req: Request, res: Response) => {
  try {
    const { name, email, message }: EmailRequest = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or 'hotmail', 'yahoo', etc.
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email to SmartCare
    const mailOptionsToSmartCare = {
      from: process.env.EMAIL_USER,
      to: 'smartcarehealthsystem@gmail.com',
      subject: `New Contact Form Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">New Contact Form Submission</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong style="color: #1e40af;">Name:</strong> ${name}</p>
            <p><strong style="color: #1e40af;">Email:</strong> ${email}</p>
            <p><strong style="color: #1e40af;">Message:</strong></p>
            <p style="background-color: white; padding: 15px; border-radius: 4px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            This message was sent from the SmartCare Health System contact form.
          </p>
        </div>
      `,
      replyTo: email,
    };

    // Confirmation email to the user
    const mailOptionsToUser = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting SmartCare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">Thank You for Reaching Out!</h2>
          <p>Dear ${name},</p>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong style="color: #1e40af;">Your Message:</strong></p>
            <p style="background-color: white; padding: 15px; border-radius: 4px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
          <p>Best regards,<br><strong>SmartCare Team</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            If you did not send this message, please ignore this email.
          </p>
        </div>
      `,
    };

    // Send email to SmartCare
    await transporter.sendMail(mailOptionsToSmartCare);

    // Send confirmation email to user
    await transporter.sendMail(mailOptionsToUser);

    return res.status(200).json({ 
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;