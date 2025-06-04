export const translations = {
  fr: {
    // Common
    email: "Email",
    password: "Mot de passe",
    login: "Se connecter",
    logout: "Se déconnecter",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    cancel: "Annuler",
    save: "Enregistrer",
    update: "Mettre à jour",
    delete: "Supprimer",
    edit: "Modifier",
    view: "Voir",
    actions: "Actions",
    
    // Header
    appTitle: "Ledger Recovery",
    clientSpace: "Espace Client",
    adminSpace: "Espace Admin",
    
    // Login
    welcomeTitle: "Bienvenue sur Ledger Recovery",
    welcomeSubtitle: "Accédez à votre espace sécurisé",
    demoCredentials: "Identifiants de démonstration :",
    invalidCredentials: "Identifiants incorrects",
    loginSuccess: "Connexion réussie",
    
    // Onboarding
    onboardingTitle: "Configuration initiale",
    onboardingSubtitle: "Complétez votre profil pour accéder à vos actifs",
    kycTitle: "Document d'identité",
    uploadDocument: "Télécharger votre passeport",
    fileRequirements: "JPG, PNG, PDF - Max 5MB",
    amountTitle: "Montant souvenir",
    completeSetup: "Terminer la configuration",
    onboardingSuccess: "Configuration terminée avec succès",
    fileUploadError: "Erreur lors du téléchargement du fichier",
    fileTooLarge: "Fichier trop volumineux (max 5MB)",
    
    // Dashboard
    dashboardTitle: "Tableau de bord",
    dashboardSubtitle: "Gérez vos actifs numériques en toute sécurité",
    taxInfo: "Informations fiscales",
    taxDescription: "Taxe appliquée sur vos transactions",
    taxRate: "Taux appliqué",
    successTitle: "Configuration terminée",
    successMessage: "Vos données ont bien été enregistrées et sont maintenant sécurisées.",
    
    // Admin
    adminDashboard: "Administration",
    adminSubtitle: "Gestion des clients et configuration système",
    exportCsv: "Export CSV",
    importCsv: "Import CSV",
    taxConfig: "Configuration fiscale",
    globalTax: "Taxe globale (%)",
    clientList: "Liste des clients",
    kycStatus: "KYC",
    onboarding: "Onboarding",
    amount: "Montant",
    lastConnection: "Dernière connexion",
    downloadKyc: "Télécharger KYC",
    addNote: "Ajouter une note",
    notes: "Notes",
    
    // Status
    completed: "Terminé",
    pending: "En attente",
    inProgress: "En cours",
    validated: "Validé",
    never: "Jamais",
    
    // Crypto
    bitcoin: "Bitcoin",
    ethereum: "Ethereum",
    tether: "Tether",
    price: "Prix",
    balance: "Solde",
  },
  en: {
    // Common
    email: "Email",
    password: "Password",
    login: "Login",
    logout: "Logout",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    update: "Update",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    actions: "Actions",
    
    // Header
    appTitle: "Ledger Recovery",
    clientSpace: "Client Space",
    adminSpace: "Admin Space",
    
    // Login
    welcomeTitle: "Welcome to Ledger Recovery",
    welcomeSubtitle: "Access your secure space",
    demoCredentials: "Demo credentials:",
    invalidCredentials: "Invalid credentials",
    loginSuccess: "Login successful",
    
    // Onboarding
    onboardingTitle: "Initial Setup",
    onboardingSubtitle: "Complete your profile to access your assets",
    kycTitle: "Identity Document",
    uploadDocument: "Upload your passport",
    fileRequirements: "JPG, PNG, PDF - Max 5MB",
    amountTitle: "Memorable Amount",
    completeSetup: "Complete Setup",
    onboardingSuccess: "Setup completed successfully",
    fileUploadError: "File upload error",
    fileTooLarge: "File too large (max 5MB)",
    
    // Dashboard
    dashboardTitle: "Dashboard",
    dashboardSubtitle: "Manage your digital assets securely",
    taxInfo: "Tax Information",
    taxDescription: "Tax applied to your transactions",
    taxRate: "Applied Rate",
    successTitle: "Setup Complete",
    successMessage: "Your data has been successfully recorded and is now secure.",
    
    // Admin
    adminDashboard: "Administration",
    adminSubtitle: "Client management and system configuration",
    exportCsv: "Export CSV",
    importCsv: "Import CSV",
    taxConfig: "Tax Configuration",
    globalTax: "Global Tax (%)",
    clientList: "Client List",
    kycStatus: "KYC",
    onboarding: "Onboarding",
    amount: "Amount",
    lastConnection: "Last Connection",
    downloadKyc: "Download KYC",
    addNote: "Add Note",
    notes: "Notes",
    
    // Status
    completed: "Completed",
    pending: "Pending",
    inProgress: "In Progress",
    validated: "Validated",
    never: "Never",
    
    // Crypto
    bitcoin: "Bitcoin",
    ethereum: "Ethereum",
    tether: "Tether",
    price: "Price",
    balance: "Balance",
  },
};

export type TranslationKey = keyof typeof translations.fr;
export type Language = 'fr' | 'en';
