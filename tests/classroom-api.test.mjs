import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { readFileSync } from "node:fs";
const secret = "classroom-integration-fixture-secret-only-0123456789";
const cookieName = "authjs.session-token";
let server,
  base,
  logs = "";
const teacher = "wonup2@gmail.com",
  student = "first@example.com",
  other = "second@example.com";
let studentId, submittedId;
async function cookie(email, verified = true) {
  return `${cookieName}=${await encode({ token: { email, verified }, secret, salt: cookieName, maxAge: 3600 })}`;
}
async function request(email, action, data, options = {}) {
  const headers = email ? { Cookie: await cookie(email) } : {};
  if (action)
    Object.assign(headers, {
      "Content-Type": "application/json",
      Origin: base,
    });
  const r = await fetch(base + "/api/classroom", {
    method: action ? "POST" : "GET",
    headers: { ...headers, ...options.headers },
    ...(action ? { body: JSON.stringify({ action, data }) } : {}),
  });
  return { status: r.status, body: await r.json(), headers: r.headers };
}
before(async () => {
  const portServer = createServer();
  portServer.listen(0, "127.0.0.1");
  await once(portServer, "listening");
  const port = portServer.address().port;
  await new Promise((r) => portServer.close(r));
  base = `http://localhost:${port}`;
  server = spawn(
    process.execPath,
    [
      "--import",
      "./tests/helpers/sheets-preload.mjs",
      "node_modules/next/dist/bin/next",
      "start",
      "--port",
      String(port),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        AUTH_URL: base,
        AUTH_SECRET: secret,
        AUTH_GOOGLE_ID: "fixture-google-id",
        AUTH_GOOGLE_SECRET: "fixture-google-secret",
        ACSL_SHEETS_WEBHOOK_URL:
          "https://script.google.com/macros/s/ACSL_TEST_ONLY_0123456789/exec",
        ACSL_SHEETS_TOKEN: "test-token-".repeat(4),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout.on("data", (b) => (logs += b));
  server.stderr.on("data", (b) => (logs += b));
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/login")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Test server did not start: " + logs);
});
after(async () => {
  if (server) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
});
test("anonymous, invalid and unverified sessions have no classroom access", async () => {
  assert.equal((await request(null)).status, 401);
  assert.equal((await request("unknown@example.com")).status, 403);
  assert.equal(
    (
      await request(teacher, null, null, {
        headers: { Cookie: `${cookieName}=tampered` },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request(teacher, null, null, {
        headers: { Cookie: await cookie(teacher, false) },
      })
    ).status,
    401,
  );
  const old = await fetch(base + "/api/submissions", {
    method: "POST",
    body: "{}",
  });
  assert.equal(old.status, 401);
});
test("teachers can register students; writes require same-origin JSON", async () => {
  assert.equal(
    (
      await request(
        teacher,
        "saveStudent",
        {},
        { headers: { Origin: "https://evil.example" } },
      )
    ).status,
    403,
  );
  for (const [email, name, grade] of [
    [student, "Milan", "6"],
    [other, "Yubin", "7"],
  ]) {
    const r = await request(teacher, "saveStudent", {
      email,
      name,
      division: "Junior",
      grade,
      active: true,
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    if (email === student) studentId = r.body.member.id;
  }
  const r = await request(teacher);
  assert.equal(r.body.students.length, 2);
  assert.equal(r.body.teachers.length, 3);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal(
    (
      await request(teacher, "saveStudent", {
        email: student,
        name: "Duplicate",
        division: "Junior",
        grade: "6",
        active: true,
      })
    ).status,
    400,
  );
});
test("student submission is server-graded and ownership cannot be spoofed", async () => {
  const data = JSON.parse(readFileSync("src/data/worksheet-homework.json"));
  const assignment = data.assignments[0];
  const q = data.questions.find((q) => q.id === assignment.questionIds[0]);
  submittedId = randomUUID();
  const body = {
    id: submittedId,
    assignmentId: assignment.id,
    student: "Yubin",
    email: other,
    studentId: "spoof",
    score: 999,
    answers: { [q.id]: q.answer },
    submittedAt: "2000-01-01",
  };
  const r = await request(student, "submit", body);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.attempt.student, "Milan");
  assert.equal(r.body.attempt.studentId, studentId);
  assert.equal(r.body.attempt.email, student);
  assert.equal(r.body.attempt.score, 1);
  assert.equal(r.body.attempt.total, 14);
  const retry = await request(student, "submit", { ...body, answers: {} });
  assert.equal(retry.body.attempt.score, 1);
  const wrongDivision = await request(student, "submit", {
    ...body,
    id: randomUUID(),
    assignmentId: "senior-cns-1",
    answers: {},
  });
  assert.equal(wrongDivision.status, 403);
});
test("student payloads contain only own data and cannot call teacher operations", async () => {
  const a = await request(student),
    b = await request(other),
    t = await request(teacher);
  assert.equal(a.body.attempts.length, 1);
  assert.deepEqual(a.body.students, []);
  assert.deepEqual(a.body.teachers, []);
  assert.equal(b.body.attempts.length, 0);
  assert.equal(t.body.attempts.length, 1);
  assert.ok(!JSON.stringify(b.body).includes("Milan"));
  for (const op of ["saveStudent", "saveTeacher"])
    assert.equal(
      (
        await request(student, op, {
          email: "evil@example.com",
          name: "Evil",
          active: true,
        })
      ).status,
      403,
    );
  assert.equal(
    (
      await request(other, "submit", {
        id: submittedId,
        assignmentId: "junior-cns-1",
        answers: {},
      })
    ).status,
    409,
  );
});
test("teacher pages refuse student access, pages contain no other student's result", async () => {
  for (const path of ["/students", "/teachers", "/question-bank"]) {
    const r = await fetch(base + path, {
      headers: { Cookie: await cookie(other) },
      redirect: "manual",
    });
    const html = await r.text();
    assert.ok(r.status === 307 || html.includes("NEXT_REDIRECT"), path);
    assert.ok(!html.includes("Milan"), path);
  }
  const r = await fetch(base + "/scores", {
    headers: { Cookie: await cookie(other) },
  });
  const html = await r.text();
  assert.ok(!html.includes("Milan"));
  assert.ok(!html.includes(submittedId));
  assert.ok(html.includes("Yubin"));
});
test("teacher can add a teacher; revocation invalidates existing student session", async () => {
  const add = await request(teacher, "saveTeacher", {
    email: "thirdteacher@example.com",
    name: "Third",
    active: true,
  });
  assert.equal(add.status, 200);
  assert.equal(
    (await request("thirdteacher@example.com")).body.students.length,
    2,
  );
  const member = (await request(student)).body.member;
  assert.equal(
    (await request(teacher, "saveStudent", { ...member, active: false }))
      .status,
    200,
  );
  assert.equal((await request(student)).status, 403);
  assert.equal(
    (
      await request(student, "submit", {
        id: randomUUID(),
        assignmentId: "junior-cns-1",
        answers: {},
      })
    ).status,
    403,
  );
  assert.equal((await request(teacher)).body.attempts.length, 1);
  // Restore for browser checks.
  await request(teacher, "saveStudent", { ...member, active: true });
});
test("browser flows", { skip: !process.env.ACSL_BROWSER_TEST }, async () => {
  const child = spawn(
    "python",
    [
      "tests/helpers/classroom-browser.py",
      base,
      await cookie(teacher),
      await cookie(student),
      await cookie(other),
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  child.stdout.on("data", (b) => (output += b));
  child.stderr.on("data", (b) => (output += b));
  const [code] = await once(child, "exit");
  assert.equal(code, 0, output);
  console.log(output.trim());
});

test("admin can open the dashboard and management pages without changing teacher permissions", async () => {
  const email = "stempiacomputer@gmail.com";
  const r = await request(email);
  assert.equal(r.status, 200);
  assert.equal(r.body.member.role, "admin");
  assert.ok(r.body.students.length >= 2);
  for (const path of [
    "/dashboard",
    "/students",
    "/teachers",
    "/question-bank",
  ]) {
    const response = await fetch(base + path, {
      headers: { Cookie: await cookie(email) },
      redirect: "manual",
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(!html.includes("NEXT_REDIRECT"), path);
    if (path === "/dashboard") assert.ok(html.includes("Admin Dashboard"));
  }
  assert.equal(
    (await request(teacher, "saveTeacher", { ...r.body.member, active: false }))
      .status,
    403,
  );
});
