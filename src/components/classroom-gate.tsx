
import { T } from "@/components/language";
import { isStaff } from "@/lib/classroom-types";
import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getClassroom, ClassroomError } from "@/lib/classroom-server";
import { ClassroomApp } from "@/components/classroom-app";
import { LogoutButton } from "@/components/login-controls";
import {
  worksheetAssignments,
  assignmentQuestions,
} from "@/lib/worksheet-data";
export type View =
  | "dashboard"
  | "student"
  | "students"
  | "teachers"
  | "scores"
  | "assignments"
  | "exercise";
async function Content({
  view,
  assignmentId,
}: {
  view: View;
  assignmentId?: string;
}) {
  await connection();
  let data;
  try {
    data = await getClassroom();
  } catch (e) {
    if (e instanceof ClassroomError && e.status === 401) redirect("/login");
    return (
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-bold"><T>계정 연결 확인</T></h1>
        <p role="alert" className="my-4">
          <T>{e instanceof ClassroomError
            ? e.message
            : "데이터를 불러오지 못했습니다."}</T>
        </p>
        <Link className="mr-4 text-indigo-700 underline" href="/login-setup"><T>로그인 설정 안내</T></Link>
        <LogoutButton />
      </div>
    );
  }
  if (["students", "teachers"].includes(view) && !isStaff(data.member))
    redirect("/dashboard/student");
  if (view === "dashboard" && data.member.role === "student")
    redirect("/dashboard/student");
  const assignments = worksheetAssignments.filter(
    (a) =>
      isStaff(data.member) ||
      a.division === data.member.division?.toLowerCase(),
  );
  const assignment = assignments.find((a) => a.id === assignmentId);
  if (view === "exercise" && !assignment)
    return <p><T>본인 디비전의 과제만 열 수 있습니다.</T></p>;
  const questions = assignment
    ? assignmentQuestions(assignment).map((q) => ({
        id: q.id,
        number: q.number,
        questionImage: q.questionImage,
        hint: q.hint,
      }))
    : [];
  return (
    <ClassroomApp
      initial={data}
      view={view}
      assignments={assignments}
      assignment={assignment}
      questions={questions}
    />
  );
}
export function ClassroomGate(props: { view: View; assignmentId?: string }) {
  return (
    <Suspense
      fallback={
        <p role="status" className="py-12 text-center"><T>계정과 수업 기록을 불러오는 중…</T></p>
      }
    >
      <Content {...props} />
    </Suspense>
  );
}
