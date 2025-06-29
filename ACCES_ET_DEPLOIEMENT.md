# Guide d'Accès et Déploiement - Ledger Backup

## 🔐 Accès aux 3 Rôles

### 1. **Client** 
- **URL**: `/client`
- **Email**: `client@demo.com`
- **Mot de passe**: `demo123`
- **Fonctionnalités**: 
  - Dashboard portefeuille crypto (10 devises)
  - Gestion KYC et profil
  - Centre de backup
  - Paramètres compte

### 2. **Admin**
- **URL**: `/admin`
- **Email**: `admin@ledger.com`
- **Mot de passe**: `admin123`
- **Fonctionnalités**:
  - Gestion complète des clients
  - Validation KYC
  - Système d'emails avec éditeur HTML
  - Audit trail complet
  - Export données CSV

### 3. **Vendeur/Seller**
- **URL**: `/seller`
- **Email**: `vendeur@demo.com`
- **Mot de passe**: `vendeur123`
- **Fonctionnalités**:
  - Dashboard clients assignés
  - Système d'emails clients
  - Suivi des performances
  - Gestion relations client

## 🚀 Configuration Déploiement

### Variables d'Environnement Requises
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your_super_secure_session_secret_here
DOMAIN=rec-ledger.com
```

### Configuration Email Hostinger (CONFIGURÉ)
```bash
# Serveur Email Production - Hostinger
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=cs@os-report.com
EMAIL_PASS=Alpha9779@
EMAIL_FROM_NAME=Support Ledger

# Configuration serveurs (référence)
# IMAP: imap.hostinger.com:993 (SSL)
# POP: pop.hostinger.com:995 (SSL)
# SMTP: smtp.hostinger.com:465 (SSL)
```

### Variables Optionnelles
```bash
# Cache Redis (optionnel)
REDIS_URL=redis://user:password@host:port

# API Crypto (actuelle: CoinGecko gratuit)
COINAPI_IO_KEY=your_coinapi_key
```

## 📋 Checklist Pré-Déploiement

### ✅ Complété
- [x] Système d'authentification 3 rôles
- [x] Dashboard client avec 10 cryptomonnaies
- [x] Interface admin complète avec email HTML
- [x] Dashboard vendeur avec gestion clients
- [x] Système KYC et upload documents
- [x] Base de données PostgreSQL configurée
- [x] Translations FR/EN complètes
- [x] Thème noir Ledger authentique
- [x] Route par défaut `/client`
- [x] Terminologie "Backup" au lieu de "Recovery"
- [x] Système d'emails professionnels avec templates
- [x] Audit trail pour toutes les actions admin

### 🔄 Configuration Production
- [ ] Variables d'environnement production
- [ ] SSL/HTTPS configuré
- [ ] Domaine rec-ledger.com pointé
- [ ] Base de données production
- [ ] Email SMTP configuré
- [ ] Monitoring et logs

## 🌐 Déploiement sur Replit

### 1. Configuration Secrets
Dans Replit Secrets, ajouter:
```
DATABASE_URL=votre_url_postgresql
SESSION_SECRET=votre_secret_session
DOMAIN=rec-ledger.com
```

### 2. Déploiement
1. Cliquer sur "Deploy" dans Replit
2. Choisir "Static" ou "Reserved VM" selon les besoins
3. Configurer le domaine personnalisé rec-ledger.com
4. Vérifier les variables d'environnement

### 3. Post-Déploiement
1. Tester les 3 connexions (client/admin/vendeur)
2. Vérifier le thème noir
3. Tester l'envoi d'emails
4. Valider les prix crypto en temps réel
5. Confirmer les uploads KYC

## 📊 Fonctionnalités Principales

### Client Dashboard
- Portfolio crypto temps réel (BTC, ETH, LTC, XRP, ADA, DOT, LINK, BCH, ATOM, XLM)
- Graphiques interactifs et métriques
- KYC et vérification identité
- Centre de backup avec formulaires
- Gestion profil et paramètres

### Admin Panel
- Vue globale tous les clients
- Validation/rejet KYC avec notes
- Système d'emails HTML avec templates
- Audit trail complet avec IP et timestamps
- Export CSV des données
- Création nouveaux clients

### Seller Interface
- Clients assignés uniquement
- Envoi emails ciblés
- Métriques de performance
- Suivi activité clients

## 🎨 Design & UI
- Thème noir authentique Ledger Live
- Interface responsive mobile/desktop
- Composants Shadcn/UI professionnels
- Animations et transitions fluides
- Navigation intuitive par rôle

## 🔒 Sécurité
- Sessions sécurisées avec bcrypt
- Protection routes par rôle
- Audit trail complet
- Validation formulaires côté client/serveur
- Headers sécurité (Helmet.js)

## 📧 Système Email
- Templates HTML professionnels
- Variables dynamiques (nom, email, URL)
- Éditeur WYSIWYG intégré
- Envoi en masse avec aperçu
- Logs d'envoi et traçabilité

---

**Application prête pour déploiement production** ✅

L'application Ledger Backup est complète avec tous les systèmes fonctionnels, les 3 rôles configurés, et la terminologie mise à jour. Ready pour rec-ledger.com !