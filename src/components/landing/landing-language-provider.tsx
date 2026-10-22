"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  LandingLanguage,
  TranslationKey,
  getLandingTranslation,
} from "./landing-i18n";

const STORAGE_KEY = "sp_lang";

interface LandingLanguageContextValue {
  lang: LandingLanguage;
  setLang: (lang: LandingLanguage) => void;
  t: (key: TranslationKey | (string & {}), fallback?: string) => string;
}

const LandingLanguageContext = createContext<
  LandingLanguageContextValue | undefined
>(undefined);

export function LandingLanguageProvider({
  children,
  defaultLang = "en",
}: {
  children: React.ReactNode;
  defaultLang?: LandingLanguage;
}) {
  const [lang, setLangState] = useState<LandingLanguage>(defaultLang);

  // Sync with localStorage on client mount, preserving SSR consistency
  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        STORAGE_KEY,
      ) as LandingLanguage | null;
      if (stored === "en" || stored === "id") {
        setLangState(stored);
      }
    } catch {
      // Storage access may fail in restricted/sandboxed iframes, fall back gracefully
    }
  }, []);

  const setLang = useCallback((nextLang: LandingLanguage) => {
    setLangState(nextLang);
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey | (string & {}), fallback?: string) => {
      return getLandingTranslation(lang, key, fallback);
    },
    [lang],
  );

  return (
    <LandingLanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LandingLanguageContext.Provider>
  );
}

export function useLandingLanguage(): LandingLanguageContextValue {
  const context = useContext(LandingLanguageContext);
  if (!context) {
    return {
      lang: "en",
      setLang: () => {},
      t: (key: TranslationKey | (string & {}), fallback?: string) =>
        getLandingTranslation("en", key, fallback),
    };
  }
  return context;
}
