import Link from "next/link";

export default function Home() {
  return (
    <div className="py-16 text-center sm:py-24">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-600">
        Learn. Practice. Progress.
      </p>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        ACSL Theory
      </h1>
      <p className="mt-4 text-lg text-slate-600">Stempia Computer Institute</p>
      <p className="mx-auto mt-6 max-w-lg text-slate-500">
        A simple space for ACSL practice, assignments, and student progress.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Teacher Dashboard
        </Link>
        <Link
          href="/dashboard/student"
          className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Student Dashboard
        </Link>
      </div>
    </div>
  );
}
