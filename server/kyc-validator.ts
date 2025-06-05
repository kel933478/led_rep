import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

interface KYCValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  metadata: {
    fileType?: string;
    fileSize: number;
    dimensions?: { width: number; height: number };
    checksum: string;
  };
}

interface DocumentAnalysis {
  hasText: boolean;
  textConfidence: number;
  faceDetected: boolean;
  documentType: 'passport' | 'id_card' | 'license' | 'unknown';
  qualityScore: number;
}

class KYCValidator {
  private allowedMimeTypes = [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'application/pdf'
  ];

  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private minFileSize = 50 * 1024; // 50KB

  async validateDocument(filePath: string): Promise<KYCValidationResult> {
    const result: KYCValidationResult = {
      isValid: true,
      score: 100,
      issues: [],
      metadata: {
        fileSize: 0,
        checksum: ''
      }
    };

    try {
      // Vérification existence du fichier
      if (!fs.existsSync(filePath)) {
        result.isValid = false;
        result.score = 0;
        result.issues.push('File not found');
        return result;
      }

      // Lecture du fichier
      const fileBuffer = fs.readFileSync(filePath);
      result.metadata.fileSize = fileBuffer.length;
      result.metadata.checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Validation de la taille
      if (fileBuffer.length > this.maxFileSize) {
        result.isValid = false;
        result.score -= 30;
        result.issues.push(`File too large: ${Math.round(fileBuffer.length / 1024 / 1024)}MB (max: 10MB)`);
      }

      if (fileBuffer.length < this.minFileSize) {
        result.isValid = false;
        result.score -= 40;
        result.issues.push(`File too small: ${Math.round(fileBuffer.length / 1024)}KB (min: 50KB)`);
      }

      // Détection du type de fichier
      const fileType = await fileTypeFromBuffer(fileBuffer);
      if (!fileType) {
        result.isValid = false;
        result.score -= 50;
        result.issues.push('Unable to determine file type');
        return result;
      }

      result.metadata.fileType = fileType.mime;

      // Validation du type MIME
      if (!this.allowedMimeTypes.includes(fileType.mime)) {
        result.isValid = false;
        result.score -= 60;
        result.issues.push(`Invalid file type: ${fileType.mime}`);
      }

      // Validation spécifique selon le type
      if (fileType.mime.startsWith('image/')) {
        const imageAnalysis = await this.analyzeImage(fileBuffer);
        result.score += imageAnalysis.qualityScore - 50; // Adjust from base quality
        
        if (imageAnalysis.qualityScore < 30) {
          result.issues.push('Image quality too low');
        }

        if (!imageAnalysis.hasText && imageAnalysis.textConfidence < 0.3) {
          result.score -= 20;
          result.issues.push('Document text not clearly visible');
        }

        if (imageAnalysis.documentType === 'unknown') {
          result.score -= 15;
          result.issues.push('Document type not recognized');
        }
      }

      // Vérification de sécurité - malware basique
      if (this.containsSuspiciousPatterns(fileBuffer)) {
        result.isValid = false;
        result.score = 0;
        result.issues.push('File contains suspicious patterns');
      }

      // Score final
      result.score = Math.max(0, Math.min(100, result.score));
      
      if (result.score < 60) {
        result.isValid = false;
      }

      return result;

    } catch (error) {
      result.isValid = false;
      result.score = 0;
      result.issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  private async analyzeImage(buffer: Buffer): Promise<DocumentAnalysis> {
    // Simulation d'analyse d'image basique
    // En production, utiliser une vraie API d'OCR/détection comme AWS Textract ou Google Vision
    
    const analysis: DocumentAnalysis = {
      hasText: true,
      textConfidence: 0.8,
      faceDetected: Math.random() > 0.3, // Simulation
      documentType: 'unknown',
      qualityScore: 75
    };

    // Analyse basique de la qualité basée sur la taille
    const aspectRatio = this.getImageAspectRatio(buffer);
    if (aspectRatio < 0.5 || aspectRatio > 2.0) {
      analysis.qualityScore -= 15;
    }

    // Détection basique du type de document basée sur les dimensions
    if (aspectRatio >= 0.6 && aspectRatio <= 0.7) {
      analysis.documentType = 'id_card';
    } else if (aspectRatio >= 0.7 && aspectRatio <= 0.8) {
      analysis.documentType = 'passport';
    } else if (aspectRatio >= 1.4 && aspectRatio <= 1.6) {
      analysis.documentType = 'license';
    }

    return analysis;
  }

  private getImageAspectRatio(buffer: Buffer): number {
    // Lecture basique des dimensions JPEG/PNG
    try {
      if (buffer[0] === 0xFF && buffer[1] === 0xD8) { // JPEG
        return this.getJPEGDimensions(buffer);
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50) { // PNG
        return this.getPNGDimensions(buffer);
      }
    } catch (error) {
      console.error('Error reading image dimensions:', error);
    }
    return 1.0; // Ratio par défaut
  }

  private getJPEGDimensions(buffer: Buffer): number {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] === 0xFF) {
        const marker = buffer[offset + 1];
        if (marker >= 0xC0 && marker <= 0xC3) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return width / height;
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
      } else {
        offset++;
      }
    }
    return 1.0;
  }

  private getPNGDimensions(buffer: Buffer): number {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return width / height;
  }

  private containsSuspiciousPatterns(buffer: Buffer): boolean {
    const suspiciousPatterns = [
      Buffer.from('eval('),
      Buffer.from('<script'),
      Buffer.from('javascript:'),
      Buffer.from('data:text/html'),
      Buffer.from('\x00\x00\x01\x00'), // Potential executable header
    ];

    for (const pattern of suspiciousPatterns) {
      if (buffer.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  async generateValidationReport(filePath: string): Promise<string> {
    const validation = await this.validateDocument(filePath);
    
    const report = {
      timestamp: new Date().toISOString(),
      filename: path.basename(filePath),
      validation: validation,
      recommendations: this.generateRecommendations(validation)
    };

    return JSON.stringify(report, null, 2);
  }

  private generateRecommendations(validation: KYCValidationResult): string[] {
    const recommendations: string[] = [];

    if (validation.metadata.fileSize > 5 * 1024 * 1024) {
      recommendations.push('Consider compressing the image to reduce file size');
    }

    if (validation.score < 80) {
      recommendations.push('Document quality could be improved - ensure good lighting and focus');
    }

    if (validation.issues.some(issue => issue.includes('text'))) {
      recommendations.push('Ensure all text on the document is clearly visible and readable');
    }

    if (validation.issues.length === 0) {
      recommendations.push('Document meets all quality requirements');
    }

    return recommendations;
  }

  // Méthode pour nettoyer les anciens fichiers
  async cleanupOldFiles(uploadDir: string, maxAgeHours: number = 24): Promise<number> {
    let deletedCount = 0;
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();

    try {
      const files = fs.readdirSync(uploadDir);
      
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }

    return deletedCount;
  }
}

export const kycValidator = new KYCValidator();