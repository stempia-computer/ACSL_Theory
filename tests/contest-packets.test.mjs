import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const packets = JSON.parse(readFileSync("src/data/contest-packets.json", "utf8"));

test("contest archive has unique complete packet and question identities", () => {
  assert.equal(packets.length, 114);
  assert.equal(new Set(packets.map((packet) => packet.id)).size, 114);
  assert.equal(packets.reduce((total, packet) => total + packet.questions.length, 0), 980);
  for (const packet of packets) {
    assert.ok(existsSync(`public${packet.problemPdf}`), packet.problemPdf);
    if (packet.solutionPdf) assert.ok(existsSync(`public${packet.solutionPdf}`), packet.solutionPdf);
    assert.equal(new Set(packet.questions.map((question) => question.number)).size, packet.questions.length);
    assert.deepEqual(packet.questions.map((question) => question.number), Array.from({ length: packet.questions.length }, (_, index) => index + 1));
  }
});

test("all supplied answers are A-E and every packet is graded", () => {
  const ungraded = packets.filter((packet) => packet.questions.some((question) => !question.correctAnswer));
  assert.deepEqual(ungraded, []);
  for (const packet of packets) {
    assert.ok(packet.solutionPdf);
    for (const question of packet.questions) assert.match(question.correctAnswer, /^[A-E]$/);
  }
});
