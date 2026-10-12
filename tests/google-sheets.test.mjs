import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
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

function receiver() {
  const sheets = new Map();
  const props = new Map([
    ["ACSL_SHEETS_TOKEN", "test-token-".repeat(4)],
    ["SPREADSHEET_ID", "test-sheet"],
  ]);
  let failSummary = false,
    locked = false,
    available = true;
  class Sheet {
    constructor(name) {
      this.name = name;
      this.rows = [];
    }
    getLastRow() {
      return this.rows.length;
    }
    setFrozenRows() {}
    getRange(row, col, height, width) {
      const range = {
        getValues: () =>
          Array.from({ length: height }, (_, r) =>
            Array.from(
              { length: width },
              (_, c) => this.rows[row + r - 1]?.[col + c - 1] ?? "",
            ),
          ),
        setValues: (values) => {
          if (failSummary && this.name === "제출 기록" && row > 1) {
            failSummary = false;
            throw new Error("Temporary sheet failure");
          }
          values.forEach((r, ri) => {
            this.rows[row + ri - 1] ??= [];
            r.forEach((v, ci) => (this.rows[row + ri - 1][col + ci - 1] = v));
          });
          return range;
        },
        setFontWeight: () => range,
        setNumberFormat: () => range,
      };
      return range;
    }
  }
  const book = {
    getId: () => "test-sheet",
    getSheetByName: (name) => sheets.get(name),
    insertSheet: (name) => {
      const s = new Sheet(name);
      sheets.set(name, s);
      return s;
    },
  };
  const context = vm.createContext({
    SpreadsheetApp: {
      getActiveSpreadsheet: () => book,
      openById: () => book,
      flush() {},
      getUi: () => ({ alert() {}, ButtonSet: { OK: "ok" } }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => props.get(k),
        setProperty: (k, v) => props.set(k, v),
      }),
    },
    Utilities: { getUuid: () => "fake-uuid" },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          locked = available;
          return available;
        },
        hasLock: () => locked,
        releaseLock: () => {
          locked = false;
        },
      }),
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({ setMimeType: () => text }),
    },
  });
  vm.runInContext(
    readFileSync(
      new URL("../public/setup/acsl-google-sheets.gs", import.meta.url),
      "utf8",
    ),
    context,
  );
  context.setup();
  return {
    sheets,
    context,
    post: (submission, token = props.get("ACSL_SHEETS_TOKEN")) =>
      JSON.parse(
        context.doPost({
          postData: { contents: JSON.stringify({ token, submission }) },
        }),
      ),
    failNextSummary: () => {
      failSummary = true;
    },
    block: () => {
      available = false;
    },
    locked: () => locked,
  };
}
test("Apps Script authenticates, appends summary/details, deduplicates and preserves setup data", () => {
  const r = receiver();
  assert.equal(r.post(prepared(), "wrong-token").ok, false);
  assert.equal(r.sheets.get("제출 기록").rows.length, 1);
  assert.equal(r.post(prepared()).ok, true);
  assert.equal(r.locked(), false);
  assert.equal(r.sheets.get("제출 기록").rows.length, 2);
  assert.equal(r.sheets.get("문제별 결과").rows.length, 15);
  assert.equal(r.post(prepared()).duplicate, true);
  assert.equal(r.sheets.get("문제별 결과").rows.length, 15);
  r.context.setup();
  assert.equal(r.sheets.get("제출 기록").rows.length, 2);
});
test("Apps Script resumes a partial write without duplicated question rows", () => {
  const r = receiver();
  r.failNextSummary();
  assert.equal(r.post(prepared()).ok, false);
  assert.equal(r.sheets.get("문제별 결과").rows.length, 15);
  assert.equal(r.sheets.get("제출 기록").rows.length, 1);
  assert.equal(r.post(prepared()).ok, true);
  assert.equal(r.sheets.get("문제별 결과").rows.length, 15);
  assert.equal(r.sheets.get("제출 기록").rows.length, 2);
});
test("Apps Script escapes spreadsheet formulas and reports lock failure", () => {
  const r = receiver();
  const submission = prepared();
  submission.student = '=HYPERLINK("https://example.test")';
  submission.results[0].answer = "+1";
  assert.equal(r.post(submission).ok, true);
  assert.ok(r.sheets.get("제출 기록").rows[1][3].startsWith("'="));
  assert.equal(r.sheets.get("문제별 결과").rows[1][5], "'+1");
  r.block();
  assert.equal(
    r.post({ ...submission, id: "22222222-2222-4222-8222-222222222222" }).ok,
    false,
  );
});
