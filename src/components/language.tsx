"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, type Language } from "@/lib/translations";

const key = "acsl-language";
type LanguageContextValue = { language: Language; choose: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue>({ language: "en", choose: () => undefined });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const choose = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    try { localStorage.setItem(key, nextLanguage); } catch { /* Private browsing can disable storage. */ }
  }, []);
  useEffect(() => {
    let savedLanguage: Language = "en";
    try { savedLanguage = localStorage.getItem(key) === "ko" ? "ko" : "en"; } catch { /* Private browsing can disable storage. */ }
    queueMicrotask(() => setLanguage(savedLanguage));
    const sync = (event: StorageEvent) => { if (event.key === key) setLanguage(event.newValue === "ko" ? "ko" : "en"); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={{ language, choose }}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const { language, choose } = useContext(LanguageContext);
  return { language, choose, t: (text: string) => translate(text, language) };
}
export function T({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return typeof children === "string" ? t(children) : children;
}
export function LanguageButtons() {
  const { language, choose } = useLanguage();
  return <div role="group" aria-label="Language / 언어" className="flex shrink-0 gap-1 rounded-lg border border-slate-200 p-1">
    {([['en', 'English'], ['ko', '한국어']] as const).map(([value, label]) => <button key={value} type="button" lang={value} aria-pressed={language === value} onClick={() => choose(value)} className={`rounded-md px-3 py-2 text-sm font-semibold ${language === value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><T>{label}</T></button>)}
  </div>;
}
