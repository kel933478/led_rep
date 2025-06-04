import { EventEmitter } from 'events';
import os from 'os';
import { storage } from './storage';

interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    requests: number;
    errors: number;
    responseTime: number;
  };
  database: {
    connections: number;
    queries: number;
    errors: number;
  };
  application: {
    activeUsers: number;
    totalUsers: number;
    kycPending: number;
    totalTransactions: number;
  };
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

class MonitoringSystem extends EventEmitter {
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];

  constructor() {
    super();
    this.startMonitoring();
  }

  private startMonitoring() {
    this.intervalId = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        
        // Keep only last 1000 metrics entries
        if (this.metrics.length > 1000) {
          this.metrics = this.metrics.slice(-1000);
        }

        // Check for alerts
        this.checkAlerts(metrics);
        
        this.emit('metrics', metrics);
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 30000); // Collect metrics every 30 seconds
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    const cpuUsage = await this.getCpuUsage();
    const memoryInfo = this.getMemoryInfo();
    const diskInfo = await this.getDiskInfo();
    const networkInfo = this.getNetworkInfo();
    const dbInfo = await this.getDatabaseInfo();
    const appInfo = await this.getApplicationInfo();

    return {
      timestamp: new Date(),
      cpu: cpuUsage,
      memory: memoryInfo,
      disk: diskInfo,
      network: networkInfo,
      database: dbInfo,
      application: appInfo
    };
  }

  private async getCpuUsage(): Promise<{ usage: number; loadAverage: number[] }> {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure);
        const endTime = process.hrtime(startTime);
        
        const totalTime = endTime[0] * 1e6 + endTime[1] / 1e3; // Convert to microseconds
        const totalUsage = endMeasure.user + endMeasure.system;
        const usage = (totalUsage / totalTime) * 100;

        resolve({
          usage: Math.min(100, Math.max(0, usage)),
          loadAverage: os.loadavg()
        });
      }, 100);
    });
  }

  private getMemoryInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      percentage: (usedMemory / totalMemory) * 100
    };
  }

  private async getDiskInfo() {
    // Simplified disk info - in production would use proper disk monitoring
    const stats = await import('fs').then(fs => fs.promises.stat('.'));
    
    return {
      total: 100 * 1024 * 1024 * 1024, // 100GB estimate
      used: 50 * 1024 * 1024 * 1024,   // 50GB estimate
      free: 50 * 1024 * 1024 * 1024,   // 50GB estimate
      percentage: 50
    };
  }

  private getNetworkInfo() {
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    // Reset counters periodically
    const info = {
      requests: this.requestCount,
      errors: this.errorCount,
      responseTime: avgResponseTime
    };

    this.responseTimes = [];
    
    return info;
  }

  private async getDatabaseInfo() {
    try {
      // Simulate database metrics - in production would query actual DB stats
      const clients = await storage.getAllClients();
      
      return {
        connections: 5, // Active connections
        queries: this.requestCount * 2, // Estimated queries
        errors: 0
      };
    } catch (error) {
      return {
        connections: 0,
        queries: 0,
        errors: 1
      };
    }
  }

  private async getApplicationInfo() {
    try {
      const clients = await storage.getAllClients();
      const kycPending = clients.filter(c => !c.kycCompleted).length;
      
      return {
        activeUsers: clients.filter(c => c.lastConnection && 
          new Date(c.lastConnection).getTime() > Date.now() - 24 * 60 * 60 * 1000).length,
        totalUsers: clients.length,
        kycPending,
        totalTransactions: this.requestCount // Simplified
      };
    } catch (error) {
      return {
        activeUsers: 0,
        totalUsers: 0,
        kycPending: 0,
        totalTransactions: 0
      };
    }
  }

  private checkAlerts(metrics: SystemMetrics) {
    // CPU Alert
    if (metrics.cpu.usage > 80) {
      this.createAlert('warning', `CPU usage high: ${metrics.cpu.usage.toFixed(1)}%`, {
        type: 'cpu',
        value: metrics.cpu.usage
      });
    }

    // Memory Alert
    if (metrics.memory.percentage > 85) {
      this.createAlert('warning', `Memory usage high: ${metrics.memory.percentage.toFixed(1)}%`, {
        type: 'memory',
        value: metrics.memory.percentage
      });
    }

    // Disk Alert
    if (metrics.disk.percentage > 90) {
      this.createAlert('critical', `Disk space critical: ${metrics.disk.percentage.toFixed(1)}%`, {
        type: 'disk',
        value: metrics.disk.percentage
      });
    }

    // Network Error Rate Alert
    const errorRate = metrics.network.requests > 0 
      ? (metrics.network.errors / metrics.network.requests) * 100 
      : 0;
    
    if (errorRate > 5) {
      this.createAlert('error', `High error rate: ${errorRate.toFixed(1)}%`, {
        type: 'network',
        value: errorRate
      });
    }

    // Response Time Alert
    if (metrics.network.responseTime > 5000) {
      this.createAlert('warning', `Slow response time: ${metrics.network.responseTime}ms`, {
        type: 'performance',
        value: metrics.network.responseTime
      });
    }

    // Database Alert
    if (metrics.database.errors > 0) {
      this.createAlert('error', `Database errors detected: ${metrics.database.errors}`, {
        type: 'database',
        value: metrics.database.errors
      });
    }
  }

  private createAlert(type: Alert['type'], message: string, metadata?: any) {
    // Avoid duplicate alerts
    const existingAlert = this.alerts.find(alert => 
      !alert.resolved && alert.message === message && alert.type === type
    );

    if (existingAlert) return;

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      type,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    // Auto-resolve some alerts after time
    if (type === 'warning') {
      setTimeout(() => {
        this.resolveAlert(alert.id);
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  public recordRequest(responseTime: number, isError: boolean = false) {
    this.requestCount++;
    this.responseTimes.push(responseTime);
    
    if (isError) {
      this.errorCount++;
    }

    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
  }

  public resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alertResolved', alert);
    }
  }

  public getMetrics(limit: number = 100): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  public getAlerts(includeResolved: boolean = false): Alert[] {
    return includeResolved 
      ? this.alerts 
      : this.alerts.filter(alert => !alert.resolved);
  }

  public getCurrentStatus() {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    const activeAlerts = this.getAlerts(false);
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (activeAlerts.some(alert => alert.type === 'critical')) {
      status = 'critical';
    } else if (activeAlerts.length > 0) {
      status = 'warning';
    }

    return {
      status,
      metrics: latestMetrics,
      alerts: activeAlerts,
      uptime: process.uptime(),
      version: '1.0.0'
    };
  }

  public getHealthCheck() {
    const status = this.getCurrentStatus();
    
    return {
      status: status.status,
      timestamp: new Date().toISOString(),
      uptime: status.uptime,
      checks: {
        database: status.metrics?.database.errors === 0,
        memory: status.metrics?.memory.percentage < 85,
        cpu: status.metrics?.cpu.usage < 80,
        disk: status.metrics?.disk.percentage < 90
      }
    };
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const monitoringSystem = new MonitoringSystem();

// Express middleware for monitoring
export function monitoringMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = process.hrtime();
    
    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds
      const isError = res.statusCode >= 400;
      
      monitoringSystem.recordRequest(responseTime, isError);
    });
    
    next();
  };
}