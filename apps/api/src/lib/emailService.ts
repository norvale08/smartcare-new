import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"Healthcare System" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`✅ Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  // Send password reset email to doctor
  async sendPasswordResetEmail(doctorEmail: string, resetToken: string, doctorName: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(doctorEmail)}`;
    
    console.log('🔗 Generated reset link for doctor:', resetLink);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { 
            background: #2563eb; 
            color: white !important; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            font-weight: 600;
          }
          .button:hover { background: #1d4ed8; }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 14px; 
            background: #f3f4f6;
            border-radius: 0 0 8px 8px;
          }
          .link-text { 
            color: #6b7280; 
            font-size: 12px; 
            word-break: break-all; 
            margin-top: 20px; 
            padding: 15px;
            background: #fff;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🏥 Healthcare System</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p>Dear Dr. ${doctorName},</p>
            <p>You have been registered in our Healthcare System. To set your password and access your account, please click the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Set Your Password</a>
            </p>
            <div class="link-text">
              <strong>Or copy and paste this link into your browser:</strong><br>
              <span style="color: #2563eb;">${resetLink}</span>
            </div>
            <div class="warning">
              <strong>⏰ Important:</strong> This link will expire in 24 hours.
            </div>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email and contact our support team.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>Healthcare System Admin</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Healthcare System. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request
      
      Dear Dr. ${doctorName},
      
      You have been registered in our Healthcare System. To set your password and access your account, please visit:
      ${resetLink}
      
      This link will expire in 24 hours. If you didn't request this, please ignore this email.
      
      Best regards,
      Healthcare System Admin
    `;

    return this.sendEmail({
      to: doctorEmail,
      subject: 'Set Your Password - Healthcare System',
      html,
      text,
    });
  }

  // Send invitation email to relative/family member ONLY
  async sendRelativeInvitationEmail(
    relativeEmail: string,
    relativeName: string,
    patientName: string,
    relationship: string,
    setupToken: string,
    accessLevel: string
  ): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const setupLink = `${frontendUrl}/relatives/setup?token=${setupToken}&email=${encodeURIComponent(relativeEmail)}`;
    
    console.log('🔗 Generated setup link for relative:', setupLink);
    
    // Format access level for display
    const accessLevelFormatted = accessLevel === 'view_only' ? 'View Only' :
                                accessLevel === 'caretaker' ? 'Caretaker' :
                                accessLevel === 'emergency_only' ? 'Emergency Only' : accessLevel;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { 
            background: #7c3aed; 
            color: white !important; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            font-weight: 600;
          }
          .button:hover { background: #6d28d9; }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 14px; 
            background: #f3f4f6;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .permissions-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .permission-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
          }
          .permission-check {
            color: #10b981;
            margin-right: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">👨‍👩‍👧‍👦 Family Health Access</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Healthcare System</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Access Granted to ${patientName}'s Health Profile</h2>
            <p>Dear ${relativeName},</p>
            
            <div class="info-box">
              <p style="margin: 0 0 10px 0; font-weight: 600;">
                <span style="color: #0ea5e9;">📋 Invitation Details:</span>
              </p>
              <p><strong>Patient:</strong> ${patientName}</p>
              <p><strong>Your Relationship:</strong> ${relationship}</p>
              <p><strong>Access Level:</strong> ${accessLevelFormatted}</p>
            </div>
            
            <p>You've been granted access to monitor ${patientName}'s health information and medical records. To activate your account and set your password, please click the button below:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${setupLink}" class="button">Activate Your Account</a>
            </p>
            
            <div class="permissions-box">
              <h3 style="color: #1f2937; font-size: 16px; margin-top: 0;">What You Can Access:</h3>
              <div class="permission-item">
                <span class="permission-check">✓</span>
                <span>View ${patientName}'s health profile</span>
              </div>
              <div class="permission-item">
                <span class="permission-check">✓</span>
                <span>Access medical history and conditions</span>
              </div>
              <div class="permission-item">
                <span class="permission-check">✓</span>
                <span>View emergency contact information</span>
              </div>
              ${accessLevel === 'caretaker' ? `
              <div class="permission-item">
                <span class="permission-check">✓</span>
                <span>Message doctors on behalf of ${patientName}</span>
              </div>
              ` : ''}
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px;">
              <strong>⏰ Important:</strong> This invitation link will expire in 7 days. Please activate your account promptly.
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This access was granted by the healthcare provider. 
              If you believe this is a mistake, please contact our support team immediately.
            </p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>Healthcare System Admin</strong><br>
              <span style="color: #6b7280; font-size: 14px;">Family Access Team</span>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Healthcare System. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              This is an automated message regarding family health access. For questions, contact: support@healthcaresystem.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Family Health Access Invitation
      
      Dear ${relativeName},
      
      You've been granted access to monitor ${patientName}'s health information.
      
      Invitation Details:
      - Patient: ${patientName}
      - Your Relationship: ${relationship}
      - Access Level: ${accessLevelFormatted}
      
      To activate your account and set your password, please visit:
      ${setupLink}
      
      This invitation link will expire in 7 days.
      
      What You Can Access:
      ✓ View ${patientName}'s health profile
      ✓ Access medical history and conditions
      ✓ View emergency contact information
      ${accessLevel === 'caretaker' ? '✓ Message doctors on behalf of the patient\n' : ''}
      
      This access was granted by the healthcare provider. 
      If you believe this is a mistake, please contact our support team.
      
      Best regards,
      Healthcare System Admin
      Family Access Team
    `;

    return this.sendEmail({
      to: relativeEmail,
      subject: `📋 Health Access Invitation for ${patientName}`,
      html,
      text,
    });
  }

  // Send general communication email (existing, unchanged)
  async sendGeneralCommunication(
    doctorEmail: string, 
    doctorName: string, 
    subject: string, 
    message: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 14px; 
            background: #f3f4f6;
            border-radius: 0 0 8px 8px;
          }
          .message { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #2563eb;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🏥 Healthcare System</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">${subject}</h2>
            <p>Dear Dr. ${doctorName},</p>
            <div class="message">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 30px;">Best regards,<br><strong>Healthcare System Admin</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Healthcare System. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${subject}
      
      Dear Dr. ${doctorName},
      
      ${message}
      
      Best regards,
      Healthcare System Admin
    `;

    return this.sendEmail({
      to: doctorEmail,
      subject: subject,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();