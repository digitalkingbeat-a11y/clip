/**
 * LanguageContext.tsx
 *
 * Global React context for application localization and language switching
 * between English (en), Spanish (es), and French (fr).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { SupportedLanguage, SUPPORTED_LANGUAGES, translations, LanguageMeta } from "./translations";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageMeta[];
  currentLanguageMeta: LanguageMeta;
}

const STORAGE_KEY = "clipflow_app_language";

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    if (saved && (saved === "en" || saved === "es" || saved === "fr")) {
      return saved;
    }
  } catch {}

  // Detect browser language
  if (typeof navigator !== "undefined" && navigator.language) {
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith("es")) return "es";
    if (navLang.startsWith("fr")) return "fr";
  }

  return "en";
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  /**
   * Safe nested key lookup with fallback to English
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let val: any = translations[language];

      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          val = undefined;
          break;
        }
      }

      // Fallback to English if translation is missing in the chosen language
      if (val === undefined || typeof val !== "string") {
        let fallbackVal: any = translations.en;
        for (const k of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && k in fallbackVal) {
            fallbackVal = fallbackVal[k];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        val = fallbackVal;
      }

      if (typeof val !== "string") {
        return key;
      }

      // Parameter replacement {paramName}
      if (params) {
        let result = val;
        for (const [pKey, pVal] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${pKey}\\}`, "g"), String(pVal));
        }
        return result;
      }

      return val;
    },
    [language]
  );

  const currentLanguageMeta = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageMeta,
    }),
    [language, setLanguage, t, currentLanguageMeta]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Aliased helper hook for convenience
export const useTranslation = () => {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
};

export default LanguageContext;

