import {
  actorEmail,
  apiError,
  classroomCall,
  ClassroomError,
} from "@/lib/classroom-server";
import { prepareSheetSubmission } from "@/lib/sheet-submission";
import { worksheetAssignments, worksheetQuestions } from "@/lib/worksheet-data";
import type { Classroom } from "@/lib/classroom-types";
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
    if (body.action === "submit") {
      const { member }: Classroom = await classroomCall(email, "load");
      if (member.role !== "student")
        throw new ClassroomError(403, "학생 계정에서만 제출할 수 있습니다.");
      let submission;
      try {
        submission = prepareSheetSubmission(
          {
            ...body.data,
            student: member.name,
            submittedAt: new Date().toISOString(),
          },
          worksheetAssignments,
          worksheetQuestions,
        );
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
    if (!["saveStudent", "saveTeacher"].includes(body.action))
      throw new ClassroomError(400, "지원하지 않는 요청입니다.");
    // Apps Script checks the actor's current role under its write lock on every operation.
    return Response.json(await classroomCall(email, body.action, body.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
