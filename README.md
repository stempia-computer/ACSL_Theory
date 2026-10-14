# ACSL Theory

Next.js / TypeScript / Tailwind classroom for Stempia Computer Institute.

## Run

Use Node.js 22.18+ (Node.js 24 recommended).

```sh
npm ci
npm run dev
```

Google login and Google Sheets account storage are required for classroom pages. Copy `.env.local.example` to `.env.local` and follow [the Korean account setup guide](docs/login-setup.ko.md), also available at `/login-setup`. Keep all secret values out of Git. Unconfigured installations show setup instructions, never a mock signed-in account.

## Accounts and records

- Administrator: stempiacomputer@gmail.com. Re-running the updated Apps Script setup adds this administrator to existing sheets without resetting other accounts. The protected administrator cannot be edited or disabled through teacher management.
- Initial teachers: wonup2@gmail.com and seanlee611@gmail.com. Google must verify the login email.
- Students also supports bulk paste: name, grade, email (tab-separated or Markdown table), with a shared Division selected before preview. Existing emails are skipped; failed rows can be retried without overwriting accounts.
- Teachers register/edit students (name, email, division, grade), add/edit/disable teachers, and view all student attempts and wrong answers. Both initial teachers have equal management permissions. The last active teacher cannot be disabled.
- Students see only their own division assignments, saved scores and answer reviews. Ownership is a stable server-side student ID, never the name/email posted by the browser.
- Every data request checks the current account and active role in Sheets. Server routes grade answers independently; Apps Script rejects old anonymous writes, protects mutations with a lock, and deduplicates submission IDs.
- Apps Script version 2 creates account tabs without deleting old submission/solution tabs or changing the token. Update Code.gs, run setup and deploy a new version of the existing deployment. Google OAuth client setup is separate from Apps Script authorization.
- Prior anonymous records are retained in the sheet but not assigned to students automatically. The authenticated dashboard reads new account-based attempts only. No new student records/answers are stored in browser localStorage. Unsubmitted answers stay in the current tab until the server confirms storage.
- Sharing the Google spreadsheet is for teachers only, with view access. Account JSON columns should be changed through the app, not edited directly in Sheets.

## Pages

`/login`, `/dashboard`, `/dashboard/student`, `/students`, `/teachers`, `/assignments`, `/assignments/[id]`, `/scores`, `/question-bank`, `/login-setup`, `/google-sheets-setup`.

The current six homework assignments use the original Computer Number Systems worksheets, due October 16, 2026:

| Division | Part 1 | Part 2 |
| --- | --- | --- |
| Junior | 1–14 | 15–28 |
| Intermediate | 1–20 | 21–39 |
| Senior | 1–20 | 21–40 |

The teacher score matrix uses the latest submission per assignment. All attempts remain available. Students can review every answer, filter incorrect answers, open the original solutions and retry missed questions.

This is worksheet practice, not a secure exam: original question/solution images are public static assets. Teacher-only Question Bank editing remains a local-browser feature; student records and worksheet attempts are shared through Sheets. Sheets is intended for small classes, with Apps Script usage limits and increasing latency as records grow. Login requires a Google account, including a compatible school account.

Localhost works only on the computer running the server. A public HTTPS deployment, matching Google redirect URI, and server-side secrets are still required for students at home. Never distribute server secrets to student computers.

## Checks

```sh
npm run lint
npm run build
node --experimental-strip-types --test tests/worksheet-grading.test.mjs tests/google-sheets.test.mjs tests/student-import.test.mjs
node --test tests/classroom-api.test.mjs
```

Optional browser coverage (Python Playwright and `/usr/bin/chromium` required): `ACSL_BROWSER_TEST=1 node --test tests/classroom-api.test.mjs`.

The API integration suite runs a built production server with synthetic signed sessions and an in-memory Apps Script fixture. It exercises actual Next.js authorization and rendering without contacting Google. It is not a live OAuth or Sheets test; complete the real-account checks in the setup guide before classroom use.
