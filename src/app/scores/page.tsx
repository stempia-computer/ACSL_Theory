import { DataTable, PageHeader } from "@/components/ui";
import { scores } from "@/lib/mock-data";

export default function Scores() {
  return (
    <>
      <PageHeader
        title="Scores"
        description="Sample assignment results across the class."
      />
      <DataTable
        headers={["Student", "Assignment", "Score", "Percentage"]}
        rows={scores.map((s) => [
          s.student,
          s.assignment,
          `${s.earned}/${s.possible}`,
          `${Math.round((s.earned / s.possible) * 100)}%`,
        ])}
      />
    </>
  );
}
