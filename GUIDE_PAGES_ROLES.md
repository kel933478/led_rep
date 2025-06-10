# GUIDE DES PAGES PAR RÔLE - LEDGER RÉCUPÉRATION

## 👤 ESPACE CLIENT

### **Accès Client**
- **URL de connexion** : `http://localhost:5000/client`
- **Identifiants** : 
  - Email : `client@demo.com`
  - Mot de passe : `demo123`

### **Pages Accessibles Client**

#### 1. **Dashboard Client** (`/client/dashboard`)
**Fonctionnalités disponibles :**
- 📊 **Portefeuille** : Valeur totale 55 000€
- 💰 **Balances Crypto** :
  - BTC : 0.25 (≈ 11 250€)
  - ETH : 2.75 (≈ 6 875€) 
  - USDT : 5 000 (≈ 5 000€)
- 🧾 **Informations Taxes** :
  - Taux : 15% (configuré par l'admin)
  - Montant dû : 8 250€
  - Statut : Non payé
  - Wallet BTC : Affiché pour paiement

#### 2. **Paiement de Taxes** (`/client/tax-payment`)
**Fonctionnalités disponibles :**
- 💳 **Détails de paiement** prédéfinis par l'admin
- 📱 **QR Code** généré automatiquement
- 🔗 **Adresse wallet BTC** pour transfert
- ✅ **Confirmation de paiement**
- 📄 **Reçu de transaction**

#### 3. **Configuration Initiale** (`/client/onboarding`)
**Fonctionnalités disponibles :**
- 📋 **Vérification KYC**
- 🔐 **Configuration sécurité**
- 📱 **Paramètres de compte**

#### 4. **Paramètres** (`/client/settings`)
**Fonctionnalités disponibles :**
- 👤 **Profil utilisateur**
- 🔒 **Sécurité du compte**
- 🌐 **Préférences langue**

---

## 🛡️ ESPACE ADMINISTRATEUR

### **Accès Admin**
- **URL de connexion** : `http://localhost:5000/admin`
- **Identifiants** :
  - Email : `admin@ledger.com`
  - Mot de passe : `admin123`

### **Page Admin Unique**

#### **Dashboard Administrateur** (`/admin/dashboard`)
**Fonctionnalités complètes :**

##### 🏛️ **Gestion Générale**
- 📊 **Vue d'ensemble système**
- 📈 **Statistiques globales**
- 🔧 **Configuration générale**

##### 👥 **Gestion des Clients**
- 📋 **Liste complète des clients**
- ✅ **Statuts KYC** (Approuvé/En attente/Rejeté)
- 💼 **Portefeuilles individuels**
- 🔍 **Détails comptes clients**

##### 💰 **Configuration Taxes**
- 🎯 **Définition taux global** (actuellement 15%)
- 🏦 **Configuration wallet BTC** de réception
- 💵 **Calcul automatique** pour tous les clients
- 📊 **Suivi des paiements**

##### 🔐 **Administration Sécurisée**
- 🛡️ **Gestion des accès**
- 📝 **Journaux d'audit**
- ⚙️ **Paramètres système**

##### 📨 **Actions Admin**
- ✉️ **Validation KYC clients**
- 🔄 **Propagation automatique** des configurations
- 📋 **Rapports détaillés**

---

## 🏪 ESPACE VENDEUR

### **Accès Vendeur**
- **URL de connexion** : `http://localhost:5000/seller`
- **Identifiants** :
  - Email : `vendeur@demo.com`
  - Mot de passe : `vendeur123`

### **Page Vendeur Unique**

#### **Dashboard Vendeur** (`/seller/dashboard`)
**Fonctionnalités commerciales :**

##### 🛒 **Interface de Vente**
- 📦 **Catalogue produits/services**
- 💳 **Processus de vente**
- 🎯 **Objectifs commerciaux**

##### 💼 **Gestion Transactions**
- 📊 **Historique des ventes**
- 💰 **Revenus générés**
- 🧾 **Factures et reçus**

##### 📈 **Performance Vendeur**
- 🎖️ **Commissions earned**
- 📊 **Statistiques personnelles**
- 🏆 **Objectifs atteints**

##### 👤 **Profil Vendeur**
- 📝 **Informations personnelles**
- 🔧 **Paramètres de vente**
- 📞 **Coordonnées clients**

---

## 🔄 FLUX DE NAVIGATION

### **Redirections Automatiques**
1. **URL racine** (`/`) → `/access` (page de sélection)
2. **Client authentifié** → `/client/dashboard`
3. **Admin authentifié** → `/admin/dashboard`
4. **Vendeur authentifié** → `/seller/dashboard`

### **Contrôles d'Accès**
- ❌ **Client** ne peut pas accéder aux pages admin/vendeur
- ❌ **Admin** accès limité à son espace de gestion
- ❌ **Vendeur** accès limité à son interface commerciale
- ✅ **Pages publiques** accessibles à tous sans authentification

### **Déconnexion**
- 🚪 **Bouton déconnexion** disponible sur toutes les pages authentifiées
- 🔄 **Redirection automatique** vers page de connexion appropriée
- 🧹 **Nettoyage session** et cache

---

## 🎯 CARACTÉRISTIQUES COMMUNES

### **Design Unifié**
- 🎨 **Interface Ledger Live** authentique
- 🌐 **Multilingue** (Français/Anglais)
- 📱 **Responsive** sur tous appareils
- 🌙 **Thème sombre** professionnel

### **Sécurité Intégrée**
- 🔐 **Sessions persistantes**
- 🛡️ **Protection CSRF**
- 🔒 **Authentification robuste**
- 📊 **Audit trail** complet

### **Performance**
- ⚡ **Chargement rapide**
- 🔄 **Mises à jour temps réel**
- 💾 **Cache optimisé**
- 🌐 **API RESTful** efficaces

---

## 🚀 ACCÈS RAPIDE

### **URLs Directes**
- **Client** : `http://localhost:5000/client`
- **Admin** : `http://localhost:5000/admin` 
- **Vendeur** : `http://localhost:5000/seller`
- **Accueil** : `http://localhost:5000/access`

### **Identifiants de Test**
```
CLIENT:
Email: client@demo.com
Password: demo123

ADMIN:
Email: admin@ledger.com  
Password: admin123

VENDEUR:
Email: vendeur@demo.com
Password: vendeur123
```

*Système entièrement opérationnel avec toutes les fonctionnalités testées et validées.*