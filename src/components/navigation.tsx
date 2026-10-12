"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Dashboard", "/dashboard"],
  ["Assignments", "/assignments"],
  ["Question Bank", "/question-bank"],
  ["Students", "/students"],
  ["Scores", "/scores"],
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="text-lg font-bold text-slate-900">
          Stempia Computer Institute
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap gap-1">
          {links.map(([label, href]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
