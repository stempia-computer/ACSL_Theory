import Link from "next/link";
import { Card, DashboardTabs, PageHeader, Stats } from "@/components/ui";
import { assignments, scores, students } from "@/lib/mock-data";

export default function StudentDashboard() {
  const student = students[0];
  const results = scores.filter((s) => s.student === student.name);
  const pending = assignments.filter(
    (a) =>
      a.status === "Open" && !results.some((s) => s.assignment === a.title),
  );
  return (
    <>
      <DashboardTabs student />
      <PageHeader
        title="Student Dashboard"
        description={`Welcome, ${student.name}. Keep building your ACSL skills.`}
      />
      <Stats
        items={[
          { label: "Division", value: student.division },
          { label: "Completed assignments", value: student.completed },
          { label: "Assignments to complete", value: pending.length },
          { label: "Average score", value: `${student.score}%` },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Up next">
          <ul className="space-y-4">
            {pending.map((a) => (
              <li key={a.id}>
                <Link
                  href="/assignments"
                  className="font-medium text-indigo-700 hover:underline"
                >
                  {a.title}
                </Link>
                <p className="mt-1 text-sm text-slate-500">
                  {a.questions} questions · Due {a.due}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/question-bank"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Browse practice questions
          </Link>
        </Card>
        <Card title="Recent results">
          <ul className="space-y-4">
            {results.map((s) => (
              <li
                key={s.assignment}
                className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >
                <span className="text-sm text-slate-700">{s.assignment}</span>
                <span className="whitespace-nowrap font-semibold text-indigo-700">
                  {s.earned}/{s.possible}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/scores"
            className="mt-5 inline-block text-sm font-medium text-indigo-700 hover:underline"
          >
            View all scores →
          </Link>
        </Card>
      </div>
    </>
  );
}
