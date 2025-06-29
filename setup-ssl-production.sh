#!/bin/bash
# Script de déploiement SSL pour rec-ledger.com

set -e

DOMAIN="rec-ledger.com"
EMAIL="admin@rec-ledger.com"

echo "🔒 CONFIGURATION SSL POUR $DOMAIN"
echo "=================================="

# Installation Certbot
echo "📦 Installation Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Installation Nginx
echo "🌐 Installation Nginx..."
sudo apt install -y nginx

# Configuration Nginx pour rec-ledger.com
echo "⚙️ Configuration Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Activation du site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration Nginx
echo "🧪 Test configuration Nginx..."
sudo nginx -t

# Redémarrage Nginx
echo "🔄 Redémarrage Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Génération certificat SSL avec Certbot
echo "🔐 Génération certificat SSL..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect

# Configuration renouvellement automatique
echo "🔄 Configuration renouvellement automatique..."
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# Ouverture des ports firewall
echo "🔥 Configuration firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable

echo ""
echo "✅ CONFIGURATION SSL TERMINÉE!"
echo "=============================="
echo ""
echo "🎯 Votre site est maintenant accessible sur:"
echo "- https://$DOMAIN"  
echo "- https://www.$DOMAIN"
echo ""
echo "🔒 Certificat SSL configuré et auto-renouvelable"
echo "🌐 Nginx configuré avec optimisations de sécurité"
echo "🔥 Firewall configuré"
echo ""
echo "📊 Test final..."
if curl -f -k https://$DOMAIN/api/auth/me >/dev/null 2>&1; then
    echo "✅ Site accessible en HTTPS!"
else
    echo "⚠️ Vérifiez la configuration DNS pour $DOMAIN"
fi