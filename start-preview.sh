#!/bin/bash
# Script de démarrage Preview - Ledger Récupération
# Fixe les problèmes de preview et démarre l'application en mode production locale

set -e

echo "🚀 DÉMARRAGE PREVIEW LEDGER RÉCUPÉRATION"
echo "======================================="

# Arrêt des processus existants
echo "🛑 Arrêt des processus existants..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Vérification PostgreSQL
echo "🗄️ Vérification PostgreSQL..."
if ! sudo -u postgres psql -c '\q' 2>/dev/null; then
    echo "⚠️ Démarrage PostgreSQL..."
    sudo -u postgres /usr/lib/postgresql/*/bin/pg_ctl -D /var/lib/postgresql/*/main -l /var/lib/postgresql/*/main/pg.log start || true
fi

# Build de l'application
echo "🏗️ Build de l'application..."
npm run build

# Configuration environnement preview
echo "⚙️ Configuration preview..."
cat > .env << EOF
# Configuration Preview Local - Production Build
NODE_ENV=production
PORT=5000
DOMAIN=localhost

# Base de données PostgreSQL
DATABASE_URL=postgresql://rec_ledger_user:rec_ledger_2025_secure@localhost:5432/rec_ledger

# Sécurité
SESSION_SECRET=ledger_recovery_super_secure_session_secret_2025_preview_key_very_long

# Email système (Hostinger configuré)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=cs@os-report.com
EMAIL_PASS=Alpha9779@
EMAIL_FROM_NAME=Support Ledger
FROM_EMAIL=cs@os-report.com

# API Crypto (CoinGecko gratuit)
COINAPI_IO_KEY=

# Configuration preview local
LOG_LEVEL=info
ENABLE_MONITORING=false
EOF

# Démarrage avec PM2
echo "🚀 Démarrage application..."
pm2 start dist/index.js --name "ledger-preview"

# Attente démarrage
echo "⏳ Attente du démarrage..."
sleep 5

# Tests de validation
echo "🧪 Tests de validation..."
if curl -f -s http://localhost:5000 >/dev/null; then
    echo "✅ Frontend accessible"
else
    echo "❌ Problème avec le frontend"
    pm2 logs ledger-preview --lines 5
    exit 1
fi

if curl -f -s http://localhost:5000/api/auth/me >/dev/null; then
    echo "✅ API accessible"
else
    echo "❌ Problème avec l'API"
    pm2 logs ledger-preview --lines 5
    exit 1
fi

# Test login
if curl -s -X POST http://localhost:5000/api/client/login -H "Content-Type: application/json" -d '{"email":"client@demo.com","password":"demo123"}' | grep -q "client@demo.com"; then
    echo "✅ Authentification fonctionnelle"
else
    echo "❌ Problème avec l'authentification"
    exit 1
fi

echo ""
echo "🎉 PREVIEW DÉMARRÉ AVEC SUCCÈS!"
echo "==============================="
echo ""
echo "🌐 URL d'accès: http://localhost:5000"
echo ""
echo "👤 Comptes de test:"
echo "   Client: client@demo.com / demo123"
echo "   Admin: admin@ledger.com / admin123"
echo "   Vendeur: vendeur@demo.com / vendeur123"
echo ""
echo "🔧 Gestion:"
echo "   Statut: pm2 status"
echo "   Logs: pm2 logs ledger-preview"
echo "   Arrêt: pm2 stop ledger-preview"
echo ""
echo "✅ Application prête pour les tests et le déploiement!"