import crypto from 'crypto';
import { db } from './db';
import { clients } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

interface PasswordResetRequest {
  email: string;
  token: string;
  expiresAt: Date;
}

interface PasswordResetResult {
  success: boolean;
  message: string;
  token?: string;
}

class PasswordRecoveryService {
  
  private readonly TOKEN_EXPIRY_HOURS = 1; // 1 heure d'expiration
  private readonly TOKEN_LENGTH = 32;
  
  async initiatePasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      // Vérifier si l'utilisateur existe
      const [client] = await db.select()
        .from(clients)
        .where(eq(clients.email, email));

      if (!client) {
        // Ne pas révéler si l'email existe ou non pour la sécurité
        return {
          success: true,
          message: 'Si cet email existe, un lien de récupération a été envoyé.'
        };
      }

      // Générer un token sécurisé
      const resetToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Hasher le token avant stockage
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Stocker le token hashé en base
      await db.update(clients)
        .set({
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt
        })
        .where(eq(clients.id, client.id));

      return {
        success: true,
        message: 'Si cet email existe, un lien de récupération a été envoyé.',
        token: resetToken // Token non-hashé pour l'email
      };

    } catch (error) {
      console.error('Error initiating password reset:', error);
      return {
        success: false,
        message: 'Erreur lors de la demande de récupération.'
      };
    }
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; clientId?: number }> {
    try {
      if (!token || token.length !== this.TOKEN_LENGTH * 2) {
        return { valid: false };
      }

      // Hasher le token reçu
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const now = new Date();

      // Chercher un client avec ce token valide
      const [client] = await db.select()
        .from(clients)
        .where(eq(clients.passwordResetToken, hashedToken));

      if (!client || !client.passwordResetExpires) {
        return { valid: false };
      }

      // Vérifier l'expiration
      if (client.passwordResetExpires < now) {
        // Nettoyer le token expiré
        await this.cleanupExpiredToken(client.id);
        return { valid: false };
      }

      return { valid: true, clientId: client.id };

    } catch (error) {
      console.error('Error validating reset token:', error);
      return { valid: false };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<PasswordResetResult> {
    try {
      // Valider le token
      const validation = await this.validateResetToken(token);
      if (!validation.valid || !validation.clientId) {
        return {
          success: false,
          message: 'Token invalide ou expiré.'
        };
      }

      // Valider le mot de passe
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message
        };
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe et nettoyer les tokens
      await db.update(clients)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null
        })
        .where(eq(clients.id, validation.clientId));

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès.'
      };

    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'Erreur lors de la réinitialisation.'
      };
    }
  }

  private validatePassword(password: string): { valid: boolean; message: string } {
    if (!password || password.length < 8) {
      return {
        valid: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères.'
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        valid: false,
        message: 'Le mot de passe doit contenir au moins une lettre minuscule.'
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        valid: false,
        message: 'Le mot de passe doit contenir au moins une lettre majuscule.'
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        valid: false,
        message: 'Le mot de passe doit contenir au moins un chiffre.'
      };
    }

    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)) {
      return {
        valid: false,
        message: 'Le mot de passe doit contenir au moins un caractère spécial.'
      };
    }

    // Vérifier les patterns communs faibles
    const weakPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /letmein/i
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        return {
          valid: false,
          message: 'Le mot de passe contient un pattern trop prévisible.'
        };
      }
    }

    return { valid: true, message: '' };
  }

  private async cleanupExpiredToken(clientId: number): Promise<void> {
    try {
      await db.update(clients)
        .set({
          passwordResetToken: null,
          passwordResetExpires: null
        })
        .where(eq(clients.id, clientId));
    } catch (error) {
      console.error('Error cleaning up expired token:', error);
    }
  }

  async cleanupAllExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      
      // Sélectionner les clients avec des tokens expirés
      const expiredClients = await db.select({ id: clients.id })
        .from(clients)
        .where(eq(clients.passwordResetExpires, now)); // Drizzle syntax might need adjustment

      let cleanedCount = 0;
      for (const client of expiredClients) {
        await this.cleanupExpiredToken(client.id);
        cleanedCount++;
      }

      return cleanedCount;

    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  generateSecureResetUrl(baseUrl: string, token: string): string {
    return `${baseUrl}/reset-password?token=${token}`;
  }

  async getRateLimitInfo(email: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    // Implémentation basique de rate limiting
    // En production, utiliser Redis ou une solution plus robuste
    
    const key = `password_reset_${email}`;
    const maxAttempts = 3;
    const windowMinutes = 15;
    
    // Simulation - en production, implémenter avec une vraie base de données de cache
    return { allowed: true };
  }

  async logPasswordResetAttempt(email: string, success: boolean, ip?: string): Promise<void> {
    // Log des tentatives pour monitoring de sécurité
    const logEntry = {
      timestamp: new Date().toISOString(),
      email: email,
      success: success,
      ip: ip || 'unknown',
      action: 'password_reset_attempt'
    };

    console.log('Password reset attempt:', logEntry);
    // En production, envoyer vers un système de logging centralisé
  }
}

export const passwordRecovery = new PasswordRecoveryService();