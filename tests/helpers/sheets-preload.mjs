// Test-process-only transport fixture. Never imported by application code.
import { receiver } from "./apps-script.mjs";
const fixture = receiver();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (
    String(url) ===
    "https://script.google.com/macros/s/ACSL_TEST_ONLY_0123456789/exec"
  ) {
    const body = JSON.parse(options.body);
    return Response.json(
      fixture.request(body.actor, body.action, body.data, body.token),
    );
  }
  return originalFetch(url, options);
};
