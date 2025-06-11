# Dockerfile pour rec-ledger.com
FROM node:20-alpine AS base

# Installation des dépendances système
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./

# Installation des dépendances
RUN npm ci --only=production

# Étape de build
FROM base AS builder
WORKDIR /app

# Installation de toutes les dépendances pour le build
RUN npm ci

# Copie du code source
COPY . .

# Build de l'application
RUN npm run build

# Image de production
FROM node:20-alpine AS runner
WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=5000
ENV DOMAIN=rec-ledger.com

# Création utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ledger

# Création des dossiers nécessaires
RUN mkdir -p logs ssl uploads
RUN chown -R ledger:nodejs /app

# Copie des fichiers de production
COPY --from=builder --chown=ledger:nodejs /app/dist ./dist
COPY --from=builder --chown=ledger:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ledger:nodejs /app/package.json ./package.json

# Basculer vers l'utilisateur non-root
USER ledger

# Exposition du port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/auth/me', (res) => process.exit(res.statusCode === 401 ? 0 : 1))"

# Commande de démarrage
CMD ["node", "dist/index.js"]