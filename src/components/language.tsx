"use client";
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { translate, type Language } from "@/lib/translations";

const key = "acsl-language";
let current: Language = "en";
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function choose(language: Language) {
  current = language;
  try { localStorage.setItem(key, language); } catch { /* Private browsing can disable storage. */ }
  listeners.forEach((listener) => listener());
}
const LanguageContext = createContext<Language>("en");
export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, () => current, () => "en" as Language);
  useEffect(() => {
    try { choose(localStorage.getItem(key) === "ko" ? "ko" : "en"); } catch { choose("en"); }
    const sync = (event: StorageEvent) => { if (event.key === key) choose(event.newValue === "ko" ? "ko" : "en"); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const language = useContext(LanguageContext);
  return { language, t: (text: string) => translate(text, language) };
}
export function T({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return typeof children === "string" ? t(children) : children;
}
export function LanguageButtons() {
  const { language } = useLanguage();
  return <div role="group" aria-label="Language / 언어" className="flex shrink-0 gap-1 rounded-lg border border-slate-200 p-1">
    {([['en', 'English'], ['ko', '한국어']] as const).map(([value, label]) => <button key={value} type="button" lang={value} aria-pressed={language === value} onClick={() => choose(value)} className={`rounded-md px-3 py-2 text-sm font-semibold ${language === value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><T>{label}</T></button>)}
  </div>;
}
