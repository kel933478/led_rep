import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron format
  retentionDays: number;
  backupPath: string;
}

class BackupSystem {
  private config: BackupConfig;
  private backupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      enabled: process.env.BACKUP_ENABLED === 'true',
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      backupPath: process.env.BACKUP_PATH || './backups'
    };

    if (this.config.enabled) {
      this.initializeBackups();
    }
  }

  private initializeBackups() {
    // Ensure backup directory exists
    if (!fs.existsSync(this.config.backupPath)) {
      fs.mkdirSync(this.config.backupPath, { recursive: true });
    }

    // Schedule automatic backups (simplified - would use node-cron in production)
    const backupInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.backupInterval = setInterval(() => {
      this.performBackup().catch(console.error);
    }, backupInterval);

    console.log('Backup system initialized');
  }

  async performBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupDir = path.join(this.config.backupPath, backupName);

    try {
      // Create backup directory
      fs.mkdirSync(backupDir, { recursive: true });

      // Export database data
      await this.exportDatabaseData(backupDir);

      // Backup uploaded files
      await this.backupUploadedFiles(backupDir);

      // Create backup metadata
      await this.createBackupMetadata(backupDir);

      // Compress backup
      const compressedPath = await this.compressBackup(backupDir);

      // Clean up old backups
      await this.cleanupOldBackups();

      console.log(`Backup completed: ${compressedPath}`);
      return compressedPath;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  private async exportDatabaseData(backupDir: string) {
    try {
      // Export all database tables
      const clients = await storage.getAllClients();
      const auditLogs = await storage.getAuditLogs();
      
      // Get settings
      const settings = {
        globalTax: await storage.getSetting('globalTax')
      };

      const exportData = {
        clients: clients.map(client => ({
          ...client,
          password: '[ENCRYPTED]' // Don't export passwords
        })),
        auditLogs,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      fs.writeFileSync(
        path.join(backupDir, 'database.json'),
        JSON.stringify(exportData, null, 2)
      );

      console.log('Database data exported');
    } catch (error) {
      console.error('Database export failed:', error);
      throw error;
    }
  }

  private async backupUploadedFiles(backupDir: string) {
    const uploadsDir = './uploads';
    const backupUploadsDir = path.join(backupDir, 'uploads');

    try {
      if (fs.existsSync(uploadsDir)) {
        fs.mkdirSync(backupUploadsDir, { recursive: true });
        
        // Copy all files from uploads directory
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          const sourcePath = path.join(uploadsDir, file);
          const targetPath = path.join(backupUploadsDir, file);
          fs.copyFileSync(sourcePath, targetPath);
        }

        console.log(`Backed up ${files.length} uploaded files`);
      }
    } catch (error) {
      console.error('File backup failed:', error);
      throw error;
    }
  }

  private async createBackupMetadata(backupDir: string) {
    const metadata = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      type: 'full_backup',
      description: 'Automated system backup',
      files: this.getDirectoryFiles(backupDir)
    };

    fs.writeFileSync(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }

  private getDirectoryFiles(dir: string): string[] {
    const files: string[] = [];
    
    function traverse(currentDir: string) {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          traverse(itemPath);
        } else {
          files.push(path.relative(dir, itemPath));
        }
      }
    }
    
    traverse(dir);
    return files;
  }

  private async compressBackup(backupDir: string): Promise<string> {
    const compressedPath = `${backupDir}.tar.gz`;
    
    try {
      await execAsync(`tar -czf "${compressedPath}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`);
      
      // Remove uncompressed directory
      fs.rmSync(backupDir, { recursive: true });
      
      return compressedPath;
    } catch (error) {
      console.error('Compression failed:', error);
      throw error;
    }
  }

  private async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.config.backupPath);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.tar.gz'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      for (const file of backupFiles) {
        const filePath = path.join(this.config.backupPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    console.log(`Starting restore from: ${backupPath}`);
    
    try {
      // Extract backup
      const tempDir = path.join(path.dirname(backupPath), 'restore_temp');
      await execAsync(`tar -xzf "${backupPath}" -C "${path.dirname(backupPath)}"`);
      
      // Read backup data
      const backupName = path.basename(backupPath, '.tar.gz');
      const extractedDir = path.join(path.dirname(backupPath), backupName);
      const databasePath = path.join(extractedDir, 'database.json');
      
      if (fs.existsSync(databasePath)) {
        const backupData = JSON.parse(fs.readFileSync(databasePath, 'utf8'));
        
        // Restore database (would need proper restoration logic)
        console.log('Database restoration would be implemented here');
        console.log(`Found ${backupData.clients?.length || 0} clients to restore`);
      }
      
      // Restore uploaded files
      const uploadsBackupDir = path.join(extractedDir, 'uploads');
      if (fs.existsSync(uploadsBackupDir)) {
        const uploadsDir = './uploads';
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Copy files back
        const files = fs.readdirSync(uploadsBackupDir);
        for (const file of files) {
          const sourcePath = path.join(uploadsBackupDir, file);
          const targetPath = path.join(uploadsDir, file);
          fs.copyFileSync(sourcePath, targetPath);
        }
        
        console.log(`Restored ${files.length} uploaded files`);
      }
      
      // Cleanup
      fs.rmSync(extractedDir, { recursive: true });
      
      console.log('Restore completed');
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  getBackupStatus() {
    return {
      enabled: this.config.enabled,
      schedule: this.config.schedule,
      retentionDays: this.config.retentionDays,
      backupPath: this.config.backupPath,
      lastBackup: this.getLastBackupInfo()
    };
  }

  private getLastBackupInfo() {
    try {
      const files = fs.readdirSync(this.config.backupPath);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.tar.gz'));
      
      if (backupFiles.length === 0) return null;
      
      const latestBackup = backupFiles
        .map(file => ({
          name: file,
          path: path.join(this.config.backupPath, file),
          stat: fs.statSync(path.join(this.config.backupPath, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())[0];
      
      return {
        filename: latestBackup.name,
        date: latestBackup.stat.mtime,
        size: latestBackup.stat.size
      };
    } catch (error) {
      return null;
    }
  }

  stop() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }
}

export const backupSystem = new BackupSystem();