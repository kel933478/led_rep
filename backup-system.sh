#!/bin/bash

# Système de sauvegarde automatique pour rec-ledger.com
set -e

BACKUP_DIR="/opt/backups/rec-ledger"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="rec_ledger"
DB_USER="rec_ledger_user"
APP_DIR="/opt/rec-ledger"

# Création du répertoire de sauvegarde
mkdir -p $BACKUP_DIR

echo "Démarrage sauvegarde $DATE"

# Sauvegarde base de données
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Sauvegarde fichiers application critiques
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
  -C $APP_DIR \
  uploads/ \
  logs/ \
  .env \
  ecosystem.config.js

# Sauvegarde configuration SSL
tar -czf $BACKUP_DIR/ssl_backup_$DATE.tar.gz \
  -C /etc/ssl \
  certs/rec-ledger.com.crt \
  private/rec-ledger.com.key 2>/dev/null || true

# Nettoyage des anciennes sauvegardes (garde 30 jours)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Sauvegarde terminée: $BACKUP_DIR/backup_$DATE"

# Vérification de l'intégrité
if [ -f "$BACKUP_DIR/db_backup_$DATE.sql" ]; then
  echo "✅ Sauvegarde base de données OK"
else
  echo "❌ Échec sauvegarde base de données"
  exit 1
fi