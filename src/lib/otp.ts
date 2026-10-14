import "server-only";
import { createHmac, randomInt, randomUUID } from "node:crypto";
import { callGoogleSheets } from "@/lib/google-sheets-transport";
export function sessionConfigured() {
  return !!(
    process.env.AUTH_URL &&
    process.env.AUTH_SECRET &&
    process.env.AUTH_SECRET.length >= 32 &&
    !process.env.AUTH_SECRET.startsWith("REPLACE")
  );
}
export function otpConfigured() {
  return (
    sessionConfigured() &&
    /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(
      process.env.ACSL_SHEETS_WEBHOOK_URL || "",
    ) &&
    (process.env.ACSL_SHEETS_TOKEN || "").length >= 32 &&
    !process.env.ACSL_SHEETS_TOKEN?.startsWith("REPLACE")
  );
}
export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null;
}
function digest(email: string, challenge: string, code: string) {
  return createHmac("sha256", process.env.AUTH_SECRET!)
    .update(JSON.stringify([email, challenge, code]))
    .digest("hex");
}
async function otpCall(
  email: string,
  action: string,
  data: Record<string, string>,
) {
  if (!otpConfigured()) throw new Error("OTP not configured");
  const result = await callGoogleSheets(
    process.env.ACSL_SHEETS_WEBHOOK_URL!,
    process.env.ACSL_SHEETS_TOKEN!,
    { version: 2, actor: email, action, data },
  );
  if (result.ok !== true || result.version !== 2)
    throw new Error("OTP unavailable");
  return result.data;
}
export async function requestOtp(email: string) {
  const challenge = randomUUID();
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  await otpCall(email, "otpRequest", {
    challenge,
    code,
    digest: digest(email, challenge, code),
  });
  return { challenge };
}
export async function verifyOtp(
  emailInput: unknown,
  challenge: unknown,
  code: unknown,
) {
  const email = normalizeEmail(emailInput);
  if (
    !email ||
    typeof challenge !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(challenge) ||
    typeof code !== "string" ||
    !/^\d{6}$/.test(code)
  )
    return null;
  try {
    const result = await otpCall(email, "otpVerify", {
      challenge,
      digest: digest(email, challenge, code),
    });
    return result?.member?.email === email && result.member.active === true
      ? { id: result.member.id, name: result.member.name, email }
      : null;
  } catch {
    return null;
  }
}
