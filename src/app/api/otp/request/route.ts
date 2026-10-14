import { normalizeEmail, otpConfigured, requestOtp } from "@/lib/otp";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (!otpConfigured())
      return Response.json(
        { error: "OTP 연결 설정과 최신 Apps Script 배포가 필요합니다." },
        { status: 503, headers },
      );
    if (request.headers.get("origin") !== new URL(process.env.AUTH_URL!).origin)
      return Response.json(
        { error: "잘못된 요청입니다." },
        { status: 403, headers },
      );
    if (!request.headers.get("content-type")?.includes("application/json"))
      return Response.json(
        { error: "JSON 요청이 필요합니다." },
        { status: 415, headers },
      );
    const text = await request.text();
    if (text.length > 1024)
      return Response.json(
        { error: "요청이 너무 큽니다." },
        { status: 413, headers },
      );
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "이메일을 확인하세요." },
        { status: 400, headers },
      );
    }
    const email = normalizeEmail(value?.email);
    if (!email)
      return Response.json(
        { error: "이메일을 확인하세요." },
        { status: 400, headers },
      );
    return Response.json(await requestOtp(email), { headers });
  } catch {
    return Response.json(
      {
        error: "인증번호 요청을 처리하지 못했습니다. 잠시 후 다시 시도하세요.",
      },
      { status: 502, headers },
    );
  }
}
