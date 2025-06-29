#!/bin/bash
# Script de validation complète post-déploiement
# databackupledger.com

DOMAIN="databackupledger.com"
FAILED=0

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 VALIDATION DÉPLOIEMENT - $DOMAIN${NC}"
echo "============================================="

# Fonction de test
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -n "Testing $name... "
    
    response=$(curl -s --max-time 10 "$url" 2>/dev/null)
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
    
    if [[ $status_code == "200" ]] && [[ $response == *"$expected"* ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL (Status: $status_code)${NC}"
        FAILED=$((FAILED + 1))
    fi
}

echo ""
echo -e "${YELLOW}📋 Tests de Connectivité${NC}"
echo "------------------------"

# Test 1: Site principal HTTPS
test_endpoint "Site HTTPS" "https://$DOMAIN" "<!DOCTYPE html>"

# Test 2: Redirection WWW
test_endpoint "Redirection WWW" "https://www.$DOMAIN" "<!DOCTYPE html>"

# Test 3: API Health
test_endpoint "API Health" "https://$DOMAIN/api/auth/me" "Not authenticated"

# Test 4: Health Check
test_endpoint "Health Check" "https://$DOMAIN/health" "ok"

echo ""
echo -e "${YELLOW}🔐 Tests d'Authentification${NC}"
echo "-----------------------------"

# Test 5: Login Client
echo -n "Testing Client Login... "
login_response=$(curl -s --max-time 10 -X POST "https://$DOMAIN/api/client/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@demo.com","password":"demo123"}' 2>/dev/null)

if echo "$login_response" | grep -q "client@demo.com"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

# Test 6: Login Admin
echo -n "Testing Admin Login... "
admin_response=$(curl -s --max-time 10 -X POST "https://$DOMAIN/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ledger.com","password":"admin123"}' 2>/dev/null)

if echo "$admin_response" | grep -q "admin@ledger.com"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

# Test 7: Login Vendeur
echo -n "Testing Seller Login... "
seller_response=$(curl -s --max-time 10 -X POST "https://$DOMAIN/api/seller/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"vendeur@demo.com","password":"vendeur123"}' 2>/dev/null)

if echo "$seller_response" | grep -q "vendeur@demo.com"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo -e "${YELLOW}🔒 Tests de Sécurité${NC}"
echo "-------------------"

# Test 8: SSL Certificate
echo -n "Testing SSL Certificate... "
ssl_result=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -subject 2>/dev/null)
if echo "$ssl_result" | grep -q "$DOMAIN"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

# Test 9: Security Headers
echo -n "Testing Security Headers... "
headers=$(curl -s -I "https://$DOMAIN" 2>/dev/null)
if echo "$headers" | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
fi

# Test 10: HTTP to HTTPS Redirect
echo -n "Testing HTTP Redirect... "
redirect_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" 2>/dev/null)
if [[ $redirect_code == "301" ]]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL (Status: $redirect_code)${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo -e "${YELLOW}⚡ Tests de Performance${NC}"
echo "----------------------"

# Test 11: Response Time
echo -n "Testing Response Time... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "https://$DOMAIN" 2>/dev/null)
if (( $(echo "$response_time < 3.0" | bc -l) )); then
    echo -e "${GREEN}✅ PASS (${response_time}s)${NC}"
else
    echo -e "${YELLOW}⚠️ SLOW (${response_time}s)${NC}"
fi

# Test 12: Compression
echo -n "Testing Gzip Compression... "
compression=$(curl -s -H "Accept-Encoding: gzip" -I "https://$DOMAIN" 2>/dev/null)
if echo "$compression" | grep -q "Content-Encoding: gzip"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️ NOT ENABLED${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Informations Système${NC}"
echo "----------------------"

# Informations SSL
echo -n "SSL Issuer: "
ssl_issuer=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null | cut -d'=' -f2-)
echo -e "${BLUE}$ssl_issuer${NC}"

# Expiration SSL
echo -n "SSL Expires: "
ssl_expiry=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d'=' -f2)
echo -e "${BLUE}$ssl_expiry${NC}"

# Server Header
echo -n "Server: "
server_header=$(curl -s -I "https://$DOMAIN" 2>/dev/null | grep -i "server:" | cut -d' ' -f2-)
echo -e "${BLUE}$server_header${NC}"

echo ""
echo -e "${YELLOW}🎯 URLs de Production${NC}"
echo "-------------------"
echo -e "${BLUE}🌐 Site Principal:${NC} https://$DOMAIN"
echo -e "${BLUE}🌐 Avec WWW:${NC} https://www.$DOMAIN"
echo -e "${BLUE}🔗 API:${NC} https://$DOMAIN/api/"
echo -e "${BLUE}❤️ Health:${NC} https://$DOMAIN/health"

echo ""
echo -e "${YELLOW}👤 Comptes de Test${NC}"
echo "----------------"
echo -e "${BLUE}Client:${NC} client@demo.com / demo123"
echo -e "${BLUE}Admin:${NC} admin@ledger.com / admin123"
echo -e "${BLUE}Vendeur:${NC} vendeur@demo.com / vendeur123"

echo ""
echo -e "${YELLOW}📋 Résumé des Tests${NC}"
echo "==================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES TESTS RÉUSSIS!${NC}"
    echo -e "${GREEN}✅ L'application est prête pour la production${NC}"
    echo ""
    echo -e "${BLUE}🚀 databackupledger.com est OPÉRATIONNEL!${NC}"
    echo ""
    echo -e "${GREEN}Recommandations supplémentaires:${NC}"
    echo "1. Testez SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    echo "2. Testez PageSpeed: https://pagespeed.web.dev/"
    echo "3. Configurez monitoring uptime"
    echo "4. Testez sauvegarde automatique"
    exit 0
else
    echo -e "${RED}❌ $FAILED test(s) échoué(s)${NC}"
    echo -e "${YELLOW}⚠️ Vérifiez la configuration avant la mise en production${NC}"
    echo ""
    echo -e "${YELLOW}Dépannage recommandé:${NC}"
    echo "1. Vérifier DNS: nslookup $DOMAIN"
    echo "2. Vérifier services: sudo systemctl status nginx"
    echo "3. Vérifier logs: sudo -u databackupledger pm2 logs"
    echo "4. Vérifier SSL: sudo certbot certificates"
    exit 1
fi