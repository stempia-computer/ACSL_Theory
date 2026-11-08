# Teacher-assigned homework

Teachers open **Assignments → Create assignment**, choose a division and problem
set title, choose All / First half / Second half, enter a due date, and select
students. Odd-sized worksheets put the extra question in the first half.
Late submissions are accepted; the due date is informational in this version.

The catalog uses the actual imported data: three Computer Number Systems
worksheets (107 questions) and 114 contest packets (980 questions). No Classroom
worksheet is invented when the source material is not available. New PDFs and
their answer keys supplied in chat must be imported and checked before joining
this catalog. The browser-only custom-question demo is not included.

Assigned homework is stored in the **배정 과제** spreadsheet tab. Each assignment
has explicit student IDs; students receive only their own assignments. Worksheet
short answers reuse the existing grading rules. Contest answers use radio
choices, server-side grading, and the existing attempt/score/review storage.
Legacy worksheet assignments and their historical results remain available.
Question ranges are fixed once assigned. One point is awarded per correct answer.

## Activate this update

1. Replace Code.gs in the existing bound Apps Script project with
   `public/setup/acsl-google-sheets.gs`. Preserve the existing Script Properties.
2. Deploy → Manage deployments → Edit → New version → Deploy. Keep the existing
   deployment URL. The new assignment tab is created automatically on use.
3. Pull this commit, run `npm ci`, `npm run build:cloudflare`, then
   `npm run deploy:cloudflare` from the already authenticated machine.
4. Check one teacher-created assignment using a registered test student and
   confirm its result in Scores and Google Sheets.

Before the Apps Script upgrade, the builder displays an upgrade message instead
of silently storing assignments only in a browser. No repeated script editing
is needed when teachers create further assignments.
