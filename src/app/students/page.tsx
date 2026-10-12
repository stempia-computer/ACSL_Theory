import { DataTable, PageHeader } from "@/components/ui";
import { students } from "@/lib/mock-data";

export default function Students() {
  return (
    <>
      <PageHeader
        title="Students"
        description="Your class roster and a snapshot of student progress."
      />
      <DataTable
        headers={[
          "Student",
          "Student ID",
          "Division",
          "Completed assignments",
          "Average score",
        ]}
        rows={students.map((s) => [
          s.name,
          s.id,
          s.division,
          s.completed,
          `${s.score}%`,
        ])}
      />
    </>
  );
}
