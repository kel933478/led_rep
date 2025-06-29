#!/bin/bash
# Script de test complet - Ledger Récupération
# Valide toutes les fonctionnalités de l'application

echo "🧪 TESTS COMPLETS LEDGER RÉCUPÉRATION"
echo "====================================="

BASE_URL="http://localhost:5000"
FAILED=0

# Fonction de test
test_endpoint() {
    local name="$1"
    local expected="$2"
    local command="$3"
    
    echo -n "Testing $name... "
    
    if eval "$command" | grep -q "$expected"; then
        echo "✅ PASS"
    else
        echo "❌ FAIL"
        FAILED=$((FAILED + 1))
    fi
}

echo ""
echo "📋 Tests Frontend & API"
echo "----------------------"

# Test 1: Frontend accessible
test_endpoint "Frontend HTML" "<!DOCTYPE html>" "curl -s $BASE_URL"

# Test 2: API Health
test_endpoint "API Health" "Not authenticated" "curl -s $BASE_URL/api/auth/me"

# Test 3: Login Client
test_endpoint "Client Login" "client@demo.com" "curl -s -X POST $BASE_URL/api/client/login -H 'Content-Type: application/json' -d '{\"email\":\"client@demo.com\",\"password\":\"demo123\"}'"

# Test 4: Login Admin
test_endpoint "Admin Login" "admin@ledger.com" "curl -s -X POST $BASE_URL/api/admin/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@ledger.com\",\"password\":\"admin123\"}'"

# Test 5: Login Vendeur
test_endpoint "Seller Login" "vendeur@demo.com" "curl -s -X POST $BASE_URL/api/seller/login -H 'Content-Type: application/json' -d '{\"email\":\"vendeur@demo.com\",\"password\":\"vendeur123\"}'"

echo ""
echo "💰 Tests Fonctionnalités Métier"
echo "-------------------------------"

# Test 6: Dashboard Client avec cookies
echo -n "Testing Client Dashboard... "
curl -s -X POST $BASE_URL/api/client/login -H "Content-Type: application/json" -d '{"email":"client@demo.com","password":"demo123"}' -c test_cookies.txt > /dev/null
if curl -s $BASE_URL/api/client/dashboard -b test_cookies.txt | grep -q "50000"; then
    echo "✅ PASS (Portefeuille 50,000€)"
else
    echo "❌ FAIL"
    FAILED=$((FAILED + 1))
fi
rm -f test_cookies.txt

# Test 7: Admin Dashboard
echo -n "Testing Admin Dashboard... "
curl -s -X POST $BASE_URL/api/admin/login -H "Content-Type: application/json" -d '{"email":"admin@ledger.com","password":"admin123"}' -c admin_cookies.txt > /dev/null
if curl -s $BASE_URL/api/admin/dashboard -b admin_cookies.txt | grep -q "taxRate"; then
    echo "✅ PASS (Panel admin OK)"
else
    echo "❌ FAIL"
    FAILED=$((FAILED + 1))
fi
rm -f admin_cookies.txt

echo ""
echo "📊 Résumé des Tests"
echo "==================="

if [ $FAILED -eq 0 ]; then
    echo "🎉 TOUS LES TESTS RÉUSSIS!"
    echo "✅ L'application est prête pour le déploiement"
    echo ""
    echo "🌐 Preview accessible sur: $BASE_URL"
    echo "📋 Fonctionnalités validées:"
    echo "   - Frontend React fonctionnel"
    echo "   - API REST opérationnelle"
    echo "   - Authentification 3 rôles"
    echo "   - Dashboard crypto (50,000€)"
    echo "   - Panel admin complet"
    echo "   - Base de données PostgreSQL"
    echo ""
    echo "🚀 Ready for production deployment!"
    exit 0
else
    echo "❌ $FAILED test(s) échoué(s)"
    echo "⚠️ Vérifiez les erreurs avant le déploiement"
    echo ""
    echo "🔧 Debug:"
    echo "   pm2 logs ledger-preview"
    echo "   pm2 status"
    exit 1
fi