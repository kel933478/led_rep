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
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@ledger-recuperation.com';
    
    // Configuration conditionnelle pour éviter les erreurs SMTP en développement
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const config: EmailConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };
      this.transporter = nodemailer.createTransport(config);
    } else {
      // Transporteur de développement pour éviter les erreurs
      this.transporter = {
        sendMail: async () => {
          console.log('Email simulé - Configuration SMTP non fournie');
          return { messageId: 'dev-simulation' };
        }
      } as any;
    }
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

  async sendAdminActionNotification(
    adminEmail: string, 
    action: string, 
    targetClient: string, 
    details: any
  ): Promise<boolean> {
    try {
      const actionDescriptions: Record<string, string> = {
        'client_status_update': 'Client Account Status Modified',
        'client_kyc_approval': 'KYC Document Approved',
        'client_kyc_rejection': 'KYC Document Rejected',
        'client_password_reset': 'Client Password Reset',
        'client_balance_update': 'Client Balance Modified',
        'bulk_operations': 'Bulk Operations Performed',
        'client_risk_update': 'Client Risk Level Changed',
        'admin_note_added': 'Admin Note Added'
      };

      const actionTitle = actionDescriptions[action] || 'Administrative Action';

      const mailOptions = {
        from: this.fromEmail,
        to: adminEmail,
        subject: `Admin Action Confirmation - ${actionTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
              <h2 style="color: #00D4AA;">Admin Action Confirmation</h2>
            </div>
            <div style="padding: 20px;">
              <h3 style="color: #333;">${actionTitle}</h3>
              <p>The following administrative action was performed:</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Action:</strong> ${actionTitle}</p>
                <p><strong>Target Client:</strong> ${targetClient}</p>
                <p><strong>Performed By:</strong> ${adminEmail}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                ${details.amount ? `<p><strong>Amount:</strong> $${details.amount.toLocaleString()}</p>` : ''}
                ${details.riskLevel ? `<p><strong>New Risk Level:</strong> ${details.riskLevel}</p>` : ''}
                ${details.status !== undefined ? `<p><strong>New Status:</strong> ${details.status ? 'Active' : 'Inactive'}</p>` : ''}
                ${details.reason ? `<p><strong>Reason:</strong> ${details.reason}</p>` : ''}
              </div>

              ${this.generateActionSpecificContent(action, details)}

              <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;">
                <p><strong>Security Note:</strong> This email confirms an administrative action performed on the Ledger Récupération platform. If you did not perform this action, please contact security immediately.</p>
              </div>

              <p>Best regards,<br>Ledger Récupération Security Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending admin action notification:', error);
      return false;
    }
  }

  private generateActionSpecificContent(action: string, details: any): string {
    switch (action) {
      case 'bulk_operations':
        return `
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Bulk Operation Details:</strong></p>
            <ul>
              <li>Operation Type: ${details.operation}</li>
              <li>Clients Affected: ${details.clientCount || 'Multiple'}</li>
              <li>Success Rate: ${details.successRate || 'N/A'}</li>
            </ul>
          </div>
        `;
      
      case 'client_kyc_approval':
      case 'client_kyc_rejection':
        return `
          <div style="background: ${action === 'client_kyc_approval' ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>KYC Review Details:</strong></p>
            <ul>
              <li>Document Type: ${details.documentType || 'Identity Document'}</li>
              <li>Review Status: ${action === 'client_kyc_approval' ? 'Approved' : 'Rejected'}</li>
              ${details.reviewNotes ? `<li>Review Notes: ${details.reviewNotes}</li>` : ''}
            </ul>
          </div>
        `;

      case 'client_password_reset':
        return `
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Password Reset Details:</strong></p>
            <ul>
              <li>Temporary Password Generated: Yes</li>
              <li>Client Notification: Sent</li>
              <li>Reset Method: Administrative Override</li>
            </ul>
          </div>
        `;

      default:
        return '';
    }
  }

  async sendAdminLoginAlert(adminEmail: string, loginDetails: any): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: adminEmail,
        subject: 'Admin Login Alert - Ledger Récupération',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
              <h2 style="color: #00D4AA;">Admin Login Alert</h2>
            </div>
            <div style="padding: 20px;">
              <p>An administrator login was detected on your account:</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Email:</strong> ${adminEmail}</p>
                <p><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${loginDetails.ip || 'Unknown'}</p>
                <p><strong>User Agent:</strong> ${loginDetails.userAgent || 'Unknown'}</p>
                <p><strong>Location:</strong> ${loginDetails.location || 'Unknown'}</p>
              </div>

              <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;">
                <p><strong>Security Notice:</strong> If this login was not performed by you, please:</p>
                <ul>
                  <li>Change your password immediately</li>
                  <li>Review recent administrative actions</li>
                  <li>Contact the security team</li>
                </ul>
              </div>

              <p>Best regards,<br>Ledger Récupération Security Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending admin login alert:', error);
      return false;
    }
  }

  async sendBulkOperationSummary(
    adminEmail: string, 
    operation: string, 
    results: any
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: adminEmail,
        subject: `Bulk Operation Complete - ${operation}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
              <h2 style="color: #00D4AA;">Bulk Operation Summary</h2>
            </div>
            <div style="padding: 20px;">
              <h3 style="color: #333;">Operation: ${operation.replace('_', ' ').toUpperCase()}</h3>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>Summary:</h4>
                <ul>
                  <li><strong>Total Clients:</strong> ${results.summary?.total || results.total || 0}</li>
                  <li><strong>Successful:</strong> ${results.summary?.successful || results.successful || 0}</li>
                  <li><strong>Failed:</strong> ${results.summary?.failed || results.failed || 0}</li>
                  <li><strong>Success Rate:</strong> ${results.summary ? 
                    Math.round((results.summary.successful / results.summary.total) * 100) : 0}%</li>
                </ul>
              </div>

              ${results.errors && results.errors.length > 0 ? `
                <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                  <h4>Errors:</h4>
                  <ul>
                    ${results.errors.slice(0, 5).map((error: any) => `
                      <li>Client ${error.clientId}: ${error.error}</li>
                    `).join('')}
                    ${results.errors.length > 5 ? `<li>... and ${results.errors.length - 5} more errors</li>` : ''}
                  </ul>
                </div>
              ` : ''}

              <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <p><strong>Operation completed successfully.</strong> All changes have been logged for audit purposes.</p>
              </div>

              <p>Performed by: ${adminEmail}<br>
              Timestamp: ${new Date().toLocaleString()}</p>

              <p>Best regards,<br>Ledger Récupération Admin Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending bulk operation summary:', error);
      return false;
    }
  }

  async sendHighRiskClientAlert(
    adminEmail: string, 
    clientData: any, 
    riskFactors: string[]
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: adminEmail,
        subject: 'High Risk Client Alert - Immediate Review Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
              <h1>Ledger Récupération</h1>
              <h2>⚠️ HIGH RISK CLIENT ALERT</h2>
            </div>
            <div style="padding: 20px;">
              <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h3 style="color: #721c24;">Immediate Review Required</h3>
                <p>A client has been flagged as high-risk and requires immediate administrative review.</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>Client Information:</h4>
                <ul>
                  <li><strong>Email:</strong> ${clientData.email}</li>
                  <li><strong>Client ID:</strong> ${clientData.id}</li>
                  <li><strong>Current Risk Level:</strong> ${clientData.riskLevel || 'Not Set'}</li>
                  <li><strong>Account Value:</strong> $${(clientData.amount || 0).toLocaleString()}</li>
                  <li><strong>KYC Status:</strong> ${clientData.kycCompleted ? 'Completed' : 'Pending'}</li>
                </ul>
              </div>

              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h4>Risk Factors Detected:</h4>
                <ul>
                  ${riskFactors.map(factor => `<li>${factor}</li>`).join('')}
                </ul>
              </div>

              <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc;">
                <h4>Recommended Actions:</h4>
                <ul>
                  <li>Review client transaction history</li>
                  <li>Verify KYC documentation</li>
                  <li>Consider account restrictions if necessary</li>
                  <li>Document review findings</li>
                </ul>
              </div>

              <p><strong>This alert was generated automatically based on system monitoring.</strong></p>
              <p>Timestamp: ${new Date().toLocaleString()}</p>

              <p>Best regards,<br>Ledger Récupération Security Team</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending high risk client alert:', error);
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