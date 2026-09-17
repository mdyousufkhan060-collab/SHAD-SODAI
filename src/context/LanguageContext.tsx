import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TRANSLATIONS } from '../utils/translations';

type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
  changeLanguage: (lang: Language) => void;
  isLoading: boolean;
  enabledLanguages: { en: boolean; bn: boolean };
  showSwitcher: boolean;
}

const formatKeyFallback = (key: string): string => {
  if (!key) return '';
  const enTranslations = (TRANSLATIONS.en as Record<string, string>);
  if (enTranslations[key] && enTranslations[key] !== key) {
    return enTranslations[key];
  }
  const lower = key.toLowerCase();
  const matchedKey = Object.keys(enTranslations).find(k => k.toLowerCase() === lower);
  if (matchedKey && enTranslations[matchedKey]) {
    return enTranslations[matchedKey];
  }
  // Strip common internal key prefixes/suffixes
  let clean = key.replace(/Placeholder$/i, '').replace(/Btn$/i, '').replace(/Label$/i, '');
  clean = clean.replace(/([A-Z])/g, ' $1').replace(/[_-]+/g, ' ').trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : '';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('shadshodai_lang') || localStorage.getItem('shadghor_lang');
    return (saved === 'en' || saved === 'bn') ? saved : 'en';
  });

  const [translations, setTranslations] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('shadshodai_lang') || localStorage.getItem('shadghor_lang');
    const initialLang: Language = (saved === 'en' || saved === 'bn') ? saved : 'en';
    return (TRANSLATIONS[initialLang] || TRANSLATIONS.en) as Record<string, string>;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState({
    en_enabled: true,
    bn_enabled: false,
    show_switcher: false,
    default_lang: 'en' as Language
  });

  const fetchTranslations = async (lang: Language) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/languages/translations?lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        const staticDict = (TRANSLATIONS[lang] || TRANSLATIONS.en) as Record<string, string>;
        const cleanMerged: Record<string, string> = { ...staticDict };
        
        // Only allow DB override if it's not the raw key itself or empty
        if (data && typeof data === 'object') {
          Object.keys(data).forEach((k) => {
            const v = data[k];
            if (v && v.trim() && v !== k) {
              cleanMerged[k] = v;
            }
          });
        }
        setTranslations(cleanMerged);
      }
    } catch (err) {
      console.error('Failed to fetch translations:', err);
      setTranslations((TRANSLATIONS[lang] || TRANSLATIONS.en) as Record<string, string>);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings'); // Public settings
      if (res.ok) {
        const data = await res.json();
        const newConfig = {
          en_enabled: data.language_en_enabled === 'true',
          bn_enabled: data.language_bn_enabled === 'true',
          show_switcher: data.customer_language_switcher_enabled === 'true',
          default_lang: (data.default_language as Language) || 'bn'
        };
        setConfig(newConfig);

        // If current language is disabled, switch to default or enabled one
        const currentSaved = localStorage.getItem('shadshodai_lang') || localStorage.getItem('shadghor_lang');
        let activeLang: Language = (currentSaved === 'en' || currentSaved === 'bn') ? (currentSaved as Language) : newConfig.default_lang;

        if (activeLang === 'en' && !newConfig.en_enabled) activeLang = 'bn';
        if (activeLang === 'bn' && !newConfig.bn_enabled) activeLang = 'en';
        
        if (activeLang !== language) {
          setLanguage(activeLang);
          localStorage.setItem('shadshodai_lang', activeLang);
        }
      }
    } catch (err) {
      console.error('Failed to fetch language config:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchConfig();
    };
    init();
  }, []);

  useEffect(() => {
    fetchTranslations(language);
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('shadshodai_lang', lang);
    
    // Dispatch a custom event so other components can react instantly
    window.dispatchEvent(new Event('shadshodai_language_change'));
    window.dispatchEvent(new Event('shadghor_language_change'));
  };

  const t = (key: string): string => {
    if (!key) return '';
    const lower = key.toLowerCase();

    // Direct lookup
    let val = translations[key];

    // Case-insensitive lookup in translations
    if (!val || val === key) {
      const matchInTranslations = Object.keys(translations).find(k => k.toLowerCase() === lower);
      if (matchInTranslations && translations[matchInTranslations] && translations[matchInTranslations] !== key) {
        val = translations[matchInTranslations];
      }
    }

    // Case-insensitive lookup in current language static dictionary
    if (!val || val === key) {
      const langDict = (TRANSLATIONS[language] || {}) as Record<string, string>;
      const matchInLang = Object.keys(langDict).find(k => k.toLowerCase() === lower);
      if (matchInLang && langDict[matchInLang] && langDict[matchInLang] !== key) {
        val = langDict[matchInLang];
      }
    }

    // Case-insensitive lookup in English static dictionary
    if (!val || val === key) {
      const enDict = (TRANSLATIONS.en || {}) as Record<string, string>;
      const matchInEn = Object.keys(enDict).find(k => k.toLowerCase() === lower);
      if (matchInEn && enDict[matchInEn] && enDict[matchInEn] !== key) {
        val = enDict[matchInEn];
      }
    }

    if (val && val !== key) {
      return val;
    }
    return formatKeyFallback(key);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      t, 
      changeLanguage, 
      isLoading,
      enabledLanguages: { en: config.en_enabled, bn: config.bn_enabled },
      showSwitcher: config.show_switcher
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
