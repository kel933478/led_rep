#!/bin/bash
# Script d'installation automatique complète - Ledger Récupération
# Auteur: Installation automatisée pour rec-ledger.com

set -e

echo "🚀 INSTALLATION AUTOMATIQUE LEDGER RÉCUPÉRATION"
echo "================================================="

# Variables de configuration
DOMAIN="rec-ledger.com"
DB_NAME="rec_ledger"
DB_USER="rec_ledger_user"
DB_PASSWORD="rec_ledger_2025_secure"
SESSION_SECRET=$(openssl rand -base64 32)

echo "📋 Configuration:"
echo "- Domaine: $DOMAIN"
echo "- Base de données: $DB_NAME"
echo "- Utilisateur DB: $DB_USER"
echo ""

# Vérification des prérequis
echo "🔍 Vérification des prérequis..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js requis"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm requis"; exit 1; }
command -v sudo >/dev/null 2>&1 || { echo "❌ sudo requis"; exit 1; }

echo "✅ Prérequis validés"
echo ""

# Installation PostgreSQL
echo "🗄️ Installation PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Configuration PostgreSQL
echo "⚙️ Configuration PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Base de données déjà existante"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "Utilisateur déjà existant"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# Démarrage PostgreSQL
echo "🚀 Démarrage PostgreSQL..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    sudo -u postgres /usr/lib/postgresql/*/bin/pg_ctl -D /var/lib/postgresql/*/main -l /var/lib/postgresql/*/main/pg.log start
fi

# Installation dépendances Node.js
echo "📦 Installation des dépendances..."
npm install

# Configuration environnement
echo "⚙️ Configuration environnement..."
cat > .env << EOF
# Configuration Ledger Récupération
NODE_ENV=production
PORT=5000
DOMAIN=$DOMAIN

# Base de données PostgreSQL
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Sécurité
SESSION_SECRET=$SESSION_SECRET

# Email système (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=cs@os-report.com
EMAIL_PASS=Alpha9779@
EMAIL_FROM_NAME=Support Ledger
FROM_EMAIL=cs@os-report.com

# Configuration production
LOG_LEVEL=info
ENABLE_MONITORING=true
EOF

# Migrations base de données
echo "🔄 Application des migrations..."
npm run db:push

# Build application
echo "🏗️ Build de l'application..."
npm run build

# Installation PM2
echo "🔧 Installation PM2..."
npm install -g pm2

# Création des dossiers nécessaires
mkdir -p logs
mkdir -p uploads/kyc

# Démarrage avec PM2
echo "🚀 Démarrage avec PM2..."
pm2 start dist/index.js --name "rec-ledger"
pm2 save
pm2 startup

echo ""
echo "✅ INSTALLATION TERMINÉE AVEC SUCCÈS!"
echo "====================================="
echo ""
echo "🎯 Accès à l'application:"
echo "- URL: http://localhost:$PORT"
echo "- Client: client@demo.com / demo123"
echo "- Admin: admin@ledger.com / admin123"
echo "- Vendeur: vendeur@demo.com / vendeur123"
echo ""
echo "🔧 Commandes utiles:"
echo "- Statut: pm2 status"
echo "- Logs: pm2 logs rec-ledger"
echo "- Redémarrage: pm2 restart rec-ledger"
echo "- Arrêt: pm2 stop rec-ledger"
echo ""
echo "📊 Vérification finale..."
sleep 3
if curl -f http://localhost:$PORT/api/auth/me >/dev/null 2>&1; then
    echo "✅ Application démarrée avec succès!"
else
    echo "⚠️ Vérifiez le statut avec: pm2 logs rec-ledger"
fi