import { Suspense } from "react";
import { ClassroomGate } from "@/components/classroom-gate";
async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClassroomGate view="exercise" assignmentId={id} />;
}
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
