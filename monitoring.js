// Monitoring et alertes pour production
const fs = require('fs');
const path = require('path');

class ProductionMonitor {
  constructor() {
    this.logDir = './logs';
    this.alertThresholds = {
      memoryUsage: 80, // %
      cpuUsage: 80, // %
      errorRate: 5, // errors per minute
      responseTime: 2000 // ms
    };
    
    this.ensureLogDir();
    this.startMonitoring();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  startMonitoring() {
    // Check system health every minute
    setInterval(() => {
      this.checkSystemHealth();
    }, 60000);

    // Log rotation daily
    setInterval(() => {
      this.rotateLogFiles();
    }, 24 * 60 * 60 * 1000);
  }

  checkSystemHealth() {
    const memUsage = process.memoryUsage();
    const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    
    const healthData = {
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: `${heapUsed} MB`,
        heapTotal: `${heapTotal} MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`
      },
      uptime: `${(process.uptime() / 3600).toFixed(2)} hours`,
      pid: process.pid
    };

    this.logHealth(healthData);
    
    // Check for alerts
    if (parseFloat(heapUsed) > 500) { // 500MB threshold
      this.sendAlert('HIGH_MEMORY_USAGE', `Memory usage: ${heapUsed} MB`);
    }
  }

  logHealth(data) {
    const logFile = path.join(this.logDir, 'health.log');
    const logEntry = `${data.timestamp} - ${JSON.stringify(data)}\n`;
    
    fs.appendFileSync(logFile, logEntry);
  }

  sendAlert(type, message) {
    const alertData = {
      timestamp: new Date().toISOString(),
      type,
      message,
      hostname: require('os').hostname(),
      domain: 'rec-ledger.com'
    };

    const alertFile = path.join(this.logDir, 'alerts.log');
    const alertEntry = `${alertData.timestamp} - ALERT: ${type} - ${message}\n`;
    
    fs.appendFileSync(alertFile, alertEntry);
    console.error(`ALERT: ${type} - ${message}`);
  }

  rotateLogFiles() {
    const files = ['health.log', 'alerts.log', 'access.log', 'error.log'];
    const timestamp = new Date().toISOString().split('T')[0];
    
    files.forEach(file => {
      const filePath = path.join(this.logDir, file);
      const backupPath = path.join(this.logDir, `${file}.${timestamp}`);
      
      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, backupPath);
      }
    });
  }
}

// Start monitoring in production
if (process.env.NODE_ENV === 'production') {
  new ProductionMonitor();
  console.log('Production monitoring started for rec-ledger.com');
}

module.exports = ProductionMonitor;