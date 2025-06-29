# 🌐 GUIDE DE DÉPLOIEMENT - databackupledger.com

## ✅ CONFIGURATION TERMINÉE POUR LE NOUVEAU DOMAINE

L'application Ledger Récupération a été entièrement mise à jour pour le domaine **databackupledger.com**.

## 📋 CHANGEMENTS APPLIQUÉS

### **1. Configuration Environnement**
- ✅ `.env.production` mis à jour avec databackupledger.com
- ✅ Variables SSL pointant vers les nouveaux certificats
- ✅ Configuration email maintenue (Hostinger)

### **2. Scripts de Déploiement**
- ✅ `install-complete.sh` mis à jour pour databackupledger.com
- ✅ `setup-ssl-production.sh` configuré pour le nouveau domaine
- ✅ `production-deploy.sh` adapté au nouveau domaine

### **3. Configuration PM2**
- ✅ `ecosystem.config.mjs` mis à jour
- ✅ Nom du processus: `databackupledger`
- ✅ Variables d'environnement adaptées

### **4. Configuration Nginx**
- ✅ `nginx.conf` entièrement reconfiguré
- ✅ SSL optimisé avec Let's Encrypt
- ✅ Headers de sécurité renforcés
- ✅ Rate limiting configuré
- ✅ Compression Gzip optimisée

## 🚀 DÉPLOIEMENT POUR databackupledger.com

### **Étape 1: Configuration DNS**
Configurez votre DNS pour pointer vers votre serveur :
```
A     databackupledger.com      → IP_DE_VOTRE_SERVEUR
CNAME www.databackupledger.com  → databackupledger.com
```

### **Étape 2: Installation Automatique**
Sur votre serveur de production :
```bash
# Clonez le projet
git clone [votre-repo] /opt/databackupledger
cd /opt/databackupledger

# Exécutez l'installation complète
chmod +x install-complete.sh
sudo ./install-complete.sh
```

### **Étape 3: Configuration SSL**
```bash
# Configuration SSL automatique avec Let's Encrypt
chmod +x setup-ssl-production.sh
sudo ./setup-ssl-production.sh
```

### **Étape 4: Démarrage Production**
```bash
# Copie de la configuration production
cp .env.production .env

# Arrêt du mode développement
pm2 stop all
pm2 delete all

# Démarrage production avec le nouveau nom
pm2 start ecosystem.config.mjs --env production
pm2 save
pm2 startup
```

## 🔐 SÉCURITÉ RENFORCÉE

### **SSL/TLS**
- Certificat Let's Encrypt automatique pour databackupledger.com
- TLS 1.2/1.3 uniquement
- HSTS avec preload
- OCSP Stapling activé

### **Headers Sécurité**
- Content Security Policy configurée
- Protection XSS et CSRF
- Sécurisation des uploads
- Rate limiting API (1 req/sec)

### **Monitoring**
- Logs centralisés Nginx
- Surveillance PM2 automatique
- Health check endpoint `/health`

## 📊 COMMANDES DE GESTION

### **Application**
```bash
pm2 status                      # Statut des processus
pm2 logs databackupledger       # Voir les logs
pm2 restart databackupledger    # Redémarrer
pm2 stop databackupledger       # Arrêter
```

### **SSL/Nginx**
```bash
sudo nginx -t                   # Test configuration
sudo systemctl reload nginx     # Recharger Nginx
sudo certbot renew              # Renouveler SSL
```

### **Base de Données**
```bash
sudo -u postgres psql -d rec_ledger    # Accès direct DB
npm run db:push                         # Appliquer migrations
```

## 🎯 ACCÈS POST-DÉPLOIEMENT

### **URLs de Production**
- **Principal :** https://databackupledger.com
- **WWW :** https://www.databackupledger.com
- **API :** https://databackupledger.com/api/
- **Health :** https://databackupledger.com/health

### **Comptes de Démonstration**
- **Client :** client@demo.com / demo123
- **Admin :** admin@ledger.com / admin123
- **Vendeur :** vendeur@demo.com / vendeur123

## ✅ CHECKLIST DE VÉRIFICATION

### **Avant Déploiement**
- [ ] DNS configuré pour databackupledger.com
- [ ] Serveur avec Ubuntu/Debian
- [ ] Ports 80/443/22 ouverts
- [ ] Accès root/sudo disponible

### **Après Déploiement**
- [ ] Site accessible sur https://databackupledger.com
- [ ] Certificat SSL valide (A+ sur SSLLabs)
- [ ] Connexions utilisateurs fonctionnelles
- [ ] API répondant correctement
- [ ] Logs PM2 sans erreurs

## 🔄 MAINTENANCE AUTOMATISÉE

### **Renouvellement SSL**
Configuré automatiquement avec crontab :
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

### **Sauvegardes**
Script de sauvegarde quotidienne :
```bash
0 2 * * * /opt/databackupledger/backup-system.sh
```

### **Monitoring**
- Surveillance automatique PM2
- Alertes système configurées
- Rotation des logs automatique

---

## 🎉 READY FOR databackupledger.com !

L'application Ledger Récupération est maintenant entièrement configurée et prête pour le déploiement sur **databackupledger.com** avec :

✅ **Configuration complète** pour le nouveau domaine  
✅ **SSL automatique** avec Let's Encrypt  
✅ **Sécurité renforcée** avec headers optimisés  
✅ **Performance optimisée** avec cache et compression  
✅ **Monitoring complet** avec PM2 et Nginx  

**Le déploiement peut commencer immédiatement !** 🚀