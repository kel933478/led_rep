# CONFIGURATION DÉPLOIEMENT - rec-ledger.com

## CONFIGURATION DE PRODUCTION

### Variables d'Environnement Requises
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<your_postgresql_url>
SESSION_SECRET=<strong_session_secret>
DOMAIN=rec-ledger.com
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/rec-ledger.com.crt
SSL_KEY_PATH=/etc/ssl/private/rec-ledger.com.key
```

### Configuration SSL/TLS
- Certificat SSL strong recommandé : Let's Encrypt ou certificat commercial
- Support TLS 1.2 et TLS 1.3
- HSTS (HTTP Strict Transport Security) activé
- Redirection HTTP vers HTTPS forcée

### Sécurité de Production
- Sessions sécurisées avec cookie secure
- Protection CSRF activée
- Headers de sécurité configurés
- Rate limiting implémenté
- Logs d'audit complets

## VÉRIFICATIONS PRÉ-DÉPLOIEMENT

### Application
✓ Build de production testé
✓ Base de données PostgreSQL configurée
✓ Système de sessions sécurisé
✓ APIs toutes fonctionnelles
✓ Authentification multi-rôles validée
✓ Système de taxes opérationnel

### Performance
✓ Assets optimisés et minifiés
✓ Cache côté client configuré
✓ Compression gzip activée
✓ Images optimisées
✓ Bundle JavaScript optimisé

### Sécurité
✓ Variables sensibles externalisées
✓ Mots de passe hashés (bcrypt)
✓ Protection XSS/CSRF
✓ Validation des entrées utilisateur
✓ Journalisation des activités

## DOMAINE ET DNS

### Configuration DNS pour rec-ledger.com
```
A     rec-ledger.com      → <IP_SERVER>
CNAME www.rec-ledger.com  → rec-ledger.com
```

### Certificat SSL
Recommandation : Let's Encrypt avec renouvellement automatique
```bash
certbot --nginx -d rec-ledger.com -d www.rec-ledger.com
```

## STRUCTURE DE DÉPLOIEMENT

### Serveur de Production
- Node.js 20+ LTS
- PostgreSQL 14+
- Nginx (reverse proxy)
- PM2 (process manager)
- SSL/TLS configuré

### Configuration Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name rec-ledger.com www.rec-ledger.com;
    
    ssl_certificate /etc/ssl/certs/rec-ledger.com.crt;
    ssl_certificate_key /etc/ssl/private/rec-ledger.com.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## MONITORING ET MAINTENANCE

### Logs de Production
- Application logs centralisés
- Erreurs trackées et alertes
- Performance monitoring
- Uptime monitoring

### Backups
- Base de données : backup quotidien
- Files uploads : sauvegarde régulière
- Configuration : versioning Git

### Mises à Jour
- Déploiement sans interruption
- Tests automatisés avant mise en production
- Rollback procedure définie