import {
  actorEmail,
  apiError,
  classroomCall,
  ClassroomError,
} from "@/lib/classroom-server";
import { prepareSheetSubmission } from "@/lib/sheet-submission";
import { worksheetAssignments, worksheetQuestions } from "@/lib/worksheet-data";
import type { Classroom } from "@/lib/classroom-types";
import { isStaff } from '@/lib/classroom-types';
import { createHomework, assignedQuestions } from '@/lib/assignment-catalog';
export async function GET() {
  try {
    return Response.json(await classroomCall(await actorEmail(), "load"), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const email = await actorEmail();
    const origin = process.env.AUTH_URL
      ? new URL(process.env.AUTH_URL).origin
      : new URL(request.url).origin;
    if (request.headers.get("origin") !== origin)
      throw new ClassroomError(403, "잘못된 요청 출처입니다.");
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new ClassroomError(415, "JSON 요청이 필요합니다.");
    const text = await request.text();
    if (text.length > 32768)
      throw new ClassroomError(413, "요청이 너무 큽니다.");
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new ClassroomError(400, "잘못된 요청입니다.");
    }
    if (!body || typeof body !== "object")
      throw new ClassroomError(400, "잘못된 요청입니다.");
    if (body.action === 'createAssignment') {
      const classroom: Classroom = await classroomCall(email, 'load');
      if (!isStaff(classroom.member)) throw new ClassroomError(403, 'Teachers only.');
      let assignment;
      try { assignment = createHomework(body.data, classroom.students, email); }
      catch (error) { throw new ClassroomError(400, (error as Error).message); }
      if (/^worksheet-(intermediate|senior)-\d+$/.test(assignment.sourceId) && !classroom.worksheetReview)
        throw new ClassroomError(503, 'Update Apps Script to enable these worksheets.');
      return Response.json(await classroomCall(email, 'createAssignment', assignment));
    }
    if (body.action === "submit") {
      const { member, assignments = [] }: Classroom = await classroomCall(email, "load");
      if (member.role !== "student")
        throw new ClassroomError(403, "학생 계정에서만 제출할 수 있습니다.");
      let submission;
      try {
        const assigned = assignments.find((a) => a.id === body.data?.assignmentId);
        if (assigned && !assigned.studentIds.includes(member.id)) throw new Error('Not assigned');
        const questions = assigned ? assignedQuestions(assigned) : worksheetQuestions;
        submission = prepareSheetSubmission(
          {
            ...body.data,
            student: member.name,
            submittedAt: new Date().toISOString(),
          },
          assigned ? [assigned] : worksheetAssignments,
          questions,
        );
        if (assigned) submission.results = submission.results.map((r) => {
          const q = assignedQuestions(assigned).find((q) => q.id === r.id)!;
          return { ...r, problemPdf: q.problemPdf, solutionPdf: q.solutionPdf };
        });
      } catch {
        throw new ClassroomError(400, "과제와 답안을 확인하세요.");
      }
      if (submission.division !== member.division?.toLowerCase())
        throw new ClassroomError(
          403,
          "본인 디비전의 과제만 제출할 수 있습니다.",
        );
      return Response.json(await classroomCall(email, "submit", submission), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (!["saveStudent", "saveTeacher", "updateProfile", "reviewAnswer"].includes(body.action))
      throw new ClassroomError(400, "지원하지 않는 요청입니다.");
    // Apps Script checks the actor's current role under its write lock on every operation.
    return Response.json(await classroomCall(email, body.action, body.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
