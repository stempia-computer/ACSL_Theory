import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
        ACSL Theory
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-2 text-slate-600">{description}</p>
    </div>
  );
}

export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function Stats({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
      {children}
    </span>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-100 text-slate-600">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="whitespace-nowrap px-6 py-4 font-medium"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={index} className="text-slate-700">
              {row.map((cell, i) => (
                <td key={i} className="px-6 py-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardTabs({ student = false }: { student?: boolean }) {
  return (
    <nav aria-label="Dashboard views" className="mb-6 flex gap-2">
      {[
        ["Teacher", "/dashboard", !student],
        ["Student", "/dashboard/student", student],
      ].map(([label, href, active]) => (
        <Link
          key={String(href)}
          href={String(href)}
          aria-current={active ? "page" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${active ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
