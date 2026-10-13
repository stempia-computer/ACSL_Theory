import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { receiver } from "./helpers/apps-script.mjs";
import { verifiedGoogleEmail } from "../src/lib/auth-policy.ts";
import { prepareSheetSubmission } from "../src/lib/sheet-submission.ts";
import { deliverToGoogleSheets } from "../src/lib/google-sheets-transport.ts";
const data = JSON.parse(
  readFileSync(new URL("../src/data/worksheet-homework.json", import.meta.url)),
);
const attempt = {
  id: "11111111-1111-4111-8111-111111111111",
  assignmentId: "junior-cns-1",
  student: "Test Student",
  submittedAt: "2026-10-12T12:00:00.000Z",
  answers: { "junior-cns-01": "10001001111" },
};
const prepared = () =>
  prepareSheetSubmission(attempt, data.assignments, data.questions);

test("server regrades answers, ignores client score, includes all unanswered questions", () => {
  const result = prepareSheetSubmission(
    { ...attempt, score: 999, results: [{ correct: true }] },
    data.assignments,
    data.questions,
  );
  assert.equal(result.score, 1);
  assert.equal(result.total, 14);
  assert.equal(result.results.length, 14);
  assert.equal(result.results[1].answer, "");
  assert.equal(result.results[1].correct, false);
  assert.equal(result.percentage, 7);
});
test("reject unknown assignments/questions and malformed payloads", () => {
  for (const value of [
    null,
    [],
    { ...attempt, id: "bad" },
    { ...attempt, student: "  " },
    { ...attempt, student: "x".repeat(81) },
    { ...attempt, assignmentId: "unknown" },
    { ...attempt, answers: [] },
    { ...attempt, answers: { "senior-cns-01": "1" } },
    { ...attempt, answers: { "junior-cns-01": 42 } },
    { ...attempt, submittedAt: "invalid" },
  ])
    assert.throws(() =>
      prepareSheetSubmission(value, data.assignments, data.questions),
    );
});
test("Google redirect receives GET with no credential body", async () => {
  const calls = [];
  await deliverToGoogleSheets(
    "https://script.google.com/macros/s/example/exec",
    "fake-test-token",
    prepared(),
    async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1
        ? new Response(null, {
            status: 302,
            headers: {
              location:
                "https://script.googleusercontent.com/macros/echo?test=1",
            },
          })
        : Response.json({ ok: true, id: attempt.id });
    },
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(JSON.parse(calls[0].options.body).submission.score, 1);
  assert.equal(calls[1].options.method, "GET");
  assert.equal(calls[1].options.body, undefined);
  assert.equal(calls[1].options.headers, undefined);
});
test("reject untrusted redirects, unknown receipts, and failed or timed out receivers", async () => {
  for (const location of [
    "https://example.com/echo",
    "http://script.googleusercontent.com/echo",
    "https://script.googleusercontent.com.evil.test/echo",
  ]) {
    let count = 0;
    await assert.rejects(
      deliverToGoogleSheets(
        "https://script.google.com/exec",
        "fake",
        prepared(),
        async () => {
          count++;
          return new Response(null, { status: 302, headers: { location } });
        },
      ),
    );
    assert.equal(count, 1);
  }
  for (const receipt of [
    { ok: false },
    { ok: true, id: "other" },
    { id: attempt.id },
  ])
    await assert.rejects(
      deliverToGoogleSheets(
        "https://script.google.com/exec",
        "fake",
        prepared(),
        async () => Response.json(receipt),
      ),
    );
  await assert.rejects(
    deliverToGoogleSheets(
      "https://script.google.com/exec",
      "fake",
      prepared(),
      async () => new Response("Forbidden", { status: 403 }),
    ),
  );
  await assert.rejects(
    deliverToGoogleSheets(
      "https://script.google.com/exec",
      "fake",
      prepared(),
      async () => {
        throw new Error("timeout");
      },
    ),
  );
});

const teacher = "wonup2@gmail.com";
const student = "student@example.com";
function classroom() {
  const r = receiver();
  const add = r.request(teacher, "saveStudent", {
    name: "Test Student",
    email: student,
    division: "Junior",
    grade: "6",
    active: true,
  });
  assert.equal(add.ok, true);
  return r;
}
test("only verified Google profiles can become actors", () => {
  assert.equal(
    verifiedGoogleEmail(
      { provider: "google" },
      { email: " Student@Example.com ", email_verified: true },
    ),
    null,
  );
  assert.equal(
    verifiedGoogleEmail(
      { provider: "google" },
      { email: "Student@Example.com", email_verified: true },
    ),
    student,
  );
  for (const profile of [
    { email: student, email_verified: false },
    { email: student },
    { email: student, email_verified: "true" },
    { email: 42, email_verified: true },
  ])
    assert.equal(verifiedGoogleEmail({ provider: "google" }, profile), null);
  assert.equal(
    verifiedGoogleEmail(
      { provider: "credentials" },
      { email: student, email_verified: true },
    ),
    null,
  );
});
test("two seed teachers, anonymous/unknown actors rejected, no legacy writes", () => {
  const r = receiver();
  assert.deepEqual(
    r.request(teacher, "load").data.teachers.map((t) => t.email),
    [teacher, "seanlee611@gmail.com", "stempiacomputer@gmail.com"],
  );
  assert.equal(r.request(teacher, "load", {}, "wrong-token").ok, false);
  assert.equal(r.request("unknown@example.com", "load").code, "FORBIDDEN");
  assert.equal(r.legacy().ok, false);
  r.context.setup();
  assert.equal(r.request(teacher, "load").data.teachers.length, 3);
});
test("student registration validates fields, normalizes email and rejects duplicates", () => {
  const r = classroom();
  for (const changes of [
    { email: "bad" },
    { name: "" },
    { division: "Other" },
    { grade: "13" },
    { active: "true" },
    { id: "unknown" },
  ])
    assert.equal(
      r.request(teacher, "saveStudent", {
        name: "Other",
        email: "other@example.com",
        division: "Junior",
        grade: "6",
        active: true,
        ...changes,
      }).code,
      "INVALID",
    );
  assert.equal(
    r.request(teacher, "saveStudent", {
      name: "Duplicate",
      email: " STUDENT@EXAMPLE.COM ",
      division: "Junior",
      grade: "6",
      active: true,
    }).code,
    "INVALID",
  );
  assert.equal(
    r.request(teacher, "saveTeacher", {
      name: "Duplicate role",
      email: student,
      active: true,
    }).code,
    "INVALID",
  );
});
test("student reads only own answers; cannot manage accounts or submit as another student", () => {
  const r = classroom();
  const other = r.request(teacher, "saveStudent", {
    name: "Other",
    email: "other@example.com",
    division: "Junior",
    grade: "7",
    active: true,
  }).data.member;
  const submission = {
    ...prepared(),
    studentId: other.id,
    email: other.email,
    student: "Other",
  };
  assert.equal(r.request(student, "submit", submission).ok, true);
  const mine = r.request(student, "load").data;
  assert.equal(mine.students.length, 0);
  assert.equal(mine.teachers.length, 0);
  assert.equal(mine.attempts.length, 1);
  assert.equal(mine.attempts[0].email, student);
  assert.equal(mine.attempts[0].student, "Test Student");
  assert.equal(
    r.request(other.email, "load", { studentId: mine.member.id }).data.attempts
      .length,
    0,
  );
  assert.equal(
    r.request(student, "saveTeacher", {
      email: student,
      name: "Evil",
      active: true,
    }).code,
    "FORBIDDEN",
  );
  assert.equal(r.request(student, "saveStudent", other).code, "FORBIDDEN");
  assert.equal(r.request(teacher, "load").data.attempts.length, 1);
  assert.equal(
    r.request(student, "submit", { ...prepared(), division: "senior" }).code,
    "INVALID",
  );
  assert.equal(r.request(teacher, "submit", prepared()).code, "FORBIDDEN");
});
test("immutable, idempotent attempts and cross-student ID conflicts", () => {
  const r = classroom();
  const first = r.request(student, "submit", prepared()).data.attempt;
  const changed = prepared();
  changed.results[0].answer = "changed";
  assert.equal(
    r.request(student, "submit", changed).data.attempt.results[0].answer,
    first.results[0].answer,
  );
  assert.equal(r.sheets.get("계정별 제출").rows.length, 2);
  assert.equal(r.sheets.get("문제별 결과").rows.length, 15);
  r.request(teacher, "saveStudent", {
    name: "Other",
    email: "other@example.com",
    division: "Junior",
    grade: "7",
    active: true,
  });
  assert.equal(
    r.request("other@example.com", "submit", prepared()).code,
    "CONFLICT",
  );
});
test("partial projection write retries repair without duplicate canonical or question records", () => {
  const r = classroom();
  r.failNextSummary();
  assert.equal(r.request(student, "submit", prepared()).ok, false);
  assert.equal(r.sheets.get("계정별 제출").rows.length, 2);
  assert.equal(r.sheets.get("문제별 결과").rows.length, 15);
  assert.equal(r.request(student, "submit", prepared()).ok, true);
  assert.equal(r.sheets.get("제출 기록").rows.length, 2);
  assert.equal(r.sheets.get("문제별 결과").rows.length, 15);
});
test("revocation takes effect immediately, teacher creation and last teacher protection", () => {
  const r = classroom();
  const member = r.request(student, "load").data.member;
  r.request(student, "submit", prepared());
  assert.equal(
    r.request(teacher, "saveStudent", { ...member, active: false }).ok,
    true,
  );
  assert.equal(r.request(student, "load").code, "FORBIDDEN");
  assert.equal(r.request(student, "submit", prepared()).code, "FORBIDDEN");
  assert.equal(r.request(teacher, "load").data.attempts.length, 1);
  const teachers = r.request(teacher, "load").data.teachers;
  assert.equal(
    r.request(teacher, "saveTeacher", { ...teachers[1], active: false }).ok,
    true,
  );
  assert.equal(
    r.request(teacher, "saveTeacher", { ...teachers[0], active: false }).code,
    "INVALID",
  );
  r.context.setup();
  assert.equal(r.request("seanlee611@gmail.com", "load").code, "FORBIDDEN");
  assert.equal(
    r.request(teacher, "saveTeacher", {
      name: "New Teacher",
      email: "newteacher@example.com",
      active: true,
    }).ok,
    true,
  );
  assert.equal(
    r.request("newteacher@example.com", "load").data.students.length,
    1,
  );
});
test("formula escaping, stable student ID on email edits, and locking", () => {
  const r = classroom();
  const member = r.request(student, "load").data.member;
  r.request(teacher, "saveStudent", {
    ...member,
    name: '=HYPERLINK("https://example.test")',
  });
  const submission = prepared();
  submission.results[0].answer = "+1";
  assert.equal(r.request(student, "submit", submission).ok, true);
  assert.ok(r.sheets.get("제출 기록").rows[1][3].startsWith("'="));
  assert.equal(r.sheets.get("문제별 결과").rows[1][5], "'+1");
  r.request(teacher, "saveStudent", {
    ...member,
    email: "updated@example.com",
  });
  assert.equal(r.request(student, "load").code, "FORBIDDEN");
  assert.equal(
    r.request("updated@example.com", "load").data.attempts.length,
    1,
  );
  r.block();
  assert.equal(r.request(teacher, "load").ok, false);
});

test("admin upgrade preserves existing records and grants protected staff access", () => {
  const r = classroom();
  const adminEmail = "stempiacomputer@gmail.com";
  // Reproduce the previous two-teacher sheet, then run the upgrade twice.
  const sheet = r.sheets.get("선생님 계정");
  sheet.rows = sheet.rows.filter((row) => row[1] !== adminEmail);
  r.request(student, "submit", prepared());
  r.context.setup();
  const admin = r.request(adminEmail, "load");
  assert.equal(admin.ok, true);
  assert.equal(admin.data.member.role, "admin");
  assert.equal(admin.data.students.length, 1);
  assert.equal(admin.data.attempts.length, 1);
  const id = admin.data.member.id;
  r.context.setup();
  assert.equal(r.request(adminEmail, "load").data.member.id, id);
  assert.equal(r.request(adminEmail, "load").data.teachers.length, 3);
  assert.equal(
    r.request(adminEmail, "saveTeacher", {
      name: "Fourth",
      email: "fourth@example.com",
      active: true,
    }).ok,
    true,
  );
  assert.equal(
    r.request(teacher, "saveTeacher", { ...admin.data.member, active: false })
      .code,
    "FORBIDDEN",
  );
  assert.equal(
    r.request(adminEmail, "saveTeacher", {
      ...admin.data.member,
      email: "changed@example.com",
    }).code,
    "FORBIDDEN",
  );
  const forged = r.request(teacher, "saveTeacher", {
    email: "ordinary@example.com",
    name: "Ordinary",
    active: true,
    role: "admin",
  });
  assert.equal(forged.data.member.role, "teacher");
});
