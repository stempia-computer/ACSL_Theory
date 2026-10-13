import { isStaff } from "@/lib/classroom-types";
import { connection } from "next/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getClassroom } from "@/lib/classroom-server";
import { PageHeader } from "@/components/ui";
import { QuestionBank } from "@/components/question-bank";
async function Content() {
  await connection();
  let classroom;
  try {
    classroom = await getClassroom();
  } catch {
    redirect("/login");
  }
  if (!isStaff(classroom.member)) redirect("/dashboard/student");
  return (
    <>
      <PageHeader
        title="Question Bank"
        description="Teacher workspace. Custom question edits are still stored in this browser; worksheet homework is shared."
      />
      <QuestionBank />
    </>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p>Checking access…</p>}>
      <Content />
    </Suspense>
  );
}
