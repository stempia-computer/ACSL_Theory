// Test-process-only transport fixture. Never imported by application code.
import { writeFileSync } from "node:fs";
import { receiver } from "./apps-script.mjs";
const fixture = receiver();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (
    String(url) ===
    "https://script.google.com/macros/s/ACSL_TEST_ONLY_0123456789/exec"
  ) {
    const body = JSON.parse(options.body);
    const result = fixture.request(
      body.actor,
      body.action,
      body.data,
      body.token,
    );
    if (process.env.ACSL_TEST_MAILBOX_FILE)
      writeFileSync(
        process.env.ACSL_TEST_MAILBOX_FILE,
        JSON.stringify(fixture.messages),
        { mode: 0o600 },
      );
    return Response.json(result);
  }
  return originalFetch(url, options);
};
