import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { receiver } from "./helpers/apps-script.mjs";
const email = "otp.student@example.com",
  teacher = "wonup2@gmail.com";
function setup() {
  const r = receiver();
  r.request(teacher, "saveStudent", {
    name: "OTP Student",
    email,
    division: "Junior",
    grade: "9",
    active: true,
  });
  return r;
}
function challenge() {
  const id = randomUUID(),
    code = "026314";
  return {
    challenge: id,
    code,
    digest: createHmac("sha256", "fixture")
      .update(id + code)
      .digest("hex"),
  };
}
test("registered mailbox receives code; digest kept private; verify consumes once", () => {
  const r = setup(),
    c = challenge();
  assert.equal(r.request(email, "otpRequest", c).ok, true);
  assert.equal(r.messages.length, 1);
  assert.equal(r.messages[0].to, email);
  assert.ok(r.messages[0].body.includes(c.code));
  const state = JSON.parse(r.props.get("OTP:" + email));
  assert.equal(state.code, undefined);
  assert.equal(state.digest, c.digest);
  const result = r.request(email, "otpVerify", c);
  assert.equal(result.data.member.email, email);
  assert.equal(r.request(email, "otpVerify", c).ok, false);
  assert.ok(!JSON.stringify(r.request(teacher, "load")).includes(c.digest));
});
test("unknown/disabled emails and throttled requests receive same acknowledgement", () => {
  const r = setup(),
    c = challenge();
  const accepted = r.request(email, "otpRequest", c);
  assert.deepEqual(
    r.request("absent@example.com", "otpRequest", challenge()),
    accepted,
  );
  assert.deepEqual(r.request(email, "otpRequest", challenge()), accepted);
  assert.equal(r.messages.length, 1);
  const member = r.request(email, "load").data.member;
  r.request(teacher, "saveStudent", { ...member, active: false });
  assert.deepEqual(r.request(email, "otpRequest", challenge()), accepted);
  assert.equal(r.request(email, "otpVerify", c).ok, false);
  assert.equal(r.props.has("OTP:absent@example.com"), false);
});
test("expires after ten minutes, limits five failed guesses including invalid challenge", () => {
  const r = setup(),
    c = challenge();
  r.request(email, "otpRequest", c);
  r.advance(600001);
  assert.equal(r.request(email, "otpVerify", c).ok, false);
  const next = challenge();
  r.request(email, "otpRequest", next);
  for (let i = 0; i < 5; i++)
    assert.equal(
      r.request(email, "otpVerify", { ...next, challenge: randomUUID() }).ok,
      false,
    );
  assert.equal(r.request(email, "otpVerify", next).ok, false);
});
test("resends replace old codes, five sends per hour, no sends on mailbox failure or quota exhaustion", () => {
  const r = setup(),
    first = challenge();
  r.request(email, "otpRequest", first);
  r.advance(60001);
  const second = challenge();
  r.request(email, "otpRequest", second);
  assert.equal(r.request(email, "otpVerify", first).ok, false);
  assert.equal(r.request(email, "otpVerify", second).ok, true);
  for (let i = 0; i < 5; i++) {
    r.advance(60001);
    r.request(email, "otpRequest", challenge());
  }
  assert.equal(r.messages.length, 5);
  r.advance(3600001);
  r.setQuota(0);
  r.request(email, "otpRequest", challenge());
  assert.equal(r.messages.length, 5);
  r.setQuota(10);
  r.failMail();
  const failed = challenge();
  r.request(email, "otpRequest", failed);
  assert.equal(r.request(email, "otpVerify", failed).ok, false);
});
test("tokens, cross-account challenges and payload validation cannot bypass OTP", () => {
  const r = setup(),
    c = challenge();
  assert.equal(r.request(email, "otpRequest", c, "bad").ok, false);
  assert.equal(r.messages.length, 0);
  r.request(email, "otpRequest", c);
  assert.equal(r.request(teacher, "otpVerify", c).ok, false);
  assert.equal(
    r.request(email, "otpVerify", { ...c, digest: "0".repeat(64) }).ok,
    false,
  );
  assert.equal(r.request(email, "otpRequest", { ...c, code: "abc" }).ok, false);
});
