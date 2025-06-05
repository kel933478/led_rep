import crypto from 'crypto';
import { db } from './db';
import { clients } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface TwoFactorAuth {
  generateSecret(): string;
  generateQRCode(email: string, secret: string): string;
  verifyToken(secret: string, token: string): boolean;
  generateBackupCodes(): string[];
}

class TwoFactorAuthService implements TwoFactorAuth {
  
  generateSecret(): string {
    // Génère un secret base32 de 32 caractères
    const buffer = crypto.randomBytes(20);
    return buffer.toString('base64')
      .replace(/[^A-Z2-7]/gi, '')
      .substring(0, 32)
      .toUpperCase();
  }

  generateQRCode(email: string, secret: string): string {
    const appName = 'Ledger Récupération';
    const label = `${appName}:${email}`;
    const issuer = appName;
    
    // Format otpauth pour QR code
    const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    
    // URL pour générer le QR code via service externe
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  }

  verifyToken(secret: string, token: string): boolean {
    if (!token || token.length !== 6) {
      return false;
    }

    // Vérification TOTP avec fenêtre de 30 secondes
    const timeStep = Math.floor(Date.now() / 30000);
    
    // Vérifier le token actuel et les tokens précédent/suivant pour la tolérance
    for (let i = -1; i <= 1; i++) {
      const computedToken = this.generateTOTP(secret, timeStep + i);
      if (computedToken === token) {
        return true;
      }
    }
    
    return false;
  }

  private generateTOTP(secret: string, timeStep: number): string {
    // Convertir le secret base32 en buffer
    const key = this.base32Decode(secret);
    
    // Convertir timeStep en buffer 8 bytes big-endian
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
    timeBuffer.writeUInt32BE(timeStep & 0xffffffff, 4);
    
    // HMAC-SHA1
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    // Tronquer dynamiquement
    const offset = hash[hash.length - 1] & 0x0f;
    const truncated = (hash[offset] & 0x7f) << 24 |
                     (hash[offset + 1] & 0xff) << 16 |
                     (hash[offset + 2] & 0xff) << 8 |
                     (hash[offset + 3] & 0xff);
    
    // Retourner 6 chiffres
    return (truncated % 1000000).toString().padStart(6, '0');
  }

  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = Buffer.alloc(Math.ceil(encoded.length * 5 / 8));
    let index = 0;

    for (let i = 0; i < encoded.length; i++) {
      const char = encoded[i].toUpperCase();
      const val = alphabet.indexOf(char);
      
      if (val === -1) continue;
      
      value = (value << 5) | val;
      bits += 5;
      
      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }
    
    return output.slice(0, index);
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Génère des codes de 8 caractères alphanumériques
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async enableTwoFactorForClient(clientId: number, secret: string): Promise<boolean> {
    try {
      await db.update(clients)
        .set({ 
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          twoFactorBackupCodes: this.generateBackupCodes()
        })
        .where(eq(clients.id, clientId));
      
      return true;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return false;
    }
  }

  async disableTwoFactorForClient(clientId: number): Promise<boolean> {
    try {
      await db.update(clients)
        .set({ 
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: null
        })
        .where(eq(clients.id, clientId));
      
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  }

  async verifyBackupCode(clientId: number, code: string): Promise<boolean> {
    try {
      const [client] = await db.select()
        .from(clients)
        .where(eq(clients.id, clientId));

      if (!client?.twoFactorBackupCodes) {
        return false;
      }

      const backupCodes = client.twoFactorBackupCodes as string[];
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      
      if (codeIndex === -1) {
        return false;
      }

      // Supprimer le code utilisé
      const updatedCodes = backupCodes.filter((_, index) => index !== codeIndex);
      
      await db.update(clients)
        .set({ twoFactorBackupCodes: updatedCodes })
        .where(eq(clients.id, clientId));
      
      return true;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }
}

export const twoFactorAuth = new TwoFactorAuthService();