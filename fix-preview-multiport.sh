#!/bin/bash
# Script de démarrage multi-ports pour résoudre les problèmes de preview

set -e

echo "🔧 RÉSOLUTION PREVIEW - DÉMARRAGE MULTI-PORTS"
echo "=============================================="

# Arrêt de tous les processus existants
echo "🛑 Arrêt processus existants..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Nettoyage des ports
echo "🧹 Nettoyage des ports..."
pkill -f "node.*dist" || true
sleep 2

# Configuration de base
cd /app

# Ports à tester
PORTS=(3000 5000 8080 8000 4000)

echo "🚀 Démarrage sur plusieurs ports:"

for PORT in "${PORTS[@]}"; do
    echo "   - Port $PORT..."
    
    # Création d'un fichier .env spécifique
    cat > .env.port$PORT << EOF
NODE_ENV=production
PORT=$PORT
DOMAIN=localhost
DATABASE_URL=postgresql://rec_ledger_user:rec_ledger_2025_secure@localhost:5432/rec_ledger
SESSION_SECRET=ledger_recovery_super_secure_session_secret_2025_preview_key_very_long
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=cs@os-report.com
EMAIL_PASS=Alpha9779@
EMAIL_FROM_NAME=Support Ledger
FROM_EMAIL=cs@os-report.com
COINAPI_IO_KEY=
LOG_LEVEL=info
ENABLE_MONITORING=false
EOF
    
    # Démarrage avec PM2
    cp .env.port$PORT .env
    pm2 start dist/index.js --name "ledger-$PORT" 2>/dev/null || echo "   ❌ Port $PORT déjà utilisé"
done

sleep 10

echo ""
echo "📊 Status des applications:"
pm2 status

echo ""
echo "🧪 Tests de connectivité:"
for PORT in "${PORTS[@]}"; do
    if curl -s --connect-timeout 2 http://localhost:$PORT -o /dev/null; then
        echo "✅ Port $PORT: ACCESSIBLE"
    else
        echo "❌ Port $PORT: Non accessible"
    fi
done

echo ""
echo "🎯 URLs de test disponibles:"
for PORT in "${PORTS[@]}"; do
    if curl -s --connect-timeout 2 http://localhost:$PORT -o /dev/null; then
        echo "   http://localhost:$PORT"
    fi
done

echo ""
echo "👤 Comptes de test:"
echo "   Client: client@demo.com / demo123"
echo "   Admin: admin@ledger.com / admin123"
echo "   Vendeur: vendeur@demo.com / vendeur123"

echo ""
echo "✅ APPLICATIONS MULTI-PORTS DÉMARRÉES!"
echo "Le preview devrait maintenant fonctionner sur l'un des ports disponibles."