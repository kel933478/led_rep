# 🚨 GUIDE DE DÉPANNAGE - DÉPLOIEMENT

## ❌ **PROBLÈMES COURANTS ET SOLUTIONS**

### **Le déploiement ne se lance pas ? Suivez ce guide étape par étape.**

---

## 🔍 **ÉTAPE 1: DIAGNOSTIC**

### **Exécutez d'abord le diagnostic :**
```bash
# Téléchargez et exécutez le diagnostic
wget https://raw.githubusercontent.com/VOTRE_REPO/main/diagnose-deployment.sh
chmod +x diagnose-deployment.sh
sudo ./diagnose-deployment.sh
```

---

## 🚨 **PROBLÈMES FRÉQUENTS**

### **1. "Permission denied" ou "sudo required"**
```bash
# SOLUTION: Utilisez sudo
sudo ./deploy-auto.sh
# OU
sudo ./deploy-simple.sh
```

### **2. "Node.js not found" ou version trop ancienne**
```bash
# SOLUTION: Installation manuelle Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node --version  # Doit afficher v20.x
```

### **3. "PostgreSQL connection failed"**
```bash
# SOLUTION: Installation/Redémarrage PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

### **4. "npm install failed" ou dépendances manquantes**
```bash
# SOLUTION: Nettoyage et réinstallation
sudo rm -rf node_modules package-lock.json
sudo npm cache clean --force
sudo npm install
```

### **5. "Port already in use" ou EADDRINUSE**
```bash
# SOLUTION: Libération des ports
sudo pkill -f node
sudo pm2 stop all
sudo pm2 delete all
sudo fuser -k 5000/tcp
```

### **6. "No internet connection"**
```bash
# SOLUTION: Test connectivité
ping google.com
curl google.com
# Vérifiez proxy/firewall si échec
```

---

## 🛠️ **SOLUTIONS PAR NIVEAU**

### **🟢 NIVEAU 1: Déploiement Automatique**
```bash
# Script principal (le plus complet)
sudo ./deploy-auto.sh
```

### **🟡 NIVEAU 2: Déploiement Simplifié**
```bash
# Si le principal échoue, essayez le simplifié
sudo ./deploy-simple.sh
```

### **🔴 NIVEAU 3: Déploiement Minimal**
```bash
# Dernière option, déploiement de base
sudo ./deploy-minimal.sh
```

### **⚫ NIVEAU 4: Installation Manuelle**
```bash
# Installation étape par étape manuelle
sudo apt-get update
sudo apt-get install -y curl wget git nodejs npm postgresql
sudo npm install -g pm2
sudo systemctl start postgresql
# ... puis suivre les étapes une par une
```

---

## 🔧 **COMMANDES DE DÉPANNAGE**

### **Vérification Services**
```bash
# Status des services
sudo systemctl status postgresql
sudo systemctl status nginx
sudo pm2 status

# Redémarrage services
sudo systemctl restart postgresql
sudo systemctl restart nginx
sudo pm2 restart all
```

### **Vérification Logs**
```bash
# Logs système
sudo journalctl -xe
sudo journalctl -u postgresql
sudo journalctl -u nginx

# Logs application
sudo pm2 logs databackupledger
sudo tail -f /var/log/nginx/error.log
```

### **Tests de Connectivité**
```bash
# Test application locale
curl http://localhost:5000
curl http://localhost:5000/api/auth/me

# Test base de données
sudo -u postgres psql -d rec_ledger -c "SELECT 1;"

# Test DNS (si applicable)
nslookup databackupledger.com
ping databackupledger.com
```

---

## 🆘 **SOLUTIONS D'URGENCE**

### **Si TOUT échoue, essayez ces étapes :**

#### **1. Reset Complet**
```bash
# Arrêt de tous les services
sudo pm2 stop all
sudo pm2 delete all
sudo systemctl stop nginx
sudo systemctl stop postgresql

# Nettoyage
sudo rm -rf /opt/databackupledger
sudo apt-get autoremove -y

# Redémarrage propre
sudo reboot
```

#### **2. Installation Ultra-Basique**
```bash
# Après redémarrage, installation minimale
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql
sudo systemctl start postgresql
sudo -u postgres createdb rec_ledger

# Test Node.js
node --version
npm --version

# Si OK, relancez deploy-minimal.sh
```

#### **3. Déploiement Docker (Alternative)**
```bash
# Si rien ne fonctionne, utilisez Docker
sudo apt-get install -y docker.io
sudo docker run -d -p 5000:5000 --name ledger-app node:20
# Puis copiez les fichiers dans le container
```

---

## 📞 **INFORMATIONS DE DEBUG**

### **Collecte d'Informations pour Support**
```bash
# Collectez ces informations si vous avez besoin d'aide
echo "=== SYSTEM INFO ===" > debug-info.txt
uname -a >> debug-info.txt
cat /etc/os-release >> debug-info.txt
free -h >> debug-info.txt
df -h >> debug-info.txt
echo "=== SERVICES ===" >> debug-info.txt
systemctl status postgresql >> debug-info.txt 2>&1
systemctl status nginx >> debug-info.txt 2>&1
pm2 status >> debug-info.txt 2>&1
echo "=== NETWORK ===" >> debug-info.txt
netstat -tuln >> debug-info.txt
echo "=== LOGS ===" >> debug-info.txt
sudo journalctl -xe | tail -50 >> debug-info.txt
```

---

## ✅ **VALIDATION FINALE**

### **Une fois le déploiement réussi :**
```bash
# Tests de validation
curl http://localhost:5000                           # Page d'accueil
curl http://localhost:5000/api/auth/me              # API
curl -X POST http://localhost:5000/api/client/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@demo.com","password":"demo123"}'  # Login

# Si tout fonctionne
sudo ./validate-deployment.sh
```

---

## 🎯 **RÉSUMÉ DES SCRIPTS DISPONIBLES**

1. **`./diagnose-deployment.sh`** - Diagnostic des problèmes
2. **`./deploy-auto.sh`** - Déploiement automatique complet
3. **`./deploy-simple.sh`** - Déploiement simplifié
4. **`./deploy-minimal.sh`** - Déploiement minimal
5. **`./validate-deployment.sh`** - Validation post-déploiement

---

## 🔴 **Si rien ne fonctionne**

**Contactez le support avec :**
- Sortie de `./diagnose-deployment.sh`
- Fichier `debug-info.txt`
- Messages d'erreur exacts
- Type de serveur/OS utilisé

**L'un de ces scripts DOIT fonctionner sur un serveur Ubuntu/Debian standard !**