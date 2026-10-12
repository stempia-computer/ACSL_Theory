import { worksheetAssignments, worksheetQuestions } from "@/lib/worksheet-data";
import { deliverToGoogleSheets } from "@/lib/google-sheets-transport";
import { prepareSheetSubmission } from "@/lib/sheet-submission";

function config() {
  const url = process.env.ACSL_SHEETS_WEBHOOK_URL || "";
  const token = process.env.ACSL_SHEETS_TOKEN || "";
  return {
    url,
    token,
    configured:
      /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(
        url,
      ) &&
      token.length >= 32 &&
      !token.startsWith("REPLACE_"),
  };
}
export async function GET() {
  return Response.json(
    { configured: config().configured },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json({ error: "JSON is required." }, { status: 415 });
  if (Number(request.headers.get("content-length")) > 32768)
    return Response.json(
      { error: "Submission is too large." },
      { status: 413 },
    );
  let submission;
  try {
    const text = await request.text();
    if (text.length > 32768)
      return Response.json(
        { error: "Submission is too large." },
        { status: 413 },
      );
    submission = prepareSheetSubmission(
      JSON.parse(text),
      worksheetAssignments,
      worksheetQuestions,
    );
  } catch {
    return Response.json(
      {
        error:
          "Invalid submission. Check the student name, assignment, and answers.",
      },
      { status: 400 },
    );
  }
  const settings = config();
  if (!settings.configured)
    return Response.json(
      {
        code: "NOT_CONFIGURED",
        error:
          "Google Sheets is not connected yet. Your result is saved in this browser.",
      },
      { status: 503 },
    );
  try {
    await deliverToGoogleSheets(settings.url, settings.token, submission);
    return Response.json({
      ok: true,
      id: submission.id,
      syncedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        error:
          "Sending to Google Sheets could not be confirmed. Keep this result and retry; duplicate attempts will not be added.",
      },
      { status: 502 },
    );
  }
}
