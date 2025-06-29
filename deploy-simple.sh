#!/bin/bash
# Script de déploiement simplifié et robuste
# Résout les problèmes courants de déploiement

set -e

# Variables
DOMAIN="databackupledger.com"
APP_DIR="/opt/databackupledger"
DB_NAME="rec_ledger"
DB_USER="rec_ledger_user"
DB_PASSWORD="rec_ledger_2025_secure"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 DÉPLOIEMENT SIMPLIFIÉ databackupledger.com${NC}"
echo "================================================="

# Fonction de logging avec gestion d'erreurs
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error_exit() {
    echo -e "${RED}[ERREUR] $1${NC}"
    echo -e "${YELLOW}🔍 Exécutez ./diagnose-deployment.sh pour diagnostiquer${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[ATTENTION] $1${NC}"
}

# Vérification prérequis de base
log "🔍 Vérification prérequis..."

# Vérification root/sudo
if [[ $EUID -ne 0 ]]; then
    error_exit "Ce script doit être exécuté avec sudo"
fi

# Vérification OS supporté
if ! command -v apt-get &> /dev/null; then
    error_exit "OS non supporté. Nécessite Ubuntu/Debian avec apt-get"
fi

# Vérification connectivité
if ! curl -s --max-time 10 google.com > /dev/null; then
    error_exit "Pas de connectivité Internet"
fi

log "✅ Prérequis validés"

# Mise à jour système avec gestion d'erreurs
log "📦 Mise à jour système..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y || error_exit "Échec mise à jour des paquets"

# Installation dépendances essentielles
log "🔧 Installation dépendances essentielles..."
apt-get install -y curl wget git nginx postgresql postgresql-contrib ufw || error_exit "Échec installation dépendances"

# Installation Node.js avec vérification
log "📦 Installation Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || error_exit "Échec téléchargement Node.js"
    apt-get install -y nodejs || error_exit "Échec installation Node.js"
fi

# Vérification version Node.js
NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ $NODE_VERSION -lt 16 ]; then
    error_exit "Version Node.js trop ancienne: $(node --version). Requis: ≥16"
fi

log "✅ Node.js $(node --version) installé"

# Installation PM2
log "🔧 Installation PM2..."
npm install -g pm2 || error_exit "Échec installation PM2"

# Configuration PostgreSQL
log "🗄️ Configuration PostgreSQL..."
systemctl start postgresql || error_exit "Échec démarrage PostgreSQL"
systemctl enable postgresql

# Création base de données avec gestion d'erreurs
log "📊 Configuration base de données..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || error_exit "Échec création base de données"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" || error_exit "Échec création utilisateur DB"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || error_exit "Échec attribution permissions DB"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" || error_exit "Échec modification utilisateur DB"

# Test connexion base de données
if ! sudo -u postgres psql -d $DB_NAME -c "SELECT 1;" > /dev/null; then
    error_exit "Impossible de se connecter à la base de données"
fi

log "✅ Base de données configurée"

# Préparation répertoire application
log "📂 Préparation application..."
mkdir -p $APP_DIR
cp -r . $APP_DIR/ 2>/dev/null || true
cd $APP_DIR

# Installation dépendances Node.js
log "📦 Installation dépendances Node.js..."
if [ -f "package.json" ]; then
    npm install || error_exit "Échec installation dépendances npm"
else
    error_exit "package.json manquant"
fi

# Configuration environnement
log "⚙️ Configuration environnement..."
if [ ! -f ".env.production" ]; then
    warning ".env.production manquant, création automatique..."
    cat > .env.production << EOF
NODE_ENV=production
PORT=5000
DOMAIN=$DOMAIN
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$(openssl rand -base64 32)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=cs@os-report.com
EMAIL_PASS=Alpha9779@
EMAIL_FROM_NAME=Support Ledger
FROM_EMAIL=cs@os-report.com
LOG_LEVEL=info
ENABLE_MONITORING=true
EOF
fi

cp .env.production .env

# Build application
log "🏗️ Build application..."
if [ -f "package.json" ] && grep -q "build" package.json; then
    npm run build || error_exit "Échec build application"
else
    warning "Script build non trouvé, ignoré..."
fi

# Migration base de données
log "🔄 Migration base de données..."
if [ -f "package.json" ] && grep -q "db:push" package.json; then
    npm run db:push || warning "Échec migration - continuons..."
else
    warning "Script migration non trouvé, ignoré..."
fi

# Configuration Nginx simplifiée
log "🌐 Configuration Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name databackupledger.com www.databackupledger.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Activation site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration Nginx
if ! nginx -t; then
    error_exit "Configuration Nginx invalide"
fi

systemctl restart nginx || error_exit "Échec redémarrage Nginx"
systemctl enable nginx

log "✅ Nginx configuré"

# Démarrage application
log "🚀 Démarrage application..."

# Arrêt processus existants
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Démarrage avec PM2
if [ -f "dist/index.js" ]; then
    pm2 start dist/index.js --name "$DOMAIN" || error_exit "Échec démarrage avec dist/"
elif [ -f "server/index.js" ]; then
    pm2 start server/index.js --name "$DOMAIN" || error_exit "Échec démarrage avec server/"
elif [ -f "index.js" ]; then
    pm2 start index.js --name "$DOMAIN" || error_exit "Échec démarrage avec index.js"
else
    error_exit "Fichier principal de l'application non trouvé"
fi

pm2 save
pm2 startup

# Configuration firewall basique
log "🔥 Configuration firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

# Tests finaux
log "🧪 Tests finaux..."
sleep 5

# Test application locale
if curl -f -s http://localhost:5000 > /dev/null; then
    log "✅ Application accessible localement"
else
    error_exit "Application non accessible localement"
fi

# Test Nginx
if curl -f -s http://localhost > /dev/null; then
    log "✅ Nginx proxy fonctionne"
else
    warning "⚠️ Nginx proxy peut avoir des problèmes"
fi

# Informations finales
echo ""
echo -e "${GREEN}🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!${NC}"
echo "======================================="
echo ""
echo -e "${BLUE}📊 Statut des services:${NC}"
echo "- PostgreSQL: $(systemctl is-active postgresql)"
echo "- Nginx: $(systemctl is-active nginx)"
echo "- Application: $(pm2 list | grep $DOMAIN | awk '{print $18}' || echo 'unknown')"
echo ""
echo -e "${BLUE}🌐 URLs d'accès:${NC}"
echo "- Local: http://localhost"
echo "- Public: http://$(curl -s ifconfig.me || echo 'IP_PUBLIC')"
echo "- Domaine: http://$DOMAIN (si DNS configuré)"
echo ""
echo -e "${BLUE}👤 Comptes de test:${NC}"
echo "- Client: client@demo.com / demo123"
echo "- Admin: admin@ledger.com / admin123"
echo "- Vendeur: vendeur@demo.com / vendeur123"
echo ""
echo -e "${BLUE}🔧 Commandes utiles:${NC}"
echo "- Status: pm2 status"
echo "- Logs: pm2 logs $DOMAIN"
echo "- Restart: pm2 restart $DOMAIN"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes recommandées:${NC}"
echo "1. Configurez DNS pour $DOMAIN"
echo "2. Installez SSL: certbot --nginx -d $DOMAIN"
echo "3. Testez toutes les fonctionnalités"
echo ""
echo -e "${GREEN}Déploiement simple terminé !${NC}"