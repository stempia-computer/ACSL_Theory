import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { gradeAnswer } from "../src/lib/worksheet-grading.ts";
const data = JSON.parse(
  readFileSync(new URL("../src/data/worksheet-homework.json", import.meta.url)),
);
const question = (id) => data.questions.find((q) => q.id === id);

test("107 original questions belong to exactly six complete, disjoint assignments", () => {
  assert.equal(data.questions.length, 107);
  assert.equal(data.assignments.length, 6);
  const ids = data.assignments.flatMap((a) => a.questionIds);
  assert.equal(ids.length, 107);
  assert.equal(new Set(ids).size, 107);
  for (const q of data.questions) {
    assert.ok(ids.includes(q.id));
    assert.ok(
      existsSync(new URL("../public" + q.questionImage.src, import.meta.url)),
    );
    assert.ok(
      existsSync(new URL("../public" + q.solutionImage.src, import.meta.url)),
    );
    assert.ok(gradeAnswer(q, q.answer), q.id);
    assert.equal(gradeAnswer(q, ""), false, q.id);
    assert.equal(gradeAnswer(q, "not an answer"), false, q.id);
  }
});
test("base answers tolerate case, spacing, leading zeros, and explicit base notation", () => {
  const q = question("junior-cns-02");
  for (const a of ["4ce", " 4CE ", "004CE", "4CE_16", "4CE(16)"])
    assert.ok(gradeAnswer(q, a), a);
  for (const a of ["4CE16", "1230", "4CF", "4CE_8"])
    assert.equal(gradeAnswer(q, a), false, a);
  assert.equal(gradeAnswer(question("junior-cns-01"), "10001001112"), false);
});
test("unordered answers require all answers, while ordered answers preserve order", () => {
  assert.ok(gradeAnswer(question("junior-cns-03"), "d, b and c"));
  assert.equal(gradeAnswer(question("junior-cns-03"), "B,C"), false);
  assert.equal(gradeAnswer(question("junior-cns-03"), "B,B,C,D"), false);
  assert.ok(gradeAnswer(question("junior-cns-10"), "d a c b"));
  assert.equal(gradeAnswer(question("junior-cns-10"), "a b c d"), false);
  assert.ok(gradeAnswer(question("junior-cns-05"), "11101101,A"));
  assert.equal(gradeAnswer(question("junior-cns-05"), "A,11101101"), false);
});
test("exact fractions and equivalent decimals, no rounding and no evaluation", () => {
  const q = question("intermediate-cns-09");
  for (const a of ["29/128", "58/256", "0.2265625", ".226562500"])
    assert.ok(gradeAnswer(q, a), a);
  for (const a of ["0.23", "29/0", "1+1", "29/128/1", "0.2265625001"])
    assert.equal(gradeAnswer(q, a), false, a);
});
test("letter aliases, roots, and direction answers follow source solutions", () => {
  assert.ok(gradeAnswer(question("intermediate-cns-19"), "133337"));
  assert.ok(gradeAnswer(question("senior-cns-13"), "4b,A"));
  assert.equal(gradeAnswer(question("senior-cns-13"), "A"), false);
  assert.ok(gradeAnswer(question("senior-cns-32"), "-1,8"));
  assert.ok(gradeAnswer(question("senior-cns-30"), "32 n"));
  assert.equal(gradeAnswer(question("senior-cns-30"), "32 S"), false);
});
