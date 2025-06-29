#!/bin/bash
# Script de diagnostic des problèmes de déploiement
# Aide à identifier pourquoi le déploiement ne fonctionne pas

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 DIAGNOSTIC PROBLÈMES DE DÉPLOIEMENT${NC}"
echo "========================================"

# Fonction de test
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 installé${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 manquant${NC}"
        return 1
    fi
}

check_service() {
    if systemctl is-active --quiet $1; then
        echo -e "${GREEN}✅ $1 actif${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 inactif${NC}"
        return 1
    fi
}

echo ""
echo -e "${YELLOW}📋 Vérification Système${NC}"
echo "----------------------"

# Vérification OS
echo -n "OS: "
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "${BLUE}$NAME $VERSION${NC}"
else
    echo -e "${RED}OS non identifié${NC}"
fi

# Vérification utilisateur
echo -n "Utilisateur: "
if [[ $EUID -eq 0 ]]; then
    echo -e "${GREEN}root ✅${NC}"
else
    echo -e "${YELLOW}$(whoami) (sudo requis)${NC}"
fi

# Vérification espace disque
echo -n "Espace disque: "
available=$(df / | awk 'NR==2{print $4}')
if [ $available -gt 5000000 ]; then
    echo -e "${GREEN}$(df -h / | awk 'NR==2{print $4}') libre ✅${NC}"
else
    echo -e "${RED}$(df -h / | awk 'NR==2{print $4}') libre ❌${NC}"
fi

# Vérification RAM
echo -n "RAM: "
ram_total=$(free -h | awk 'NR==2{print $2}')
ram_available=$(free -h | awk 'NR==2{print $7}')
echo -e "${BLUE}$ram_total total, $ram_available disponible${NC}"

echo ""
echo -e "${YELLOW}🔧 Vérification Outils${NC}"
echo "---------------------"

# Vérification commandes essentielles
check_command "curl"
check_command "wget"
check_command "git"
check_command "unzip"

# Vérification gestionnaire de paquets
if check_command "apt-get"; then
    echo -e "${GREEN}✅ Gestionnaire de paquets: apt${NC}"
elif check_command "yum"; then
    echo -e "${GREEN}✅ Gestionnaire de paquets: yum${NC}"
else
    echo -e "${RED}❌ Gestionnaire de paquets non supporté${NC}"
fi

echo ""
echo -e "${YELLOW}📦 Vérification Node.js${NC}"
echo "----------------------"

if check_command "node"; then
    node_version=$(node --version)
    echo -e "${BLUE}Version Node.js: $node_version${NC}"
    
    # Vérification version Node.js
    major_version=$(echo $node_version | cut -d'.' -f1 | sed 's/v//')
    if [ $major_version -ge 16 ]; then
        echo -e "${GREEN}✅ Version Node.js compatible${NC}"
    else
        echo -e "${RED}❌ Version Node.js trop ancienne (requis: ≥16)${NC}"
    fi
else
    echo -e "${RED}❌ Node.js non installé${NC}"
fi

if check_command "npm"; then
    npm_version=$(npm --version)
    echo -e "${BLUE}Version npm: $npm_version${NC}"
fi

echo ""
echo -e "${YELLOW}🗄️ Vérification Base de Données${NC}"
echo "-----------------------------"

if check_command "psql"; then
    pg_version=$(psql --version 2>/dev/null | head -1)
    echo -e "${BLUE}$pg_version${NC}"
    
    # Test connexion PostgreSQL
    if sudo -u postgres psql -c "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL connexion OK${NC}"
    else
        echo -e "${RED}❌ PostgreSQL connexion échouée${NC}"
    fi
else
    echo -e "${RED}❌ PostgreSQL non installé${NC}"
fi

echo ""
echo -e "${YELLOW}🌐 Vérification Réseau${NC}"
echo "--------------------"

# Test connectivité internet
echo -n "Connectivité Internet: "
if curl -s --max-time 5 google.com > /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Problème de connectivité${NC}"
fi

# Test DNS
echo -n "Résolution DNS: "
if nslookup google.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Problème DNS${NC}"
fi

# Test ports
echo -n "Ports disponibles: "
if netstat -tuln | grep -q ":80\|:443\|:22"; then
    ports=$(netstat -tuln | grep ":80\|:443\|:22" | awk '{print $4}' | cut -d':' -f2 | sort -u | tr '\n' ',' | sed 's/,$//')
    echo -e "${YELLOW}Occupés: $ports${NC}"
else
    echo -e "${GREEN}✅ 80, 443, 22 libres${NC}"
fi

echo ""
echo -e "${YELLOW}🔒 Vérification Permissions${NC}"
echo "-------------------------"

# Vérification sudo
echo -n "Sudo disponible: "
if sudo -l &>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Sudo non configuré${NC}"
fi

# Vérification écriture
echo -n "Écriture /opt: "
if [ -w /opt ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Pas de permission d'écriture${NC}"
fi

echo ""
echo -e "${YELLOW}📁 Vérification Fichiers${NC}"
echo "-----------------------"

# Vérification scripts
if [ -f "deploy-auto.sh" ]; then
    echo -e "${GREEN}✅ deploy-auto.sh présent${NC}"
    if [ -x "deploy-auto.sh" ]; then
        echo -e "${GREEN}✅ deploy-auto.sh exécutable${NC}"
    else
        echo -e "${RED}❌ deploy-auto.sh non exécutable${NC}"
        echo -e "${YELLOW}Solution: chmod +x deploy-auto.sh${NC}"
    fi
else
    echo -e "${RED}❌ deploy-auto.sh manquant${NC}"
fi

# Vérification configuration
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ .env.production présent${NC}"
else
    echo -e "${RED}❌ .env.production manquant${NC}"
fi

echo ""
echo -e "${YELLOW}🚨 Problèmes Identifiés et Solutions${NC}"
echo "===================================="

problems_found=false

# Solutions pour Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}PROBLÈME: Node.js manquant${NC}"
    echo -e "${BLUE}SOLUTION:${NC}"
    echo "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -"
    echo "sudo apt-get install -y nodejs"
    problems_found=true
fi

# Solutions pour PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PROBLÈME: PostgreSQL manquant${NC}"
    echo -e "${BLUE}SOLUTION:${NC}"
    echo "sudo apt-get update"
    echo "sudo apt-get install -y postgresql postgresql-contrib"
    problems_found=true
fi

# Solutions pour permissions
if [[ $EUID -ne 0 ]] && ! sudo -l &>/dev/null; then
    echo -e "${RED}PROBLÈME: Permissions insuffisantes${NC}"
    echo -e "${BLUE}SOLUTION:${NC}"
    echo "Exécutez avec sudo: sudo ./deploy-auto.sh"
    problems_found=true
fi

# Solutions pour connectivité
if ! curl -s --max-time 5 google.com > /dev/null; then
    echo -e "${RED}PROBLÈME: Pas de connectivité Internet${NC}"
    echo -e "${BLUE}SOLUTION:${NC}"
    echo "Vérifiez votre connexion réseau et proxy"
    problems_found=true
fi

if ! $problems_found; then
    echo -e "${GREEN}✅ Aucun problème majeur détecté${NC}"
    echo ""
    echo -e "${BLUE}🚀 Prêt pour le déploiement !${NC}"
    echo "Commande: sudo ./deploy-auto.sh"
else
    echo ""
    echo -e "${YELLOW}⚠️ Résolvez les problèmes ci-dessus avant de continuer${NC}"
fi

echo ""
echo -e "${BLUE}📞 Support Additionnel${NC}"
echo "-------------------"
echo "Si les problèmes persistent:"
echo "1. Vérifiez les logs: journalctl -xe"
echo "2. Testez chaque étape manuellement"
echo "3. Utilisez le mode verbose: bash -x deploy-auto.sh"

echo ""
echo -e "${GREEN}Diagnostic terminé.${NC}"