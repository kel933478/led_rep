#!/bin/bash

# Script de déploiement complet pour databackupledger.com
set -e

echo "🚀 Déploiement production databackupledger.com"

# Variables de configuration
DOMAIN="databackupledger.com"
APP_DIR="/opt/databackupledger"
USER="databackupledger"
DB_NAME="rec_ledger"
DB_USER="rec_ledger_user"

# Création de l'utilisateur système
if ! id "$USER" &>/dev/null; then
    echo "Création utilisateur système $USER"
    sudo useradd -m -s /bin/bash $USER
    sudo usermod -aG sudo $USER
fi

# Création du répertoire application
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Installation Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Configuration base de données
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD 'rec_ledger_2025_secure';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# Installation PM2
sudo npm install -g pm2

# Copie des fichiers application
sudo cp -r . $APP_DIR/
sudo chown -R $USER:$USER $APP_DIR

# Installation dépendances
cd $APP_DIR
sudo -u $USER npm ci --production

# Build application
sudo -u $USER npm run build

# Configuration environnement production
sudo -u $USER cp .env.production .env

# Configuration base de données
export DATABASE_URL="postgresql://$DB_USER:rec_ledger_2025_secure@localhost:5432/$DB_NAME"
sudo -u $USER bash -c "echo 'DATABASE_URL=$DATABASE_URL' >> .env"

# Génération secret session
SESSION_SECRET=$(openssl rand -base64 32)
sudo -u $USER bash -c "echo 'SESSION_SECRET=$SESSION_SECRET' >> .env"

# Migration base de données
sudo -u $USER npm run db:push

# Configuration SSL
./setup-ssl-production.sh

# Démarrage avec PM2
sudo -u $USER pm2 start ecosystem.config.js --env production
sudo -u $USER pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# Configuration firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Test final
sleep 10
if curl -f https://$DOMAIN/api/auth/me &>/dev/null; then
    echo "✅ Déploiement réussi - https://$DOMAIN"
else
    echo "⚠️ Application démarrée, vérifiez la configuration DNS"
fi

echo "🎯 Déploiement terminé"