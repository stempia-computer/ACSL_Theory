import { Badge, DataTable, PageHeader } from "@/components/ui";
import { assignments } from "@/lib/mock-data";

export default function Assignments() {
  return (
    <>
      <PageHeader
        title="Assignments"
        description="Review practice sets, due dates, and class submissions."
      />
      <DataTable
        headers={[
          "Assignment",
          "Topic",
          "Due date",
          "Questions",
          "Submitted",
          "Status",
        ]}
        rows={assignments.map((a) => [
          a.title,
          a.topic,
          a.due,
          a.questions,
          `${a.submitted}/${a.total}`,
          <Badge key={a.id}>{a.status}</Badge>,
        ])}
      />
    </>
  );
}
