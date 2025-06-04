import nodemailer from 'nodemailer';
import { Client, Admin } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailSystem {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    this.fromEmail = process.env.FROM_EMAIL || 'noreply@ledger-recuperation.com';
    
    this.transporter = nodemailer.createTransport(config);
  }

  async sendKYCApprovedEmail(client: Client): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: client.email,
        subject: 'KYC Validation Approved - Ledger Récupération',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #00D4AA;">KYC Validation Approved</h2>
              <p>Dear ${client.email},</p>
              <p>Your KYC validation has been successfully approved. You can now access all features of your Ledger Récupération account.</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Log in to your dashboard</li>
                  <li>Set up your portfolio preferences</li>
                  <li>Start managing your crypto assets</li>
                </ul>
              </div>
              <p>If you have any questions, please contact our support team.</p>
              <p>Best regards,<br>Ledger Récupération Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending KYC approved email:', error);
      return false;
    }
  }

  async sendKYCRejectedEmail(client: Client, reason: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: client.email,
        subject: 'KYC Validation Required - Ledger Récupération',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #FF6B6B;">KYC Validation Required</h2>
              <p>Dear ${client.email},</p>
              <p>We need additional information to complete your KYC validation.</p>
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
              <p>Please log in to your account and resubmit the required documents.</p>
              <p>Best regards,<br>Ledger Récupération Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending KYC rejected email:', error);
      return false;
    }
  }

  async sendSecurityAlertEmail(client: Client, alertType: string, details: any): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: client.email,
        subject: 'Security Alert - Ledger Récupération',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #FF6B6B;">Security Alert</h2>
              <p>Dear ${client.email},</p>
              <p>We detected a security event on your account:</p>
              <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p><strong>Event:</strong> ${alertType}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Details:</strong> ${details.ip || 'Unknown IP'}</p>
              </div>
              <p>If this was not you, please secure your account immediately and contact support.</p>
              <p>Best regards,<br>Ledger Récupération Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending security alert email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: 'Password Reset - Ledger Récupération',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #00D4AA;">Password Reset Request</h2>
              <p>You requested a password reset for your Ledger Récupération account.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #00D4AA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this reset, please ignore this email.</p>
              <p>Best regards,<br>Ledger Récupération Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(client: Client): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: client.email,
        subject: 'Welcome to Ledger Récupération',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #00D4AA;">Welcome to Ledger Récupération</h2>
              <p>Dear ${client.email},</p>
              <p>Welcome to Ledger Récupération! Your account has been successfully created.</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Complete your KYC validation</li>
                  <li>Set up your portfolio</li>
                  <li>Explore our platform features</li>
                </ul>
              </div>
              <p>Best regards,<br>Ledger Récupération Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

export const emailSystem = new EmailSystem();