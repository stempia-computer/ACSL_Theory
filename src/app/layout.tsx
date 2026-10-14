
import { T, LanguageProvider } from "@/components/language";
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "ACSL Theory",
  description: "ACSL Theory — Stempia Computer Institute",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <LanguageProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
        ><T>Skip to content</T></a>
        <Suspense
          fallback={
            <header className="border-b bg-white p-6 font-bold">
              Stempia Computer Institute
            </header>
          }
        >
          <Navigation />
        </Suspense>
        <main id="main-content" className="mx-auto max-w-6xl px-6 py-10">
          {children}
        </main>
        <footer className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-500"><T>ACSL Theory · Worksheet practice by Stempia Computer Institute</T></footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
