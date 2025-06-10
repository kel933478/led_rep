# Liste des Accès et Pages - Ledger Récupération

## 🔐 Pages d'Authentification

### Page d'Accueil / Accès Principal
- **URL**: `/access` (page par défaut)
- **Fichier**: `client/src/pages/ledger-access.tsx`
- **Description**: Page d'accueil principale avec sélection des espaces
- **Accès**: Public (pas d'authentification requise)

### Connexions par Rôle
- **Client**: `/client` - `client/src/pages/client-login.tsx`
- **Administrateur**: `/admin` - `client/src/pages/admin-login.tsx`
- **Vendeur**: `/seller` - `client/src/pages/seller-login.tsx`

## 👤 ESPACE CLIENT

### Authentification et Configuration
- **Connexion**: `/client`
  - Email: `client@demo.com`
  - Mot de passe: `demo123`

### Pages Accessibles (Client Authentifié)
- **Onboarding**: `/client/onboarding`
  - Première configuration du compte
  - Vérification KYC
  - Configuration du portefeuille

- **Tableau de Bord**: `/client/dashboard`
  - Vue d'ensemble du portefeuille (55 000€)
  - Balances crypto (BTC: 0.25, ETH: 2.75, USDT: 5000)
  - Statut des taxes
  - Informations de récupération

- **Paiement de Taxes**: `/client/tax-payment`
  - Affichage du montant dû: 8 250€ (15% sur 55 000€)
  - Adresse wallet BTC: `bc1qnew123456789abcdef123456789abcdef123456`
  - Génération QR code
  - Confirmation de paiement

- **Paramètres**: `/client/settings`
  - Configuration du compte
  - Préférences de sécurité
  - Gestion du profil

## 🛡️ ESPACE ADMINISTRATEUR

### Authentification
- **Connexion**: `/admin`
  - Email: `admin@ledger.com`
  - Mot de passe: `admin123`

### Pages Accessibles (Admin Authentifié)
- **Tableau de Bord Admin**: `/admin/dashboard`
  - Gestion des clients
  - Configuration des taxes (actuellement 15%)
  - Vue d'ensemble système
  - Statistiques globales
  - Gestion des portefeuilles

### Fonctionnalités Admin
- Configuration automatique des taxes pour tous les clients
- Définition des taux de taxation
- Gestion des adresses de wallet
- Supervision des paiements
- Accès aux données de tous les clients

## 🏪 ESPACE VENDEUR

### Authentification
- **Connexion**: `/seller`
  - Email: `vendeur@demo.com`
  - Mot de passe: `vendeur123`

### Pages Accessibles (Vendeur Authentifié)
- **Tableau de Bord Vendeur**: `/seller/dashboard`
  - Interface de vente
  - Gestion des transactions
  - Commissions et revenus
  - Historique des ventes

## 🔧 PAGES UTILITAIRES

### Pages Publiques (Sans Authentification)
- **Gestionnaire Ledger**: `/ledger`
  - Interface de simulation Ledger Live
  - Accès aux fonctionnalités de base

- **Centre de Récupération**: `/recovery`
  - Processus de récupération de portefeuille
  - Assistance technique

- **Aide**: `/help`
  - Documentation utilisateur
  - FAQ
  - Support technique

- **Académie**: `/academy`
  - Ressources éducatives
  - Guides crypto
  - Formation utilisateur

- **Page Non Trouvée**: `/*` (toute URL non définie)
  - Page d'erreur 404
  - Redirection vers l'accueil

## 🌐 SYSTÈME MULTILINGUE

### Langues Supportées
- **Français** (par défaut)
- **Anglais**
- Changement de langue disponible sur toutes les pages

## 🔄 FLUX D'AUTHENTIFICATION

### Redirection Automatique
1. **URL racine** (`/`) → Redirige vers `/access`
2. **Client non authentifié** → Redirige vers `/client`
3. **Client sans onboarding** → Redirige vers `/client/onboarding`
4. **Client authentifié** → Redirige vers `/client/dashboard`
5. **Admin authentifié** → Redirige vers `/admin/dashboard`
6. **Vendeur authentifié** → Redirige vers `/seller/dashboard`

## 💰 SYSTÈME DE TAXES

### Configuration Actuelle
- **Taux**: 15% (configuré par l'admin)
- **Montant calculé**: 8 250€ sur portefeuille de 55 000€
- **Devise**: BTC
- **Wallet**: `bc1qnew123456789abcdef123456789abcdef123456`
- **Statut**: Non payé

### Propagation Automatique
- L'admin configure une taxe globale
- Tous les clients voient automatiquement leur taxe calculée
- Les informations de wallet sont partagées à tous les clients

## 🔒 SÉCURITÉ ET SESSIONS

### Gestion des Sessions
- Sessions persistantes avec cookies
- Déconnexion automatique après inactivité
- Authentification requise pour les espaces privés

### Contrôle d'Accès
- **Pages publiques**: Accessibles à tous
- **Espaces client**: Authentification client requise
- **Espace admin**: Authentification admin requise
- **Espace vendeur**: Authentification vendeur requise

## 🚀 DÉPLOIEMENT ET ACCÈS

### URL de Développement
- **Local**: `http://localhost:5000`
- **Port**: 5000 (Express + Vite)

### Points d'Entrée Principaux
1. **Accueil**: `http://localhost:5000/access`
2. **Client**: `http://localhost:5000/client`
3. **Admin**: `http://localhost:5000/admin`
4. **Vendeur**: `http://localhost:5000/seller`

---

*Cette liste reflète l'état actuel de l'application avec toutes les fonctionnalités implémentées et testées.*