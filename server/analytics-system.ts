import { db } from './db';
import { clients, auditLogs } from '@shared/schema';
import { sql, eq, gte, lte, count, avg, sum } from 'drizzle-orm';

interface AnalyticsMetrics {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
  };
  kycMetrics: {
    totalKycSubmitted: number;
    kycApprovalRate: number;
    averageKycProcessingTime: number;
    pendingKyc: number;
  };
  portfolioMetrics: {
    totalPortfolioValue: number;
    averagePortfolioValue: number;
    topPerformingAssets: any[];
    portfolioDistribution: any[];
  };
  systemMetrics: {
    loginFrequency: number;
    sessionDuration: number;
    featureUsage: any[];
    errorRate: number;
  };
}

interface ReportData {
  period: string;
  startDate: Date;
  endDate: Date;
  metrics: AnalyticsMetrics;
  charts: any[];
  insights: string[];
}

class AnalyticsSystem {
  async generateDashboardMetrics(timeRange: string = '30d'): Promise<AnalyticsMetrics> {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange, endDate);

    const [userMetrics, kycMetrics, portfolioMetrics, systemMetrics] = await Promise.all([
      this.getUserMetrics(startDate, endDate),
      this.getKycMetrics(startDate, endDate),
      this.getPortfolioMetrics(startDate, endDate),
      this.getSystemMetrics(startDate, endDate)
    ]);

    return {
      userMetrics,
      kycMetrics,
      portfolioMetrics,
      systemMetrics
    };
  }

  private async getUserMetrics(startDate: Date, endDate: Date) {
    const totalUsers = await db.select({ count: count() }).from(clients);
    const activeUsers = await db.select({ count: count() })
      .from(clients)
      .where(gte(clients.lastConnection, startDate));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newUsersToday = await db.select({ count: count() })
      .from(clients)
      .where(gte(clients.createdAt, today));

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await db.select({ count: count() })
      .from(clients)
      .where(gte(clients.createdAt, weekAgo));

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = await db.select({ count: count() })
      .from(clients)
      .where(gte(clients.createdAt, monthAgo));

    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const newUsersLastMonth = await db.select({ count: count() })
      .from(clients)
      .where(sql`${clients.createdAt} >= ${twoMonthsAgo} AND ${clients.createdAt} < ${monthAgo}`);

    const userGrowthRate = newUsersLastMonth[0]?.count > 0 
      ? ((newUsersThisMonth[0]?.count - newUsersLastMonth[0]?.count) / newUsersLastMonth[0]?.count) * 100
      : 0;

    return {
      totalUsers: totalUsers[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
      newUsersToday: newUsersToday[0]?.count || 0,
      newUsersThisWeek: newUsersThisWeek[0]?.count || 0,
      newUsersThisMonth: newUsersThisMonth[0]?.count || 0,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100
    };
  }

  private async getKycMetrics(startDate: Date, endDate: Date) {
    const totalKycSubmitted = await db.select({ count: count() })
      .from(clients)
      .where(sql`${clients.kycFileName} IS NOT NULL`);

    const kycApproved = await db.select({ count: count() })
      .from(clients)
      .where(eq(clients.kycCompleted, true));

    const kycApprovalRate = totalKycSubmitted[0]?.count > 0 
      ? (kycApproved[0]?.count / totalKycSubmitted[0]?.count) * 100
      : 0;

    const pendingKyc = await db.select({ count: count() })
      .from(clients)
      .where(sql`${clients.kycFileName} IS NOT NULL AND ${clients.kycCompleted} IS NULL`);

    return {
      totalKycSubmitted: totalKycSubmitted[0]?.count || 0,
      kycApprovalRate: Math.round(kycApprovalRate * 100) / 100,
      averageKycProcessingTime: 24, // hours - would calculate from actual data
      pendingKyc: pendingKyc[0]?.count || 0
    };
  }

  private async getPortfolioMetrics(startDate: Date, endDate: Date) {
    const portfolios = await db.select({
      amount: clients.amount
    }).from(clients).where(sql`${clients.amount} IS NOT NULL`);

    const totalPortfolioValue = portfolios.reduce((sum, p) => sum + (p.amount || 0), 0);
    const averagePortfolioValue = portfolios.length > 0 ? totalPortfolioValue / portfolios.length : 0;

    // Mock data for top performing assets and distribution
    const topPerformingAssets = [
      { symbol: 'BTC', performance: 15.2 },
      { symbol: 'ETH', performance: 12.8 },
      { symbol: 'SOL', performance: 8.5 }
    ];

    const portfolioDistribution = [
      { asset: 'Bitcoin', percentage: 45 },
      { asset: 'Ethereum', percentage: 30 },
      { asset: 'Others', percentage: 25 }
    ];

    return {
      totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
      averagePortfolioValue: Math.round(averagePortfolioValue * 100) / 100,
      topPerformingAssets,
      portfolioDistribution
    };
  }

  private async getSystemMetrics(startDate: Date, endDate: Date) {
    const loginEvents = await db.select({ count: count() })
      .from(auditLogs)
      .where(sql`${auditLogs.action} = 'login' AND ${auditLogs.createdAt} >= ${startDate} AND ${auditLogs.createdAt} <= ${endDate}`);

    const totalEvents = await db.select({ count: count() })
      .from(auditLogs)
      .where(sql`${auditLogs.createdAt} >= ${startDate} AND ${auditLogs.createdAt} <= ${endDate}`);

    const errorEvents = await db.select({ count: count() })
      .from(auditLogs)
      .where(sql`${auditLogs.action} LIKE '%error%' AND ${auditLogs.createdAt} >= ${startDate} AND ${auditLogs.createdAt} <= ${endDate}`);

    const errorRate = totalEvents[0]?.count > 0 
      ? (errorEvents[0]?.count / totalEvents[0]?.count) * 100
      : 0;

    const featureUsage = [
      { feature: 'Dashboard View', usage: 850 },
      { feature: 'Portfolio Management', usage: 620 },
      { feature: 'KYC Submission', usage: 340 }
    ];

    return {
      loginFrequency: loginEvents[0]?.count || 0,
      sessionDuration: 25.5, // minutes - would calculate from session data
      featureUsage,
      errorRate: Math.round(errorRate * 100) / 100
    };
  }

  async generateAutomatedReport(reportType: 'daily' | 'weekly' | 'monthly'): Promise<ReportData> {
    const endDate = new Date();
    let startDate: Date;
    let period: string;

    switch (reportType) {
      case 'daily':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        period = 'Daily Report';
        break;
      case 'weekly':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        period = 'Weekly Report';
        break;
      case 'monthly':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        period = 'Monthly Report';
        break;
    }

    const metrics = await this.generateDashboardMetrics(this.getTimeRangeString(reportType));
    const charts = await this.generateChartData(startDate, endDate);
    const insights = this.generateInsights(metrics);

    return {
      period,
      startDate,
      endDate,
      metrics,
      charts,
      insights
    };
  }

  private async generateChartData(startDate: Date, endDate: Date) {
    // Generate chart data for reports
    const userGrowthChart = await this.getUserGrowthChartData(startDate, endDate);
    const portfolioPerformanceChart = await this.getPortfolioPerformanceChartData(startDate, endDate);
    const activityHeatmapChart = await this.getActivityHeatmapData(startDate, endDate);

    return [
      {
        type: 'line',
        title: 'User Growth',
        data: userGrowthChart
      },
      {
        type: 'area',
        title: 'Portfolio Performance',
        data: portfolioPerformanceChart
      },
      {
        type: 'heatmap',
        title: 'Activity Heatmap',
        data: activityHeatmapChart
      }
    ];
  }

  private async getUserGrowthChartData(startDate: Date, endDate: Date) {
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const newUsers = await db.select({ count: count() })
        .from(clients)
        .where(sql`${clients.createdAt} >= ${dayStart} AND ${clients.createdAt} <= ${dayEnd}`);

      days.push({
        date: dayStart.toISOString().split('T')[0],
        newUsers: newUsers[0]?.count || 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  private async getPortfolioPerformanceChartData(startDate: Date, endDate: Date) {
    // This would integrate with real portfolio performance data
    const days = [];
    const currentDate = new Date(startDate);
    let baseValue = 1000000; // Starting portfolio value

    while (currentDate <= endDate) {
      // Simulate portfolio performance
      const change = (Math.random() - 0.5) * 0.02; // ±1% change
      baseValue *= (1 + change);

      days.push({
        date: currentDate.toISOString().split('T')[0],
        totalValue: Math.round(baseValue)
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  private async getActivityHeatmapData(startDate: Date, endDate: Date) {
    const heatmapData = [];
    
    for (let hour = 0; hour < 24; hour++) {
      for (let day = 0; day < 7; day++) {
        const activity = await db.select({ count: count() })
          .from(auditLogs)
          .where(sql`
            EXTRACT(hour FROM ${auditLogs.createdAt}) = ${hour} AND 
            EXTRACT(dow FROM ${auditLogs.createdAt}) = ${day} AND
            ${auditLogs.createdAt} >= ${startDate} AND 
            ${auditLogs.createdAt} <= ${endDate}
          `);

        heatmapData.push({
          hour,
          day,
          activity: activity[0]?.count || 0
        });
      }
    }

    return heatmapData;
  }

  private generateInsights(metrics: AnalyticsMetrics): string[] {
    const insights = [];

    if (metrics.userMetrics.userGrowthRate > 10) {
      insights.push(`Strong user growth of ${metrics.userMetrics.userGrowthRate}% this month`);
    }

    if (metrics.kycMetrics.kycApprovalRate > 90) {
      insights.push(`Excellent KYC approval rate of ${metrics.kycMetrics.kycApprovalRate}%`);
    }

    if (metrics.systemMetrics.errorRate > 5) {
      insights.push(`Error rate of ${metrics.systemMetrics.errorRate}% requires attention`);
    }

    if (metrics.portfolioMetrics.averagePortfolioValue > 50000) {
      insights.push(`High-value client base with average portfolio of $${metrics.portfolioMetrics.averagePortfolioValue.toLocaleString()}`);
    }

    return insights;
  }

  async performPredictiveAnalysis(userId: number): Promise<any> {
    // Get user's historical data
    const user = await db.select().from(clients).where(eq(clients.id, userId));
    
    if (!user.length) {
      throw new Error('User not found');
    }

    const client = user[0];
    
    // Predictive models (simplified)
    const riskScore = this.calculateRiskScore(client);
    const churnProbability = this.calculateChurnProbability(client);
    const portfolioRecommendations = this.generatePortfolioRecommendations(client);

    return {
      riskScore,
      churnProbability,
      portfolioRecommendations,
      timestamp: new Date().toISOString()
    };
  }

  private calculateRiskScore(client: any): number {
    let score = 50; // Base score

    // Adjust based on portfolio size
    if (client.amount > 100000) score -= 10;
    else if (client.amount < 10000) score += 5;

    // Adjust based on KYC status
    if (client.kycCompleted) score -= 15;
    else score += 20;

    // Adjust based on activity
    const daysSinceLastLogin = client.lastConnection 
      ? Math.floor((Date.now() - new Date(client.lastConnection).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    if (daysSinceLastLogin > 14) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateChurnProbability(client: any): number {
    let probability = 0.1; // Base 10% probability

    // Increase based on inactivity
    const daysSinceLastLogin = client.lastConnection 
      ? Math.floor((Date.now() - new Date(client.lastConnection).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    if (daysSinceLastLogin > 30) probability += 0.3;
    else if (daysSinceLastLogin > 14) probability += 0.1;

    // Decrease for completed onboarding
    if (client.onboardingCompleted) probability -= 0.05;
    if (client.kycCompleted) probability -= 0.1;

    return Math.max(0, Math.min(1, probability));
  }

  private generatePortfolioRecommendations(client: any): any[] {
    const recommendations = [];

    if (!client.amount || client.amount < 1000) {
      recommendations.push({
        type: 'diversification',
        message: 'Consider starting with a small diversified portfolio',
        priority: 'high'
      });
    }

    if (client.riskLevel === 'low') {
      recommendations.push({
        type: 'conservative',
        message: 'Focus on stable assets like BTC and ETH',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  private getStartDate(timeRange: string, endDate: Date): Date {
    const startDate = new Date(endDate);
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return startDate;
  }

  private getTimeRangeString(reportType: string): string {
    switch (reportType) {
      case 'daily': return '1d';
      case 'weekly': return '7d';
      case 'monthly': return '30d';
      default: return '30d';
    }
  }
}

export const analyticsSystem = new AnalyticsSystem();