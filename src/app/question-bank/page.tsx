
import { T } from "@/components/language";
import { isStaff } from "@/lib/classroom-types";
import { connection } from "next/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getClassroom } from "@/lib/classroom-server";
import { PageHeader } from "@/components/ui";
import { QuestionBank } from "@/components/question-bank";
import { ContestLibrary } from "@/components/contest-library";
import { contestPackets } from "@/lib/contest-packets";
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
        description="Browse official contest packets, practice with automatic grading, and manage custom questions."
      />
      <div className="mb-8"><ContestLibrary packets={contestPackets} /></div>
      <QuestionBank />
    </>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p><T>Checking access…</T></p>}>
      <Content />
    </Suspense>
  );
}
