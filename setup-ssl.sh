#!/bin/bash

# Configuration SSL automatique pour rec-ledger.com
set -e

echo "Configuration SSL pour rec-ledger.com"

# Vérification des prérequis
if ! command -v nginx &> /dev/null; then
    echo "Installation Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

if ! command -v certbot &> /dev/null; then
    echo "Installation Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# Création des dossiers SSL
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /var/log/nginx

# Configuration Nginx de base
sudo cp nginx.conf /etc/nginx/sites-available/rec-ledger.com
sudo ln -sf /etc/nginx/sites-available/rec-ledger.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test de la configuration Nginx
sudo nginx -t

# Génération du certificat SSL avec Let's Encrypt
echo "Génération du certificat SSL..."
sudo certbot --nginx -d rec-ledger.com -d www.rec-ledger.com --non-interactive --agree-tos --email admin@rec-ledger.com

# Redémarrage des services
sudo systemctl reload nginx
sudo systemctl enable nginx

# Configuration du renouvellement automatique
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# Vérification SSL
echo "Vérification de la configuration SSL..."
if curl -I https://rec-ledger.com 2>/dev/null | grep -q "200 OK"; then
    echo "✅ SSL configuré avec succès"
else
    echo "⚠️ Vérifiez la configuration DNS pour rec-ledger.com"
fi

echo "Configuration SSL terminée"