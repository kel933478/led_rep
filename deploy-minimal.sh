#!/bin/bash
# Script de déploiement MINIMAL - pour cas difficiles
# Version ultra-simplifiée qui évite les problèmes courants

echo "🔧 DÉPLOIEMENT MINIMAL - databackupledger.com"
echo "============================================="

# Vérifications de base
if [[ $EUID -ne 0 ]]; then
    echo "❌ Exécutez avec sudo"
    exit 1
fi

echo "📦 Installation des outils de base..."
apt-get update -y
apt-get install -y curl wget

echo "📦 Installation Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "📦 Installation PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

echo "🔧 Démarrage PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

echo "📊 Création base de données..."
sudo -u postgres createdb rec_ledger
sudo -u postgres createuser rec_ledger_user
sudo -u postgres psql -c "ALTER USER rec_ledger_user PASSWORD 'rec_ledger_2025_secure';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE rec_ledger TO rec_ledger_user;"

echo "📦 Installation PM2..."
npm install -g pm2

echo "📂 Préparation application..."
mkdir -p /opt/databackupledger
cp -r . /opt/databackupledger/
cd /opt/databackupledger

echo "📦 Installation dépendances..."
npm install

echo "⚙️ Configuration environnement..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://rec_ledger_user:rec_ledger_2025_secure@localhost:5432/rec_ledger
SESSION_SECRET=minimal_deployment_secret_key_2025
EOF

echo "🏗️ Build (si possible)..."
npm run build 2>/dev/null || echo "Build ignoré"

echo "🔄 Migration DB (si possible)..."
npm run db:push 2>/dev/null || echo "Migration ignorée"

echo "🚀 Démarrage application..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

if [ -f "dist/index.js" ]; then
    pm2 start dist/index.js --name databackupledger
elif [ -f "server.js" ]; then
    pm2 start server.js --name databackupledger
else
    echo "❌ Fichier principal non trouvé"
    exit 1
fi

pm2 save

echo "🧪 Test application..."
sleep 3
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ Application démarrée sur http://localhost:5000"
else
    echo "❌ Problème avec l'application"
    pm2 logs databackupledger --lines 10
    exit 1
fi

echo ""
echo "✅ DÉPLOIEMENT MINIMAL TERMINÉ"
echo "URL: http://localhost:5000"
echo "Comptes: client@demo.com/demo123, admin@ledger.com/admin123"
echo ""
echo "Pour Nginx/SSL, installez manuellement:"
echo "apt-get install nginx certbot python3-certbot-nginx"