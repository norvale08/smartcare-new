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
    const port = parseInt(process.env.SMTP_PORT || '587');
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      socketTimeout: 15000,
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development',
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER) {
        console.error('SMTP_USER is not set in environment variables');
        return false;
      }
      if (!process.env.SMTP_PASS) {
        console.error('SMTP_PASS is not set in environment variables');
        return false;
      }

      await this.transporter.sendMail({
        from: `"SmartCare Healthcare" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return true;
    } catch (error: any) {
      console.error('EMAIL SEND FAILED:', error.message);
      return false;
    }
  }

  // ✅ NEW: Registration pending approval email
  async sendRegistrationPendingEmail(
    patientEmail: string,
    patientName: string
  ): Promise<boolean> {
    console.log('\n📧 Registration Pending Email:');
    console.log('   Patient:', patientName);
    console.log('   Email:', patientEmail);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .status-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 14px; 
            background: #f3f4f6;
            border-radius: 0 0 8px 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🏥 SmartCare</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">AI-Powered Remote Patient Monitoring</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Registration Received!</h2>
            <p>Dear ${patientName},</p>
            
            <p>Thank you for registering with SmartCare Healthcare System. Your account has been successfully created!</p>
            
            <div class="status-box">
              <p style="margin: 0; font-weight: 600;">
                <span style="color: #f59e0b;">⏳ Status: Pending Admin Approval</span>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                Your account is currently under review by our healthcare administrators. 
                This process typically takes 24-48 hours.
              </p>
            </div>
            
            <div class="info-box">
              <h3 style="color: #0284c7; font-size: 16px; margin-top: 0;">What happens next?</h3>
              <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                <li style="margin-bottom: 8px;">Our admin team will review your registration</li>
                <li style="margin-bottom: 8px;">Once approved, you'll receive an email with an activation link</li>
                <li style="margin-bottom: 8px;">Click the link to verify your email and activate your account</li>
                <li>You'll then be able to log in and access all SmartCare features</li>
              </ol>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
              <strong>Important:</strong> Please do not attempt to log in until you receive your approval email. 
              You will be notified via email once your account is activated.
            </p>
            
            <p style="margin-top: 30px;">
              If you have any questions, please contact our support team.<br>
              <strong>SmartCare Support Team</strong>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SmartCare Healthcare. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      SmartCare - Registration Received

      Dear ${patientName},

      Thank you for registering with SmartCare Healthcare System. Your account has been successfully created!

      STATUS: Pending Admin Approval
      Your account is currently under review by our healthcare administrators. This process typically takes 24-48 hours.

      What happens next?
      1. Our admin team will review your registration
      2. Once approved, you'll receive an email with an activation link
      3. Click the link to verify your email and activate your account
      4. You'll then be able to log in and access all SmartCare features

      Important: Please do not attempt to log in until you receive your approval email.

      If you have any questions, please contact our support team.

      SmartCare Support Team
    `;

    return this.sendEmail({
      to: patientEmail,
      subject: '✅ SmartCare Registration Received - Pending Approval',
      html,
      text,
    });
  }

  // ✅ NEW: Account approved with activation link email
  async sendAccountApprovedEmail(
    patientEmail: string,
    patientName: string,
    approvalToken: string
  ): Promise<boolean> {
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const activationLink = `${frontendBaseUrl}/activate-account?token=${approvalToken}&email=${encodeURIComponent(patientEmail)}`;

    console.log('\n✅ Account Approved Email:');
    console.log('   Patient:', patientName);
    console.log('   Email:', patientEmail);
    console.log('   Activation Link:', activationLink);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { 
            background: #10b981; 
            color: white !important; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            font-weight: 600;
            font-size: 16px;
          }
          .button:hover { background: #059669; }
          .success-box {
            background: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
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
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 14px; 
            background: #f3f4f6;
            border-radius: 0 0 8px 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to SmartCare!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.95;">Your Account Has Been Approved</p>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Account Activation Required</h2>
            <p>Dear ${patientName},</p>
            
            <div class="success-box">
              <p style="margin: 0; font-weight: 600; color: #065f46;">
                ✅ Great news! Your SmartCare account has been approved by our admin team.
              </p>
            </div>
            
            <p>To complete your registration and access your account, please click the button below to activate your account:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${activationLink}" class="button">Activate My Account</a>
            </p>
            
            <div class="link-text">
              <strong>Or copy and paste this link into your browser:</strong><br>
              <span style="color: #10b981;">${activationLink}</span>
            </div>
            
            <div class="warning">
              <strong> Important:</strong> This activation link will expire in 7 days. 
              Please activate your account promptly to access SmartCare services.
            </div>
            
            <p style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 3px solid #0ea5e9;">
              <strong> Security Note:</strong> This link is unique to your email address (${patientEmail}). 
              Only you can use this link to activate your account.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
              Once activated, you can log in and:
            </p>
            <ul style="color: #6b7280; font-size: 14px;">
              <li>Complete your health profile</li>
              <li>Connect with healthcare providers</li>
              <li>Access 24/7 AI-powered health monitoring</li>
              <li>Receive personalized health recommendations</li>
            </ul>
            
            <p style="margin-top: 30px;">
              Welcome to SmartCare!<br>
              <strong>SmartCare Healthcare Team</strong>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SmartCare Healthcare. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              If you didn't register for SmartCare, please ignore this email or contact support.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      SmartCare - Account Approved!

      Dear ${patientName},

      Great news! Your SmartCare account has been approved by our admin team.

      To complete your registration and access your account, please visit this link:
      ${activationLink}

      IMPORTANT: 
      - This activation link will expire in 7 days
      - This link is unique to your email (${patientEmail})
      - Only you can use this link to activate your account

      Once activated, you can log in and:
      ✓ Complete your health profile
      ✓ Connect with healthcare providers
      ✓ Access 24/7 AI-powered health monitoring
      ✓ Receive personalized health recommendations

      Welcome to SmartCare!
      SmartCare Healthcare Team

      If you didn't register for SmartCare, please ignore this email or contact support.
    `;

    return this.sendEmail({
      to: patientEmail,
      subject: '🎉 Your SmartCare Account is Approved - Activate Now!',
      html,
      text,
    });
  }

  // Send password reset email to doctor
  async sendPasswordResetEmail(doctorEmail: string, resetToken: string, doctorName: string): Promise<boolean> {
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(doctorEmail)}`;
    
    console.log('\n🔗 Password Reset Email Request:');
    console.log('   Doctor:', doctorName);
    console.log('   Email:', doctorEmail);
    console.log('   Reset Link:', resetLink);
    
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

  // Send invitation email to relative/family member
  async sendRelativeInvitationEmail(
    relativeEmail: string,
    relativeName: string,
    patientName: string,
    relationship: string,
    setupToken: string,
    accessLevel: string
  ): Promise<boolean> {
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const setupLink = `${frontendBaseUrl}/relatives/setup?token=${setupToken}&email=${encodeURIComponent(relativeEmail)}`;
    
    console.log('\n👨‍👩‍👧‍👦 Relative Invitation Email:');
    console.log('   Relative:', relativeName);
    console.log('   Email:', relativeEmail);
    console.log('   Patient:', patientName);
    console.log('   Setup Link:', setupLink);
    
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
            margin-bottom: 8px;
          }
          .permission-check {
            color: #10b981;
            margin-right: 8px;
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
              <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
              <p style="margin: 5px 0;"><strong>Your Relationship:</strong> ${relationship}</p>
              <p style="margin: 5px 0;"><strong>Access Level:</strong> ${accessLevelFormatted}</p>
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
            
            <div class="warning">
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

  // Send general communication email
  async sendGeneralCommunication(
    doctorEmail: string, 
    doctorName: string, 
    subject: string, 
    message: string
  ): Promise<boolean> {
    console.log('\n📢 General Communication Email:');
    console.log('   Doctor:', doctorName);
    console.log('   Email:', doctorEmail);
    console.log('   Subject:', subject);

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

  async testConnection(): Promise<boolean> {
    console.log('\n🔧 Testing SMTP Connection...');
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully!');
      return true;
    } catch (error: any) {
      console.error('❌ SMTP connection failed:', error.message);
      return false;
    }
  }

  async sendTestEmail(toEmail?: string): Promise<boolean> {
    const testEmail = toEmail || process.env.SMTP_USER;
    if (!testEmail) {
      console.error('❌ No email address provided for test');
      return false;
    }

    console.log('\n🧪 Sending test email to:', testEmail);
    
    return this.sendEmail({
      to: testEmail,
      subject: 'Test Email - Healthcare System',
      html: `
        <!DOCTYPE html>
        <html>
        <body>
          <h2>Test Email</h2>
          <p>This is a test email from your Healthcare System.</p>
          <p>If you receive this, your email configuration is working correctly!</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </body>
        </html>
      `,
      text: `Test Email - If you receive this, your email configuration is working correctly!\nTime: ${new Date().toLocaleString()}`
    });
  }
}

export const emailService = new EmailService();