import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { WorksheetHomework } from "@/components/worksheet-homework";
import { worksheetAssignments } from "@/lib/worksheet-data";
export function generateStaticParams() {
  return worksheetAssignments.map((a) => ({ id: a.id }));
}
export default async function WorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assignment = worksheetAssignments.find((a) => a.id === id);
  if (!assignment) notFound();
  return (
    <>
      <PageHeader
        title={assignment.title}
        description="Read each question, enter your answer, then submit for automatic scoring and review."
      />
      <Suspense fallback={<p>Loading your worksheet…</p>}>
        <WorksheetHomework assignment={assignment} />
      </Suspense>
    </>
  );
}
