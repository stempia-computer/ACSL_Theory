import Link from "next/link";
import { Card, DashboardTabs, PageHeader, Stats } from "@/components/ui";
import { worksheetAssignments, worksheetQuestions } from "@/lib/worksheet-data";
export default function TeacherDashboard() {
  return (
    <>
      <DashboardTabs />
      <PageHeader
        title="Teacher Dashboard"
        description="Computer Number Systems worksheets ready for practice and automatic scoring."
      />
      <Stats
        items={[
          { label: "Divisions", value: 3 },
          {
            label: "Worksheet assignments",
            value: worksheetAssignments.length,
          },
          { label: "Original questions", value: worksheetQuestions.length },
          { label: "Due date", value: "Oct 16" },
        ]}
      />
      <Card title="Assigned worksheets">
        <p className="mb-5 text-sm text-slate-600">
          Both parts are due Friday, October 16, 2026. Student answers and
          results currently stay in each browser. Students can export their
          results to share with you.
        </p>
        <ul className="space-y-4">
          {worksheetAssignments.map((a) => (
            <li
              key={a.id}
              className="border-b border-slate-100 pb-4 last:border-0"
            >
              <Link
                href={`/assignments/${a.id}`}
                className="font-medium text-indigo-700 hover:underline"
              >
                {a.title}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                Questions {a.first}–{a.last} · {a.questionIds.length} points
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
