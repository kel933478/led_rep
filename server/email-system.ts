import { Request, Response } from 'express';
import { storage } from './storage';

interface EmailData {
  clientIds: number[];
  subject: string;
  content: string;
  htmlContent: string;
}

import nodemailer from 'nodemailer';

// Production email service with Hostinger SMTP
class EmailService {
  private createTransporter() {
    return nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'cs@os-report.com',
        pass: 'Alpha9779@'
      }
    });
  }

  async sendEmail(to: string, subject: string, htmlContent: string, textContent: string): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      
      const mailOptions = {
        from: {
          name: 'Support Ledger',
          address: 'cs@os-report.com'
        },
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé avec succès:', {
        to,
        subject,
        messageId: result.messageId
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return false;
    }
  }

  async sendBulkEmails(emails: Array<{to: string, subject: string, htmlContent: string, textContent: string}>): Promise<{sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email.to, email.subject, email.htmlContent, email.textContent);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    }
    return processed;
  }
}

export const emailService = new EmailService();

export async function sendClientEmails(req: Request, res: Response) {
  try {
    const { clientIds, subject, content, htmlContent }: EmailData = req.body;
    
    if (!clientIds || clientIds.length === 0) {
      return res.status(400).json({ error: 'No clients selected' });
    }

    if (!subject || !htmlContent) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    // Get client details
    const emails: Array<{to: string, subject: string, htmlContent: string, textContent: string}> = [];
    
    for (const clientId of clientIds) {
      const client = await storage.getClient(clientId);
      if (client) {
        // Process template variables
        const variables = {
          clientName: client.fullName || client.email.split('@')[0],
          clientEmail: client.email,
          dashboardUrl: `${req.get('origin') || 'http://localhost:5000'}/client/dashboard`
        };

        const processedHtml = emailService.processTemplate(htmlContent, variables);
        const processedSubject = emailService.processTemplate(subject, variables);
        const processedText = emailService.processTemplate(content, variables);

        emails.push({
          to: client.email,
          subject: processedSubject,
          htmlContent: processedHtml,
          textContent: processedText
        });
      }
    }

    if (emails.length === 0) {
      return res.status(400).json({ error: 'No valid clients found' });
    }

    // Send emails
    const result = await emailService.sendBulkEmails(emails);

    // Log email activity for audit
    await storage.logEmailActivity({
      senderType: req.session.userType || 'unknown',
      senderId: req.session.userId || 0,
      recipientCount: emails.length,
      subject: subject,
      sentAt: new Date(),
      success: result.sent,
      failed: result.failed
    });

    res.json({
      sent: result.sent,
      failed: result.failed,
      total: emails.length,
      message: `Successfully sent ${result.sent} emails`
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
}

// Email templates for quick access
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome to Ledger Recovery - Your Account is Ready",
    category: "onboarding"
  },
  kycApproval: {
    subject: "KYC Verification Approved - Account Fully Activated", 
    category: "verification"
  },
  reminder: {
    subject: "Complete Your Ledger Recovery Setup - Action Required",
    category: "reminder"
  },
  custom: {
    subject: "Important Update from Ledger Recovery",
    category: "general"
  }
};