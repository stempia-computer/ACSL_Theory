import test from "node:test";
import assert from "node:assert/strict";
import { parseStudents } from "../src/lib/student-import.ts";
test("paste Markdown table with bold names, separator and escaped email dot", () => {
  const rows = parseStudents(
    "| **Example One** | 9 | example\\.one@gmail.com |\n| --- | -: | --- |\n| **Example Two** | 10 | TWO@EXAMPLE.COM |",
    "Junior",
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    name: "Example One",
    grade: "9",
    email: "example.one@gmail.com",
    division: "Junior",
    active: true,
  });
  assert.equal(rows[1].email, "two@example.com");
});
test("tab-separated pasted rows and optional headers", () => {
  assert.equal(
    parseStudents(
      "Name\tGrade\tEmail\r\nSample\t11\tsample@example.com",
      "Senior",
    )[0].division,
    "Senior",
  );
});
test("reject empty, invalid, duplicate or oversized imports without partial parsing", () => {
  for (const text of [
    "",
    "Sample\t13\tsample@example.com",
    "Sample\t9\tbad",
    "Sample\t9\tx@example.com\nOther\t10\tX@example.com",
    "Sample\t9\tx@example.com\textra",
    Array.from(
      { length: 101 },
      (_, i) => `Person ${i}\t9\tperson${i}@example.com`,
    ).join("\n"),
  ])
    assert.throws(() => parseStudents(text, "Junior"));
  assert.throws(() => parseStudents("Sample\t9\tx@example.com", "Unspecified"));
});
