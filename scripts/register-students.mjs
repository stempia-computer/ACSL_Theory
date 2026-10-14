// Run only on a trusted server with its existing Sheets token. Never commit real rosters.
import { readFileSync } from "node:fs";
import { callGoogleSheets } from "../src/lib/google-sheets-transport.ts";
const [file] = process.argv.slice(2);
if (!file)
  throw new Error(
    "Usage: node --experimental-strip-types scripts/register-students.mjs /private/roster.json",
  );
const url = process.env.ACSL_SHEETS_WEBHOOK_URL,
  token = process.env.ACSL_SHEETS_TOKEN;
if (
  !url ||
  !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(
    url,
  ) ||
  !token ||
  token.length < 32
)
  throw new Error(
    "Set the existing Sheets URL and token securely in the environment.",
  );
const roster = JSON.parse(readFileSync(file, "utf8"));
if (
  !Array.isArray(roster) ||
  !roster.length ||
  roster.length > 100 ||
  new Set(roster.map((x) => x.email)).size !== roster.length
)
  throw new Error("Invalid roster");
for (const s of roster)
  if (
    !s ||
    typeof s.name !== "string" ||
    !s.name.trim() ||
    s.name.length > 80 ||
    typeof s.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email) ||
    !["Junior", "Intermediate", "Senior"].includes(s.division) ||
    !/^(K|[1-9]|1[0-2])$/.test(s.grade)
  )
    throw new Error("Invalid student");
async function call(action, data = {}) {
  const r = await callGoogleSheets(url, token, {
    version: 2,
    actor: "stempiacomputer@gmail.com",
    action,
    data,
  });
  if (r.ok !== true || r.version !== 2)
    throw new Error(`Sheets operation failed: ${r.code || "unknown"}`);
  return r.data;
}
const before = await call("load");
if (before.member.role !== "admin") throw new Error("Admin access required");
if (roster.some((s) => before.teachers.some((t) => t.email === s.email)))
  throw new Error("Roster conflicts with a staff account");
let added = 0,
  updated = 0;
for (const s of roster) {
  const existing = before.students.find((m) => m.email === s.email);
  await call("saveStudent", { ...s, id: existing?.id, active: true });
  if (existing) updated++;
  else added++;
}
const after = await call("load");
for (const s of roster) {
  const actual = after.students.filter((m) => m.email === s.email);
  if (
    actual.length !== 1 ||
    actual[0].name !== s.name ||
    actual[0].grade !== s.grade ||
    actual[0].division !== s.division ||
    !actual[0].active
  )
    throw new Error("Verification failed; no completion claimed");
}
console.log(
  `Verified ${roster.length} students: ${added} added, ${updated} updated.`,
);
