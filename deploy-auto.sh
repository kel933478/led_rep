#!/bin/bash
# Script de déploiement automatique pour databackupledger.com
# Version: Production Ready

set -e

# Variables de configuration
DOMAIN="databackupledger.com"
APP_DIR="/opt/databackupledger"
USER="databackupledger"
DB_NAME="rec_ledger"
DB_USER="rec_ledger_user"
DB_PASSWORD="rec_ledger_2025_secure"
EMAIL="admin@databackupledger.com"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DÉPLOIEMENT AUTOMATIQUE databackupledger.com${NC}"
echo "=============================================="
echo ""

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Vérification des prérequis
log "🔍 Vérification des prérequis..."

# Vérification root/sudo
if [[ $EUID -ne 0 ]]; then
   error "Ce script doit être exécuté en tant que root ou avec sudo"
fi

# Vérification OS
if ! command -v apt-get &> /dev/null; then
    error "Ce script nécessite Ubuntu/Debian avec apt-get"
fi

log "✅ Prérequis validés"

# Mise à jour système
log "📦 Mise à jour du système..."
apt-get update -y && apt-get upgrade -y

# Installation des dépendances système
log "🔧 Installation des dépendances..."
apt-get install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib ufw fail2ban

# Installation Node.js 20 LTS
log "📦 Installation Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Vérification versions
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "✅ Node.js $NODE_VERSION installé"
log "✅ npm $NPM_VERSION installé"

# Installation PM2
log "🔧 Installation PM2..."
npm install -g pm2

# Création utilisateur système
log "👤 Création utilisateur système..."
if ! id "$USER" &>/dev/null; then
    useradd -m -s /bin/bash $USER
    usermod -aG sudo $USER
    log "✅ Utilisateur $USER créé"
else
    log "ℹ️ Utilisateur $USER existe déjà"
fi

# Création répertoire application
log "📂 Création répertoire application..."
mkdir -p $APP_DIR
chown $USER:$USER $APP_DIR

# Copie des fichiers application
log "📋 Copie des fichiers application..."
cp -r . $APP_DIR/
chown -R $USER:$USER $APP_DIR

# Installation dépendances Node.js
log "📦 Installation dépendances Node.js..."
cd $APP_DIR
sudo -u $USER npm install

# Configuration PostgreSQL
log "🗄️ Configuration PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Création base de données
log "📊 Création base de données..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || log "ℹ️ Base de données déjà existante"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || log "ℹ️ Utilisateur déjà existant"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# Configuration environnement production
log "⚙️ Configuration environnement production..."
sudo -u $USER cp .env.production .env

# Build application
log "🏗️ Build de l'application..."
sudo -u $USER npm run build

# Migration base de données
log "🔄 Application des migrations..."
sudo -u $USER npm run db:push

# Configuration Nginx
log "🌐 Configuration Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Main proxy configuration
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Static files avec cache optimisé
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        access_log off;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
EOF

# Activation du site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration Nginx
log "🧪 Test configuration Nginx..."
nginx -t || error "Configuration Nginx invalide"

# Redémarrage Nginx
log "🔄 Redémarrage Nginx..."
systemctl restart nginx
systemctl enable nginx

# Configuration SSL avec Certbot
log "🔐 Configuration SSL avec Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

# Configuration renouvellement automatique
log "🔄 Configuration renouvellement automatique SSL..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Configuration Firewall
log "🔥 Configuration Firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Configuration Fail2Ban
log "🛡️ Configuration Fail2Ban..."
systemctl start fail2ban
systemctl enable fail2ban

# Démarrage application avec PM2
log "🚀 Démarrage application avec PM2..."
cd $APP_DIR
sudo -u $USER pm2 start ecosystem.config.mjs --env production
sudo -u $USER pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# Configuration sauvegarde automatique
log "💾 Configuration sauvegarde automatique..."
mkdir -p /opt/backups
echo "0 2 * * * cd $APP_DIR && ./backup-system.sh" | sudo -u $USER crontab -

# Tests finaux
log "🧪 Tests finaux..."
sleep 10

# Test local
if curl -f -s http://localhost:5000/api/auth/me >/dev/null; then
    log "✅ Application accessible localement"
else
    warning "⚠️ Application non accessible localement"
fi

# Test HTTPS (si DNS configuré)
if curl -f -s -k https://$DOMAIN/api/auth/me >/dev/null 2>&1; then
    log "✅ Site accessible en HTTPS"
else
    warning "⚠️ Site non accessible en HTTPS - Vérifiez la configuration DNS"
fi

# Affichage des informations finales
echo ""
echo -e "${GREEN}✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}🌐 URLs d'accès:${NC}"
echo "   - https://$DOMAIN"
echo "   - https://www.$DOMAIN"
echo ""
echo -e "${BLUE}👤 Comptes de démonstration:${NC}"
echo "   - Client: client@demo.com / demo123"
echo "   - Admin: admin@ledger.com / admin123"
echo "   - Vendeur: vendeur@demo.com / vendeur123"
echo ""
echo -e "${BLUE}🔧 Commandes de gestion:${NC}"
echo "   - Statut: pm2 status"
echo "   - Logs: pm2 logs databackupledger"
echo "   - Redémarrage: pm2 restart databackupledger"
echo "   - SSL: certbot certificates"
echo ""
echo -e "${BLUE}📊 Vérifications recommandées:${NC}"
echo "   - Test SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "   - Test vitesse: https://pagespeed.web.dev/"
echo "   - Monitoring: pm2 monit"
echo ""
if [[ $(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null) == "200" ]]; then
    echo -e "${GREEN}🎉 Site opérationnel: https://$DOMAIN${NC}"
else
    echo -e "${YELLOW}⚠️ Configurez DNS puis testez: https://$DOMAIN${NC}"
fi
echo ""
echo -e "${GREEN}Déploiement réussi pour databackupledger.com !${NC}"