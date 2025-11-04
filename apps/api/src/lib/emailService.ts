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
      console.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Send password reset email to doctor
  async sendPasswordResetEmail(doctorEmail: string, resetToken: string, doctorName: string): Promise<boolean> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Healthcare System</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Dear Dr. ${doctorName},</p>
            <p>You have been registered in our Healthcare System. To set your password and access your account, please click the button below:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Set Your Password</a>
            </p>
            <p>This link will expire in 24 hours. If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>Healthcare System Admin</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Healthcare System. All rights reserved.</p>
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

  // Send general communication email
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
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .message { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Healthcare System</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>Dear Dr. ${doctorName},</p>
            <div class="message">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p>Best regards,<br>Healthcare System Admin</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Healthcare System. All rights reserved.</p>
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