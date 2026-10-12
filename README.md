# ACSL Theory

A Next.js web app for Stempia Computer Institute, using TypeScript, Tailwind CSS, and the App Router.

## Development

Use Node.js 20.9 or later and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 to view the home page. Edit `src/app/page.tsx` to update it.

## Validation and production

```sh
npm run lint
npx tsc --noEmit
npm run build
npm start
```

Local practice requires no environment variables. Optional Google Sheets score sharing uses server-only settings in `.env.local.example`; follow [the Korean setup guide](docs/google-sheets-setup.ko.md) or open `/google-sheets-setup`. Never commit `.env.local` or share its token.

## Pages

- `/`: Home
- `/dashboard`: Teacher Dashboard
- `/dashboard/student`: Student Dashboard with worksheet progress and attempt history
- `/assignments`: Six Computer Number Systems homework assignments
- `/assignments/[id]`: Original worksheet images, answer entry, scoring, and review
- `/question-bank`: Question Bank with search, metadata filters, details, and a four-choice question editor
- `/students`: Students
- `/scores`: Scores

Classroom records are static mock data in `src/lib/mock-data.ts`. Question types, validation, and illustrative samples are in `src/lib/questions.ts`. Question Bank additions and edits are stored in browser localStorage; they are not shared between users or devices. Source PDF is an optional HTTPS link, not a file upload. The student roster remains a demonstration. No authentication or shared database is connected.

## Worksheet homework

The uploaded Computer Number Systems worksheets are available as six assignments, due October 16, 2026:

| Division     | Part 1 | Part 2 |
| ------------ | ------ | ------ |
| Junior       | 1–14   | 15–28  |
| Intermediate | 1–20   | 21–39  |
| Senior       | 1–20   | 21–40  |

Students enter a name, open an assignment, type answers, and submit for immediate grading. Unanswered questions require confirmation before submission. Results include the original solution images, an incorrect-only review filter, and repeat attempts. Drafts and attempts are stored under the entered name in localStorage (`acsl-worksheet-homework-v1`). Names are not authenticated accounts. All previous attempts are retained and may be reopened from Scores. JSON exports include submitted answers and scores.

Images in `public/worksheets` preserve original notation. Question metadata and the supplied solution keys are in `src/data/worksheet-homework.json`. One point per question; all parts of a multi-answer question must be correct. Hexadecimal case and insignificant whitespace are ignored. Explicit `_base` / `(base)` suffixes and leading zeros are accepted for numeric answers; bare suffix digits remain significant. Unordered answers are compared as complete sets; ordered responses retain their order. Fraction answers use exact rational comparison. Source solution keys are used, including both roots for Senior question 32.

The JSON keys and solution images are bundled with this practice app; this is not a secured exam. Drafts and review history remain local to the current browser. When Google Sheets is configured, submissions are regraded on the server and sent to the shared teacher score sheet. Failed and older submissions can be retried without duplicate rows. Google Sheets does not sync student review history across devices. A local development server is not a publicly accessible classroom site.

Run grading regression checks with Node.js 22.18+ (or Node.js 24):

```sh
node --experimental-strip-types --test tests/worksheet-grading.test.mjs tests/google-sheets.test.mjs
```
