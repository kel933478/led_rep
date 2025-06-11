# GUIDE DE DÉPLOIEMENT COMPLET - rec-ledger.com

## CONFIGURATION TERMINÉE

L'application Ledger Récupération est maintenant entièrement configurée pour le déploiement sur rec-ledger.com avec toutes les sécurités SSL et configurations de production.

## FICHIERS DE DÉPLOIEMENT CRÉÉS

### Scripts d'Installation
- `production-deploy.sh` - Déploiement automatique complet
- `setup-ssl.sh` - Configuration SSL avec Let's Encrypt
- `deploy.sh` - Script de build et vérifications
- `backup-system.sh` - Système de sauvegarde automatique

### Configuration Serveur
- `nginx.conf` - Configuration Nginx avec SSL/TLS 1.3
- `ecosystem.config.js` - Configuration PM2 pour production
- `.env.production` - Variables d'environnement production
- `docker-compose.yml` - Déploiement containerisé complet

### Monitoring et Sécurité
- `monitoring.js` - Surveillance système temps réel
- `healthcheck.js` - Vérification santé application
- `Dockerfile` - Image de production optimisée

## COMMANDES DE DÉPLOIEMENT

### Option 1: Déploiement Automatique Complet
```bash
# Exécution du script principal
sudo ./production-deploy.sh
```

Ce script effectue automatiquement:
- Installation Node.js 20 LTS
- Configuration PostgreSQL
- Génération certificat SSL
- Configuration Nginx
- Démarrage application avec PM2
- Configuration firewall
- Tests de validation

### Option 2: Déploiement Docker
```bash
# Démarrage avec Docker Compose
docker-compose up -d --build
```

### Option 3: Déploiement Manuel Étape par Étape
```bash
# 1. Configuration SSL
./setup-ssl.sh

# 2. Build application
npm run build

# 3. Configuration environnement
cp .env.production .env

# 4. Démarrage production
pm2 start ecosystem.config.js --env production
```

## CONFIGURATION RÉSEAU REQUISE

### DNS pour rec-ledger.com
```
A     rec-ledger.com      → IP_SERVEUR
CNAME www.rec-ledger.com  → rec-ledger.com
```

### Ports Ouverts
- 80 (HTTP - redirection HTTPS)
- 443 (HTTPS - application)
- 22 (SSH - administration)
- 5432 (PostgreSQL - local uniquement)

## SÉCURITÉ IMPLÉMENTÉE

### SSL/TLS
- Certificat Let's Encrypt automatique
- TLS 1.2/1.3 uniquement
- HSTS avec preload activé
- OCSP Stapling configuré

### Application
- Headers sécurité Helmet
- Rate limiting 100 req/15min
- CORS limité au domaine
- Sessions sécurisées
- Protection CSRF/XSS

### Système
- Utilisateur non-root dédié
- Firewall UFW configuré
- Logs centralisés
- Monitoring temps réel
- Sauvegardes automatiques

## DONNÉES PRÉSERVÉES

Toutes les fonctionnalités opérationnelles:
- Authentification 3 rôles (Client/Admin/Vendeur)
- Portefeuille client: 55 000€
- Système taxes: 15% = 8 250€
- Wallet BTC configuré par admin
- Interface multilingue FR/EN
- Design Ledger Live authentique

## MAINTENANCE AUTOMATISÉE

### Sauvegardes Quotidiennes
```bash
# Ajout à crontab
0 2 * * * /opt/rec-ledger/backup-system.sh
```

### Renouvellement SSL
```bash
# Renouvellement automatique Let's Encrypt
0 12 * * * /usr/bin/certbot renew --quiet
```

### Monitoring Continu
- Vérification santé toutes les minutes
- Alertes mémoire/CPU automatiques
- Rotation logs quotidienne
- Surveillance uptime

## VÉRIFICATION FINALE

Après déploiement, vérifiez:
1. Application accessible sur https://rec-ledger.com
2. Certificat SSL valide (grade A+)
3. Toutes les authentifications fonctionnelles
4. Système de taxes opérationnel
5. Monitoring actif

L'application est maintenant prête pour un déploiement production immédiat avec sécurité maximale et haute disponibilité.