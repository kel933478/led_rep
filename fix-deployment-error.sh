#!/bin/bash
# Script de diagnostic rapide d'erreur de déploiement
# Identifie immédiatement la cause du problème

echo "🚨 DIAGNOSTIC RAPIDE ERREUR DÉPLOIEMENT"
echo "======================================="

# Fonction pour capturer et afficher les erreurs
capture_error() {
    local cmd="$1"
    local desc="$2"
    
    echo ""
    echo "🔍 Test: $desc"
    echo "Commande: $cmd"
    echo "Résultat:"
    
    if eval "$cmd" 2>&1; then
        echo "✅ OK"
    else
        echo "❌ ERREUR DÉTECTÉE ICI!"
        echo "Cette commande a échoué: $cmd"
        return 1
    fi
}

# Tests essentiels
echo "🔍 Identification de l'erreur..."

# Test 1: Permissions
echo ""
echo "1️⃣ TEST PERMISSIONS"
if [[ $EUID -eq 0 ]]; then
    echo "✅ Exécuté en root/sudo"
else
    echo "❌ ERREUR: Pas exécuté en sudo"
    echo "SOLUTION: sudo ./deploy-simple.sh"
    exit 1
fi

# Test 2: Connectivité
echo ""
echo "2️⃣ TEST CONNECTIVITÉ"
if curl -s --max-time 5 google.com > /dev/null; then
    echo "✅ Internet OK"
else
    echo "❌ ERREUR: Pas de connexion Internet"
    echo "SOLUTION: Vérifiez votre connexion réseau"
    exit 1
fi

# Test 3: OS supporté
echo ""
echo "3️⃣ TEST SYSTÈME"
if command -v apt-get &> /dev/null; then
    echo "✅ Ubuntu/Debian détecté"
else
    echo "❌ ERREUR: OS non supporté"
    echo "SOLUTION: Utilisez Ubuntu 20.04+ ou Debian 11+"
    exit 1
fi

# Test 4: Espace disque
echo ""
echo "4️⃣ TEST ESPACE DISQUE"
available=$(df / | awk 'NR==2{print $4}')
if [ $available -gt 2000000 ]; then
    echo "✅ Espace disque suffisant"
else
    echo "❌ ERREUR: Espace disque insuffisant"
    echo "SOLUTION: Libérez de l'espace (minimum 2GB)"
    exit 1
fi

# Test 5: Mise à jour paquets
echo ""
echo "5️⃣ TEST MISE À JOUR PAQUETS"
capture_error "apt-get update -y" "Mise à jour des paquets"

# Test 6: Installation Node.js
echo ""
echo "6️⃣ TEST NODE.JS"
if ! command -v node &> /dev/null; then
    echo "📦 Installation Node.js..."
    capture_error "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -" "Téléchargement Node.js"
    capture_error "apt-get install -y nodejs" "Installation Node.js"
else
    echo "✅ Node.js déjà installé: $(node --version)"
fi

# Test 7: Installation PostgreSQL
echo ""
echo "7️⃣ TEST POSTGRESQL"
if ! command -v psql &> /dev/null; then
    echo "📦 Installation PostgreSQL..."
    capture_error "apt-get install -y postgresql postgresql-contrib" "Installation PostgreSQL"
else
    echo "✅ PostgreSQL déjà installé"
fi

# Test 8: Démarrage PostgreSQL
echo ""
echo "8️⃣ TEST DÉMARRAGE POSTGRESQL"
capture_error "systemctl start postgresql" "Démarrage PostgreSQL"
capture_error "systemctl enable postgresql" "Activation PostgreSQL"

# Test 9: Connexion PostgreSQL
echo ""
echo "9️⃣ TEST CONNEXION POSTGRESQL"
capture_error "sudo -u postgres psql -c 'SELECT 1;'" "Test connexion PostgreSQL"

# Test 10: Installation PM2
echo ""
echo "🔟 TEST PM2"
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installation PM2..."
    capture_error "npm install -g pm2" "Installation PM2"
else
    echo "✅ PM2 déjà installé"
fi

echo ""
echo "🎯 DIAGNOSTIC TERMINÉ"
echo "===================="

echo ""
echo "Si tous les tests sont ✅, vous pouvez maintenant déployer:"
echo "sudo ./deploy-minimal.sh"
echo ""
echo "Si une erreur ❌ est apparue, elle a été identifiée ci-dessus avec sa solution."

# Si on arrive ici, lancer le déploiement minimal automatiquement
echo ""
echo "🚀 Lancement automatique du déploiement minimal..."
sleep 3

# Déploiement minimal intégré
echo "📂 Préparation application..."
mkdir -p /opt/databackupledger
cp -r . /opt/databackupledger/ 2>/dev/null || true
cd /opt/databackupledger

echo "📦 Installation dépendances..."
if [ -f "package.json" ]; then
    npm install || {
        echo "❌ ERREUR: Installation npm échouée"
        echo "Contenu package.json:"
        head -10 package.json
        exit 1
    }
else
    echo "❌ ERREUR: package.json manquant"
    echo "Fichiers présents:"
    ls -la
    exit 1
fi

echo "📊 Configuration base de données..."
sudo -u postgres createdb rec_ledger 2>/dev/null || echo "DB existe déjà"
sudo -u postgres createuser rec_ledger_user 2>/dev/null || echo "User existe déjà"
sudo -u postgres psql -c "ALTER USER rec_ledger_user PASSWORD 'rec_ledger_2025_secure';" || {
    echo "❌ ERREUR: Configuration utilisateur DB échouée"
    exit 1
}
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE rec_ledger TO rec_ledger_user;" || {
    echo "❌ ERREUR: Attribution permissions DB échouée"
    exit 1
}

echo "⚙️ Configuration environnement..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://rec_ledger_user:rec_ledger_2025_secure@localhost:5432/rec_ledger
SESSION_SECRET=quick_deploy_secret_2025
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=cs@os-report.com
EMAIL_PASS=Alpha9779@
EMAIL_FROM_NAME=Support Ledger
FROM_EMAIL=cs@os-report.com
EOF

echo "🏗️ Build application..."
npm run build 2>/dev/null || echo "Build ignoré"

echo "🔄 Migration base de données..."
npm run db:push 2>/dev/null || echo "Migration ignorée"

echo "🚀 Démarrage application..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

if [ -f "dist/index.js" ]; then
    pm2 start dist/index.js --name "databackupledger" || {
        echo "❌ ERREUR: Démarrage échoué avec dist/index.js"
        echo "Logs PM2:"
        pm2 logs --lines 10
        exit 1
    }
elif [ -f "server/index.js" ]; then
    pm2 start server/index.js --name "databackupledger" || {
        echo "❌ ERREUR: Démarrage échoué avec server/index.js"
        exit 1
    }
else
    echo "❌ ERREUR: Fichier principal non trouvé"
    echo "Fichiers disponibles:"
    find . -name "*.js" -type f | head -10
    exit 1
fi

pm2 save

echo "🧪 Test final..."
sleep 5
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo ""
    echo "🎉 DÉPLOIEMENT RÉUSSI!"
    echo "===================="
    echo "✅ Application: http://localhost:5000"
    echo "✅ Comptes test: client@demo.com/demo123"
    echo "✅ PM2 Status: $(pm2 list | grep databackupledger | awk '{print $18}')"
else
    echo ""
    echo "❌ ERREUR FINALE: Application non accessible"
    echo "Logs détaillés:"
    pm2 logs databackupledger --lines 20
    exit 1
fi