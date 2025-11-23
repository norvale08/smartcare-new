"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Translations } from "./translations"

interface TranslationContextType {
  language: string
  setLanguage: (lang: string) => void
  t: Translations
  availableLanguages: { code: string; name: string; nativeName: string }[]
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}

interface TranslationProviderProps {
  children: ReactNode
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>("en-US")

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage && translations[savedLanguage as keyof typeof translations]) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: string) => {
    if (translations[lang as keyof typeof translations]) {
      setLanguage(lang)
      localStorage.setItem("language", lang)
    }
  }

  const availableLanguages = [
    { code: "en-US", name: "English", nativeName: "English" },
    { code: "sw-TZ", name: "Swahili", nativeName: "Kiswahili" },
  ]

  const currentTranslations = (translations[language as keyof typeof translations] ||
    translations["en-US"]) as Translations

  return (
    <TranslationContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: currentTranslations,
        availableLanguages,
      }}
    >
      {children}
    </TranslationContext.Provider>
  )
}
