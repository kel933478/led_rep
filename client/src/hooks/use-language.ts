import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage first
    const saved = localStorage.getItem('ledger-language') as Language;
    if (saved && (saved === 'fr' || saved === 'en')) {
      return saved;
    }
    
    // Auto-detect from browser
    return navigator.language.startsWith('fr') ? 'fr' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('ledger-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}