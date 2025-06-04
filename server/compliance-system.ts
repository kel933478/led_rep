import { db } from './db';
import { clients, auditLogs } from '@shared/schema';
import { eq, gte, lte, sql } from 'drizzle-orm';

interface AMLReport {
  id: string;
  clientId: number;
  reportType: 'suspicious_activity' | 'large_transaction' | 'velocity_check';
  riskScore: number;
  details: any;
  generatedAt: Date;
  status: 'pending' | 'reviewed' | 'filed';
}

interface SanctionsCheckResult {
  clientId: number;
  name: string;
  matches: SanctionsMatch[];
  riskLevel: 'low' | 'medium' | 'high';
  checkedAt: Date;
  source: string;
}

interface SanctionsMatch {
  name: string;
  type: 'individual' | 'entity';
  source: 'OFAC' | 'EU' | 'UN';
  matchScore: number;
  details: any;
}

interface ComplianceRule {
  id: string;
  name: string;
  type: 'transaction_limit' | 'velocity_check' | 'kyc_requirement';
  parameters: any;
  isActive: boolean;
}

class ComplianceSystem {
  private amlReports: Map<string, AMLReport> = new Map();
  private sanctionsResults: Map<number, SanctionsCheckResult> = new Map();
  private complianceRules: Map<string, ComplianceRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Default compliance rules
    this.complianceRules.set('large_transaction', {
      id: 'large_transaction',
      name: 'Large Transaction Monitoring',
      type: 'transaction_limit',
      parameters: { threshold: 10000, currency: 'USD' },
      isActive: true
    });

    this.complianceRules.set('velocity_check', {
      id: 'velocity_check',
      name: 'Transaction Velocity Check',
      type: 'velocity_check',
      parameters: { maxTransactions: 10, timeWindow: 24 },
      isActive: true
    });

    this.complianceRules.set('kyc_requirement', {
      id: 'kyc_requirement',
      name: 'KYC Completion Requirement',
      type: 'kyc_requirement',
      parameters: { requiredForAmount: 1000 },
      isActive: true
    });
  }

  // AML Monitoring
  async performAMLCheck(clientId: number, transactionAmount: number, transactionType: string): Promise<AMLReport | null> {
    const client = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!client.length) {
      throw new Error('Client not found');
    }

    const riskFactors = await this.calculateRiskFactors(clientId, transactionAmount, transactionType);
    const riskScore = this.calculateOverallRiskScore(riskFactors);

    // Generate report if risk score exceeds threshold
    if (riskScore >= 70) {
      const reportId = `aml_${Date.now()}_${clientId}`;
      const report: AMLReport = {
        id: reportId,
        clientId,
        reportType: this.determineReportType(riskFactors),
        riskScore,
        details: {
          transactionAmount,
          transactionType,
          riskFactors,
          clientInfo: {
            email: client[0].email,
            kycStatus: client[0].kycCompleted,
            accountAge: this.calculateAccountAge(client[0].createdAt)
          }
        },
        generatedAt: new Date(),
        status: 'pending'
      };

      this.amlReports.set(reportId, report);
      await this.logComplianceEvent('aml_report_generated', clientId, { reportId, riskScore });
      
      return report;
    }

    return null;
  }

  private async calculateRiskFactors(clientId: number, amount: number, type: string): Promise<any> {
    const factors = {
      largeAmount: amount > 10000,
      unusualVelocity: await this.checkTransactionVelocity(clientId),
      newAccount: await this.isNewAccount(clientId),
      incompletedKYC: await this.hasIncompleteKYC(clientId),
      geographicRisk: false, // Would integrate with geo-location services
      patternAnomaly: await this.detectPatternAnomaly(clientId, amount, type)
    };

    return factors;
  }

  private async checkTransactionVelocity(clientId: number): Promise<boolean> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTransactions = await db.select()
      .from(auditLogs)
      .where(sql`${auditLogs.userId} = ${clientId} AND ${auditLogs.action} LIKE '%transaction%' AND ${auditLogs.createdAt} >= ${last24Hours}`);

    return recentTransactions.length > 10;
  }

  private async isNewAccount(clientId: number): Promise<boolean> {
    const client = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!client.length) return false;

    const accountAge = this.calculateAccountAge(client[0].createdAt);
    return accountAge < 30; // Less than 30 days
  }

  private async hasIncompleteKYC(clientId: number): Promise<boolean> {
    const client = await db.select().from(clients).where(eq(clients.id, clientId));
    return !client[0]?.kycCompleted;
  }

  private async detectPatternAnomaly(clientId: number, amount: number, type: string): Promise<boolean> {
    // Simple pattern detection - would be more sophisticated in production
    const recentTransactions = await db.select()
      .from(auditLogs)
      .where(sql`${auditLogs.userId} = ${clientId} AND ${auditLogs.action} LIKE '%transaction%'`)
      .limit(10);

    // Check for round number patterns
    const isRoundNumber = amount % 1000 === 0;
    const hasRepeatedAmounts = recentTransactions.length > 3;

    return isRoundNumber && hasRepeatedAmounts;
  }

  private calculateOverallRiskScore(factors: any): number {
    let score = 0;
    
    if (factors.largeAmount) score += 25;
    if (factors.unusualVelocity) score += 30;
    if (factors.newAccount) score += 15;
    if (factors.incompletedKYC) score += 20;
    if (factors.geographicRisk) score += 10;
    if (factors.patternAnomaly) score += 20;

    return Math.min(100, score);
  }

  private determineReportType(factors: any): AMLReport['reportType'] {
    if (factors.largeAmount) return 'large_transaction';
    if (factors.unusualVelocity) return 'velocity_check';
    return 'suspicious_activity';
  }

  private calculateAccountAge(createdAt: Date | null): number {
    if (!createdAt) return 0;
    return Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Sanctions Screening
  async performSanctionsCheck(clientId: number, clientName: string): Promise<SanctionsCheckResult> {
    // This would integrate with actual sanctions databases
    // For now, simulate the check
    const matches = await this.checkSanctionsDatabases(clientName);
    
    const result: SanctionsCheckResult = {
      clientId,
      name: clientName,
      matches,
      riskLevel: this.assessSanctionsRisk(matches),
      checkedAt: new Date(),
      source: 'integrated_sanctions_api'
    };

    this.sanctionsResults.set(clientId, result);
    await this.logComplianceEvent('sanctions_check', clientId, { riskLevel: result.riskLevel, matchCount: matches.length });

    return result;
  }

  private async checkSanctionsDatabases(name: string): Promise<SanctionsMatch[]> {
    // Simulate database checks - would integrate with real APIs
    const matches: SanctionsMatch[] = [];

    // OFAC check simulation
    if (name.toLowerCase().includes('test') || name.toLowerCase().includes('sample')) {
      matches.push({
        name: 'Test Sanctioned Entity',
        type: 'entity',
        source: 'OFAC',
        matchScore: 85,
        details: { reason: 'Simulated match for testing' }
      });
    }

    return matches;
  }

  private assessSanctionsRisk(matches: SanctionsMatch[]): 'low' | 'medium' | 'high' {
    if (matches.length === 0) return 'low';
    
    const highConfidenceMatches = matches.filter(m => m.matchScore > 90);
    if (highConfidenceMatches.length > 0) return 'high';
    
    const mediumConfidenceMatches = matches.filter(m => m.matchScore > 70);
    if (mediumConfidenceMatches.length > 0) return 'medium';
    
    return 'low';
  }

  // Regulatory Reporting
  async generateSARReport(reportId: string): Promise<any> {
    const report = this.amlReports.get(reportId);
    if (!report) {
      throw new Error('AML report not found');
    }

    const sarReport = {
      reportId,
      reportType: 'Suspicious Activity Report',
      generatedAt: new Date().toISOString(),
      filingInstitution: {
        name: 'Ledger Récupération',
        ein: '12-3456789',
        address: 'Business Address'
      },
      suspiciousActivity: {
        clientId: report.clientId,
        transactionDetails: report.details,
        riskScore: report.riskScore,
        suspicionIndicators: this.generateSuspicionIndicators(report)
      },
      narrative: this.generateSARNarrative(report),
      filingDate: new Date().toISOString(),
      contactInfo: {
        name: 'Compliance Officer',
        phone: '+1-555-0123',
        email: 'compliance@ledger-recuperation.com'
      }
    };

    await this.logComplianceEvent('sar_generated', report.clientId, { reportId });
    return sarReport;
  }

  private generateSuspicionIndicators(report: AMLReport): string[] {
    const indicators = [];
    const factors = report.details.riskFactors;

    if (factors.largeAmount) indicators.push('Large transaction amount');
    if (factors.unusualVelocity) indicators.push('Unusual transaction velocity');
    if (factors.newAccount) indicators.push('New account activity');
    if (factors.incompletedKYC) indicators.push('Incomplete customer identification');
    if (factors.patternAnomaly) indicators.push('Unusual transaction patterns');

    return indicators;
  }

  private generateSARNarrative(report: AMLReport): string {
    return `Suspicious activity detected for client ${report.clientId} with risk score ${report.riskScore}. ` +
           `Transaction involved ${report.details.transactionType} of $${report.details.transactionAmount}. ` +
           `Risk factors include: ${this.generateSuspicionIndicators(report).join(', ')}.`;
  }

  async generateCTRReport(clientId: number, transactionAmount: number): Promise<any> {
    if (transactionAmount < 10000) {
      throw new Error('CTR not required for transactions under $10,000');
    }

    const client = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!client.length) {
      throw new Error('Client not found');
    }

    const ctrReport = {
      reportType: 'Currency Transaction Report',
      generatedAt: new Date().toISOString(),
      transactionDate: new Date().toISOString(),
      amount: transactionAmount,
      currency: 'USD',
      transactionType: 'crypto_purchase',
      customer: {
        id: clientId,
        email: client[0].email,
        kycStatus: client[0].kycCompleted
      },
      filingInstitution: {
        name: 'Ledger Récupération',
        ein: '12-3456789'
      }
    };

    await this.logComplianceEvent('ctr_generated', clientId, { amount: transactionAmount });
    return ctrReport;
  }

  // Audit Trail Management
  async generateComplianceAuditTrail(startDate: Date, endDate: Date): Promise<any> {
    const auditEvents = await db.select()
      .from(auditLogs)
      .where(sql`${auditLogs.action} LIKE '%compliance%' OR ${auditLogs.action} LIKE '%aml%' OR ${auditLogs.action} LIKE '%sanctions%'`)
      .where(sql`${auditLogs.createdAt} >= ${startDate} AND ${auditLogs.createdAt} <= ${endDate}`);

    const summary = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      totalEvents: auditEvents.length,
      eventTypes: this.categorizeAuditEvents(auditEvents),
      riskMetrics: await this.calculateRiskMetrics(startDate, endDate),
      reportsSummary: {
        amlReports: Array.from(this.amlReports.values()).filter(r => 
          r.generatedAt >= startDate && r.generatedAt <= endDate
        ).length,
        sanctionsChecks: Array.from(this.sanctionsResults.values()).filter(r => 
          r.checkedAt >= startDate && r.checkedAt <= endDate
        ).length
      }
    };

    return {
      summary,
      detailedEvents: auditEvents,
      generatedAt: new Date().toISOString()
    };
  }

  private categorizeAuditEvents(events: any[]): Record<string, number> {
    return events.reduce((categories, event) => {
      const category = event.action.split('_')[0];
      categories[category] = (categories[category] || 0) + 1;
      return categories;
    }, {});
  }

  private async calculateRiskMetrics(startDate: Date, endDate: Date): Promise<any> {
    const periodReports = Array.from(this.amlReports.values()).filter(r => 
      r.generatedAt >= startDate && r.generatedAt <= endDate
    );

    const highRiskCount = periodReports.filter(r => r.riskScore >= 80).length;
    const mediumRiskCount = periodReports.filter(r => r.riskScore >= 50 && r.riskScore < 80).length;
    const lowRiskCount = periodReports.filter(r => r.riskScore < 50).length;

    return {
      totalRiskAssessments: periodReports.length,
      riskDistribution: {
        high: highRiskCount,
        medium: mediumRiskCount,
        low: lowRiskCount
      },
      averageRiskScore: periodReports.length > 0 
        ? periodReports.reduce((sum, r) => sum + r.riskScore, 0) / periodReports.length 
        : 0
    };
  }

  private async logComplianceEvent(action: string, clientId: number, details: any): Promise<void> {
    await db.insert(auditLogs).values({
      action,
      userId: clientId,
      userType: 'client',
      details: JSON.stringify(details),
      ipAddress: '127.0.0.1',
      userAgent: 'compliance-system'
    });
  }

  // Rule Management
  async updateComplianceRule(ruleId: string, updates: Partial<ComplianceRule>): Promise<boolean> {
    const rule = this.complianceRules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    await this.logComplianceEvent('rule_updated', 0, { ruleId, updates });
    return true;
  }

  async getComplianceStatus(): Promise<any> {
    return {
      activeRules: Array.from(this.complianceRules.values()).filter(r => r.isActive).length,
      pendingAMLReports: Array.from(this.amlReports.values()).filter(r => r.status === 'pending').length,
      recentSanctionsChecks: Array.from(this.sanctionsResults.values()).filter(r => 
        r.checkedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      systemStatus: 'operational'
    };
  }
}

export const complianceSystem = new ComplianceSystem();