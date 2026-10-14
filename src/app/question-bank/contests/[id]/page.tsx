import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { isStaff } from "@/lib/classroom-types";
import { getClassroom } from "@/lib/classroom-server";
import { contestPackets } from "@/lib/contest-packets";
import { ContestPractice } from "@/components/contest-practice";

async function Content({ params }: PageProps<"/question-bank/contests/[id]">) {
  await connection();
  let classroom;
  try { classroom = await getClassroom(); } catch { redirect("/login"); }
  if (!isStaff(classroom.member)) redirect("/dashboard/student");
  const { id } = await params;
  const packet = contestPackets.find((item) => item.id === id);
  if (!packet) notFound();
  return <ContestPractice packet={packet} />;
}

export default function Page(props: PageProps<"/question-bank/contests/[id]">) {
  return <Suspense fallback={<p className="py-12 text-center">Loading contest…</p>}><Content {...props} /></Suspense>;
}
