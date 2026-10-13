import "server-only";
import { auth, loginConfigured } from "@/auth";
import { callGoogleSheets } from "@/lib/google-sheets-transport";
import type { Classroom } from "@/lib/classroom-types";
export class ClassroomError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function actorEmail() {
  if (!loginConfigured())
    throw new ClassroomError(
      503,
      "Google 로그인을 먼저 설정하세요. /login-setup 안내를 확인하세요.",
    );
  const session = await auth();
  if (!session?.user?.email)
    throw new ClassroomError(401, "로그인이 필요합니다.");
  return session.user.email.toLowerCase();
}
export async function classroomCall(
  email: string,
  action: string,
  data: unknown = {},
) {
  const url = process.env.ACSL_SHEETS_WEBHOOK_URL || "";
  const token = process.env.ACSL_SHEETS_TOKEN || "";
  if (
    !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(
      url,
    ) ||
    token.length < 32 ||
    token.startsWith("REPLACE")
  )
    throw new ClassroomError(503, "Google Sheets 연결 설정이 필요합니다.");
  let result;
  try {
    result = await callGoogleSheets(url, token, {
      version: 2,
      actor: email,
      action,
      data,
    });
  } catch {
    throw new ClassroomError(
      502,
      "저장소에 연결하지 못했습니다. 답안을 유지한 채 다시 시도하세요.",
    );
  }
  if (!result.ok) {
    const code = result.code;
    if (code === "FORBIDDEN")
      throw new ClassroomError(
        403,
        "등록된 계정이 아니거나 사용 권한이 없습니다. 선생님에게 문의하세요.",
      );
    if (code === "INVALID")
      throw new ClassroomError(
        400,
        "입력값을 확인하세요. 이메일 중복, 잘못된 학년·디비전 또는 마지막 선생님 비활성화는 허용되지 않습니다.",
      );
    if (code === "CONFLICT")
      throw new ClassroomError(
        409,
        "이미 저장된 제출입니다. 점수 화면을 새로고침하세요.",
      );
    throw new ClassroomError(
      502,
      "Apps Script 코드를 업데이트하고 새 버전으로 배포했는지 확인하세요. 잠시 후 다시 시도하세요.",
    );
  }
  if (result.version !== 2)
    throw new ClassroomError(502, "Apps Script 최신 버전 배포가 필요합니다.");
  return result.data;
}
export async function getClassroom(): Promise<Classroom> {
  return classroomCall(await actorEmail(), "load");
}
export function apiError(error: unknown) {
  const e =
    error instanceof ClassroomError
      ? error
      : new ClassroomError(500, "요청을 처리하지 못했습니다. 다시 시도하세요.");
  return Response.json(
    { error: e.message },
    { status: e.status, headers: { "Cache-Control": "no-store" } },
  );
}
