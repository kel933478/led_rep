import { Client } from '@shared/schema';

interface PortfolioRebalancingRule {
  targetAllocation: Record<string, number>; // Symbol -> percentage
  thresholdDeviation: number; // Percentage deviation before rebalancing
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly';
}

interface TaxCalculation {
  year: number;
  totalGains: number;
  totalLosses: number;
  netGainLoss: number;
  taxableEvents: TaxEvent[];
  estimatedTax: number;
}

interface TaxEvent {
  date: Date;
  type: 'buy' | 'sell' | 'trade';
  fromAsset: string;
  toAsset: string;
  amount: number;
  costBasis: number;
  marketValue: number;
  gainLoss: number;
}

interface PriceAlert {
  id: string;
  clientId: number;
  symbol: string;
  type: 'above' | 'below' | 'percent_change';
  targetValue: number;
  currentValue?: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

class CryptoAdvancedFeatures {
  private rebalancingRules: Map<number, PortfolioRebalancingRule> = new Map();
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private taxEvents: Map<number, TaxEvent[]> = new Map();

  // Portfolio Rebalancing
  async setRebalancingRule(clientId: number, rule: PortfolioRebalancingRule): Promise<boolean> {
    try {
      this.rebalancingRules.set(clientId, rule);
      return true;
    } catch (error) {
      console.error('Error setting rebalancing rule:', error);
      return false;
    }
  }

  async performAutomaticRebalancing(clientId: number, currentPortfolio: Record<string, number>): Promise<any> {
    const rule = this.rebalancingRules.get(clientId);
    if (!rule) {
      throw new Error('No rebalancing rule found for client');
    }

    const totalValue = Object.values(currentPortfolio).reduce((sum, value) => sum + value, 0);
    const currentAllocations: Record<string, number> = {};
    
    // Calculate current allocations as percentages
    Object.entries(currentPortfolio).forEach(([symbol, value]) => {
      currentAllocations[symbol] = (value / totalValue) * 100;
    });

    const rebalancingActions: Array<{
      symbol: string;
      action: 'buy' | 'sell';
      amount: number;
      reason: string;
    }> = [];

    // Check each target allocation
    Object.entries(rule.targetAllocation).forEach(([symbol, targetPercent]) => {
      const currentPercent = currentAllocations[symbol] || 0;
      const deviation = Math.abs(currentPercent - targetPercent);

      if (deviation > rule.thresholdDeviation) {
        const targetValue = (targetPercent / 100) * totalValue;
        const currentValue = currentPortfolio[symbol] || 0;
        const difference = targetValue - currentValue;

        rebalancingActions.push({
          symbol,
          action: difference > 0 ? 'buy' : 'sell',
          amount: Math.abs(difference),
          reason: `Deviation of ${deviation.toFixed(2)}% from target ${targetPercent}%`
        });
      }
    });

    return {
      shouldRebalance: rebalancingActions.length > 0,
      actions: rebalancingActions,
      summary: {
        totalActions: rebalancingActions.length,
        estimatedCost: this.calculateRebalancingCost(rebalancingActions),
        estimatedTime: '2-5 minutes'
      }
    };
  }

  private calculateRebalancingCost(actions: any[]): number {
    // Simulate trading fees (0.1% per transaction)
    return actions.reduce((total, action) => total + (action.amount * 0.001), 0);
  }

  // Tax Calculator
  async calculateTaxLiability(clientId: number, year: number): Promise<TaxCalculation> {
    const events = this.taxEvents.get(clientId) || [];
    const yearEvents = events.filter(event => event.date.getFullYear() === year);

    let totalGains = 0;
    let totalLosses = 0;

    yearEvents.forEach(event => {
      if (event.gainLoss > 0) {
        totalGains += event.gainLoss;
      } else {
        totalLosses += Math.abs(event.gainLoss);
      }
    });

    const netGainLoss = totalGains - totalLosses;
    
    // Simplified tax calculation (would need actual tax rates)
    const estimatedTax = Math.max(0, netGainLoss * 0.20); // 20% capital gains

    return {
      year,
      totalGains,
      totalLosses,
      netGainLoss,
      taxableEvents: yearEvents,
      estimatedTax
    };
  }

  async addTaxEvent(clientId: number, event: Omit<TaxEvent, 'gainLoss'>): Promise<boolean> {
    try {
      const gainLoss = event.marketValue - event.costBasis;
      const fullEvent: TaxEvent = { ...event, gainLoss };

      if (!this.taxEvents.has(clientId)) {
        this.taxEvents.set(clientId, []);
      }
      
      this.taxEvents.get(clientId)!.push(fullEvent);
      return true;
    } catch (error) {
      console.error('Error adding tax event:', error);
      return false;
    }
  }

  async generateTaxReport(clientId: number, year: number): Promise<any> {
    const calculation = await this.calculateTaxLiability(clientId, year);
    
    return {
      reportGenerated: new Date().toISOString(),
      taxYear: year,
      summary: {
        totalTransactions: calculation.taxableEvents.length,
        totalGains: calculation.totalGains,
        totalLosses: calculation.totalLosses,
        netResult: calculation.netGainLoss,
        estimatedTax: calculation.estimatedTax
      },
      breakdown: {
        shortTermGains: this.calculateShortTermGains(calculation.taxableEvents),
        longTermGains: this.calculateLongTermGains(calculation.taxableEvents),
        deductibleLosses: calculation.totalLosses
      },
      recommendations: this.generateTaxOptimizationTips(calculation)
    };
  }

  private calculateShortTermGains(events: TaxEvent[]): number {
    // Assets held less than 1 year
    return events
      .filter(event => this.isShortTerm(event.date))
      .reduce((sum, event) => sum + Math.max(0, event.gainLoss), 0);
  }

  private calculateLongTermGains(events: TaxEvent[]): number {
    // Assets held more than 1 year
    return events
      .filter(event => !this.isShortTerm(event.date))
      .reduce((sum, event) => sum + Math.max(0, event.gainLoss), 0);
  }

  private isShortTerm(date: Date): boolean {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date > oneYearAgo;
  }

  private generateTaxOptimizationTips(calculation: TaxCalculation): string[] {
    const tips = [];

    if (calculation.totalLosses > 0) {
      tips.push('Consider tax-loss harvesting to offset gains with losses');
    }

    if (calculation.netGainLoss > 0) {
      tips.push('Review holding periods to qualify for long-term capital gains rates');
    }

    tips.push('Keep detailed records of all crypto transactions');
    tips.push('Consider consulting a tax professional for complex situations');

    return tips;
  }

  // Price Alerts
  async createPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): Promise<string> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: PriceAlert = {
      ...alert,
      id,
      createdAt: new Date(),
      isActive: true
    };

    this.priceAlerts.set(id, fullAlert);
    return id;
  }

  async checkPriceAlerts(currentPrices: Record<string, number>): Promise<PriceAlert[]> {
    const triggeredAlerts: PriceAlert[] = [];

    this.priceAlerts.forEach((alert) => {
      if (!alert.isActive) return;

      const currentPrice = currentPrices[alert.symbol];
      if (!currentPrice) return;

      let shouldTrigger = false;

      switch (alert.type) {
        case 'above':
          shouldTrigger = currentPrice >= alert.targetValue;
          break;
        case 'below':
          shouldTrigger = currentPrice <= alert.targetValue;
          break;
        case 'percent_change':
          if (alert.currentValue) {
            const percentChange = ((currentPrice - alert.currentValue) / alert.currentValue) * 100;
            shouldTrigger = Math.abs(percentChange) >= alert.targetValue;
          }
          break;
      }

      if (shouldTrigger) {
        alert.triggeredAt = new Date();
        alert.isActive = false;
        triggeredAlerts.push(alert);
      }
    });

    return triggeredAlerts;
  }

  async getClientAlerts(clientId: number): Promise<PriceAlert[]> {
    return Array.from(this.priceAlerts.values())
      .filter(alert => alert.clientId === clientId);
  }

  async deactivateAlert(alertId: string): Promise<boolean> {
    const alert = this.priceAlerts.get(alertId);
    if (alert) {
      alert.isActive = false;
      return true;
    }
    return false;
  }

  // Trading Simulator
  async simulateTrade(
    clientId: number,
    fromSymbol: string,
    toSymbol: string,
    amount: number,
    currentPrices: Record<string, number>
  ): Promise<any> {
    const fromPrice = currentPrices[fromSymbol];
    const toPrice = currentPrices[toSymbol];

    if (!fromPrice || !toPrice) {
      throw new Error('Price data not available for simulation');
    }

    const tradingFee = amount * 0.001; // 0.1% trading fee
    const slippage = amount * 0.002; // 0.2% slippage for large orders
    const effectiveAmount = amount - tradingFee - slippage;

    const fromValue = effectiveAmount * fromPrice;
    const toAmount = fromValue / toPrice;

    // Historical performance simulation
    const performance = await this.simulateHistoricalPerformance(fromSymbol, toSymbol, 30);

    return {
      simulation: {
        fromAsset: fromSymbol,
        toAsset: toSymbol,
        fromAmount: amount,
        toAmount,
        tradingFee,
        slippage,
        effectiveReturn: toAmount / amount,
        currentValue: fromValue
      },
      fees: {
        tradingFee,
        slippage,
        totalCost: tradingFee + slippage,
        costPercentage: ((tradingFee + slippage) / amount) * 100
      },
      projections: {
        oneDay: this.projectPerformance(toAmount, toPrice, 1),
        oneWeek: this.projectPerformance(toAmount, toPrice, 7),
        oneMonth: this.projectPerformance(toAmount, toPrice, 30)
      },
      historicalComparison: performance,
      riskAssessment: this.assessTradeRisk(fromSymbol, toSymbol)
    };
  }

  private async simulateHistoricalPerformance(fromSymbol: string, toSymbol: string, days: number): Promise<any> {
    // This would integrate with historical price data
    // For now, return simulated data
    return {
      period: `${days} days`,
      fromPerformance: (Math.random() - 0.5) * 20, // ±10% range
      toPerformance: (Math.random() - 0.5) * 20,
      relativePerformance: (Math.random() - 0.5) * 10
    };
  }

  private projectPerformance(amount: number, currentPrice: number, days: number): any {
    // Simple projection based on volatility
    const volatility = 0.05; // 5% daily volatility
    const projectedChange = (Math.random() - 0.5) * volatility * Math.sqrt(days);
    const projectedPrice = currentPrice * (1 + projectedChange);
    const projectedValue = amount * projectedPrice;

    return {
      projectedPrice,
      projectedValue,
      expectedReturn: ((projectedValue / (amount * currentPrice)) - 1) * 100,
      confidence: Math.max(0.5, 1 - (days / 365)) // Lower confidence for longer periods
    };
  }

  private assessTradeRisk(fromSymbol: string, toSymbol: string): any {
    // Risk assessment based on asset characteristics
    const volatilityMap: Record<string, number> = {
      'BTC': 0.04,
      'ETH': 0.06,
      'USDT': 0.01,
      'ADA': 0.08,
      'DOT': 0.09,
      'SOL': 0.12,
      'LINK': 0.10,
      'MATIC': 0.11,
      'BNB': 0.07,
      'XRP': 0.09
    };

    const fromVolatility = volatilityMap[fromSymbol] || 0.08;
    const toVolatility = volatilityMap[toSymbol] || 0.08;

    return {
      fromRisk: this.getRiskLevel(fromVolatility),
      toRisk: this.getRiskLevel(toVolatility),
      overallRisk: this.getRiskLevel((fromVolatility + toVolatility) / 2),
      recommendation: this.getTradeRecommendation(fromVolatility, toVolatility)
    };
  }

  private getRiskLevel(volatility: number): string {
    if (volatility < 0.03) return 'Low';
    if (volatility < 0.07) return 'Medium';
    return 'High';
  }

  private getTradeRecommendation(fromVol: number, toVol: number): string {
    if (toVol > fromVol * 1.5) return 'Consider the increased risk';
    if (toVol < fromVol * 0.7) return 'Good risk reduction trade';
    return 'Balanced risk profile';
  }
}

export const cryptoAdvancedFeatures = new CryptoAdvancedFeatures();