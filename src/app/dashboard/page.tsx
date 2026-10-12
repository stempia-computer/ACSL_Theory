import Link from "next/link";
import { Card, DashboardTabs, PageHeader, Stats } from "@/components/ui";
import { assignments, questions, students } from "@/lib/mock-data";

export default function TeacherDashboard() {
  return (
    <>
      <DashboardTabs />
      <PageHeader
        title="Teacher Dashboard"
        description="An overview of your class and ACSL practice."
      />
      <Stats
        items={[
          { label: "Students", value: students.length },
          {
            label: "Open assignments",
            value: assignments.filter((a) => a.status === "Open").length,
          },
          { label: "Bank questions", value: questions.length },
          {
            label: "Class average",
            value: `${Math.round(students.reduce((sum, s) => sum + s.score, 0) / students.length)}%`,
          },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Current assignments">
          <ul className="space-y-4">
            {assignments
              .filter((a) => a.status === "Open")
              .map((a) => (
                <li
                  key={a.id}
                  className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >
                  <Link
                    href="/assignments"
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    {a.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    Due {a.due} · {a.submitted}/{a.total} submitted
                  </p>
                </li>
              ))}
          </ul>
        </Card>
        <Card title="Teaching tools">
          <div className="space-y-4">
            {[
              [
                "Question Bank",
                "Browse practice questions by topic.",
                "/question-bank",
              ],
              ["Students", "Review your class roster.", "/students"],
              ["Scores", "Review assignment results.", "/scores"],
            ].map(([title, description, href]) => (
              <Link
                key={href}
                href={href}
                className="block rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="font-medium text-slate-900">{title} →</p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
