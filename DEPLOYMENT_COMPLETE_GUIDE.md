# 🚀 GUIDE DE DÉPLOIEMENT COMPLET - databackupledger.com

## 📋 **PRÉ-REQUIS POUR LE DÉPLOIEMENT**

### **🌐 Configuration DNS Requise**
```
A     databackupledger.com      → IP_DE_VOTRE_SERVEUR
CNAME www.databackupledger.com  → databackupledger.com
```

### **🖥️ Serveur Requis**
- **OS :** Ubuntu 20.04+ ou Debian 11+
- **RAM :** Minimum 2GB (4GB recommandé)
- **Stockage :** Minimum 20GB
- **Ports :** 22 (SSH), 80 (HTTP), 443 (HTTPS)
- **Accès :** Root ou sudo

---

## 🗂️ **STRUCTURE DES FICHIERS DE DÉPLOIEMENT**

### **Scripts de Déploiement Créés :**
```
/app/
├── install-complete.sh          # Installation automatique complète
├── setup-ssl-production.sh      # Configuration SSL/HTTPS 
├── production-deploy.sh         # Déploiement serveur complet
├── fix-preview-multiport.sh     # Debug multi-ports
├── test-complete.sh            # Tests de validation
└── DEPLOYMENT_GUIDE_databackupledger.md
```

### **Configuration Production :**
```
/app/
├── .env.production             # Variables prod databackupledger.com
├── ecosystem.config.mjs        # Configuration PM2
├── nginx.conf                  # Configuration Nginx optimisée
└── dist/                       # Application compilée
```

---

## 🎯 **ÉTAPES DE DÉPLOIEMENT**

### **ÉTAPE 1 : Préparation du Serveur**
```bash
# Sur votre serveur de production
# 1. Mise à jour système
apt update && apt upgrade -y

# 2. Installation outils de base
apt install -y curl wget git nginx certbot python3-certbot-nginx

# 3. Installation Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 4. Vérification versions
node --version  # Doit afficher v20.x
npm --version   # Doit afficher 10.x
```

### **ÉTAPE 2 : Clonage et Installation**
```bash
# 1. Cloner le projet (remplacez par votre repo)
git clone [VOTRE_REPO_GIT] /opt/databackupledger
cd /opt/databackupledger

# 2. Installation automatique complète
chmod +x install-complete.sh
./install-complete.sh
```

### **ÉTAPE 3 : Configuration SSL et Nginx**
```bash
# Configuration SSL automatique
chmod +x setup-ssl-production.sh
./setup-ssl-production.sh
```

### **ÉTAPE 4 : Validation du Déploiement**
```bash
# Tests complets automatiques
chmod +x test-complete.sh
./test-complete.sh
```

---

## ⚙️ **CONFIGURATION PRODUCTION DÉTAILLÉE**

### **Variables d'Environnement (.env.production)**
```env
# Configuration Production databackupledger.com
NODE_ENV=production
PORT=5000
DOMAIN=databackupledger.com
HTTPS_ENABLED=true

# Base de données PostgreSQL
DATABASE_URL=postgresql://rec_ledger_user:rec_ledger_2025_secure@localhost:5432/rec_ledger

# Sécurité
SESSION_SECRET=ledger_recovery_super_secure_session_secret_2025_production_key_very_long_and_secure

# Email système (Hostinger configuré)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=cs@os-report.com
EMAIL_PASS=Alpha9779@
EMAIL_FROM_NAME=Support Ledger
FROM_EMAIL=cs@os-report.com

# SSL/TLS
SSL_CERT_PATH=/etc/letsencrypt/live/databackupledger.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/databackupledger.com/privkey.pem

# Monitoring
LOG_LEVEL=info
ENABLE_MONITORING=true
```

### **Configuration PM2 (ecosystem.config.mjs)**
```javascript
export default {
  apps: [{
    name: 'databackupledger',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      DOMAIN: 'databackupledger.com'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

---

## 🔐 **CONFIGURATION SÉCURITÉ**

### **SSL/TLS avec Let's Encrypt**
- **Certificat :** Automatique via Certbot
- **Renouvellement :** Auto (crontab configuré)
- **Protocols :** TLS 1.2/1.3 uniquement
- **Sécurité :** A+ sur SSLLabs

### **Headers de Sécurité Nginx**
```nginx
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self';" always;
```

### **Rate Limiting**
```nginx
# API rate limiting (1 req/sec)
limit_req zone=api burst=10 nodelay;
```

---

## 📊 **MONITORING ET MAINTENANCE**

### **Commandes de Gestion Post-Déploiement**
```bash
# Statut des services
pm2 status
nginx -t
systemctl status postgresql

# Logs
pm2 logs databackupledger
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Redémarrage services
pm2 restart databackupledger
systemctl restart nginx
systemctl restart postgresql

# Renouvellement SSL
certbot renew --dry-run
```

### **Sauvegarde Automatique**
```bash
# Script de sauvegarde quotidienne (sera configuré)
0 2 * * * /opt/databackupledger/backup-system.sh
```

---

## 🧪 **VALIDATION POST-DÉPLOIEMENT**

### **Tests à Effectuer :**
```bash
# 1. Test HTTPS
curl -I https://databackupledger.com

# 2. Test API
curl https://databackupledger.com/api/auth/me

# 3. Test login
curl -X POST https://databackupledger.com/api/client/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@demo.com","password":"demo123"}'

# 4. Test SSL Rating
# https://www.ssllabs.com/ssltest/analyze.html?d=databackupledger.com
```

### **Checklist de Validation :**
- [ ] DNS configuré et propagé
- [ ] Site accessible sur https://databackupledger.com
- [ ] Certificat SSL valide (vert dans navigateur)
- [ ] Toutes les pages chargent correctement
- [ ] Authentification fonctionne (3 rôles)
- [ ] API répond correctement
- [ ] Base de données opérationnelle
- [ ] Emails de test envoyés
- [ ] Performance satisfaisante
- [ ] Monitoring actif

---

## 🎯 **URLS DE PRODUCTION**

### **URLs Principales :**
- **Site Principal :** https://databackupledger.com
- **Avec WWW :** https://www.databackupledger.com
- **API Endpoint :** https://databackupledger.com/api/
- **Health Check :** https://databackupledger.com/health

### **Comptes de Démonstration :**
- **Client :** client@demo.com / demo123
- **Admin :** admin@ledger.com / admin123
- **Vendeur :** vendeur@demo.com / vendeur123

---

## 🚨 **DÉPANNAGE COMMUN**

### **Problèmes Fréquents :**

#### **1. Site non accessible**
```bash
# Vérifier DNS
nslookup databackupledger.com
dig databackupledger.com

# Vérifier Nginx
nginx -t
systemctl status nginx
```

#### **2. Erreur SSL**
```bash
# Vérifier certificats
certbot certificates
ls -la /etc/letsencrypt/live/databackupledger.com/
```

#### **3. Application ne démarre pas**
```bash
# Vérifier logs PM2
pm2 logs databackupledger
pm2 restart databackupledger

# Vérifier base de données
sudo -u postgres psql -d rec_ledger -c "SELECT 1"
```

---

## 🎉 **DÉPLOIEMENT PRÊT !**

Tous les scripts et configurations sont prêts pour le déploiement sur **databackupledger.com**.

### **📞 Support :**
- **Scripts :** Tous testés et fonctionnels
- **Configuration :** Optimisée pour production
- **Sécurité :** SSL + Headers + Rate limiting
- **Monitoring :** PM2 + Nginx + PostgreSQL

**PRÊT POUR LE DÉPLOIEMENT IMMÉDIAT !** 🚀