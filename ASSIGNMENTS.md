# Teacher-assigned homework

Teachers open **Assignments → Create assignment**, choose a division and problem
set title, choose All / First half / Second half, enter a due date, and select
students. Odd-sized worksheets put the extra question in the first half.
Late submissions are accepted; the due date is informational in this version.

The catalog includes 21 newly imported worksheets (579 questions), three legacy
Computer Number Systems worksheets (107 questions), and 114 contest packets
(980 questions). Legacy Senior CNS is retained for existing assignments; the
new Senior Chapter 1 is the supplied 40-question revision. No Classroom
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

## Imported worksheets (November 2026)

Teachers can browse PDFs in **Question Bank → Worksheet library** and assign
them in **Assignments**. Regex selection questions use checkboxes; contest
questions use radio choices. Other exercises accept text answers. The source
question number and PDF page remain available when displayed numbering differs.

453 of the 579 new questions have automatic grading rules. 126 currently require
teacher review: drawings, expressions without a verified equivalent-answer rule,
or an unverified/missing extracted key. They are **not fully auto-graded yet**.
An answered review question is pending, not wrong; blank responses receive zero.
Scores remain provisional while any answers are pending. Teachers open **Scores
→ Review answers**, inspect the original solution, and choose **Mark correct** or
**Mark incorrect**. The decision, teacher identity and timestamp are persisted;
students cannot perform this operation. Existing score and question-detail tabs
are updated as well.

### Source discrepancies retained explicitly

- `12_AssemblyLanguage_IN.pdf` and its solution say Senior inside and match the
  Senior files. They remain under the supplied Intermediate label with a visible
  notice; no different Intermediate questions were invented.
- Senior Branch/Strings repeats labels 4, 8 and 12 at the end. They have distinct
  internal IDs and displayed positions 13–15; the original labels remain in hints.
- Senior Lisp #10 is missing from the solution PDF; its key 22 was calculated
  directly as 6 + 9 + 3 + 4. Senior Graph Theory #32 has no supplied solution and
  remains pending review.
- Boolean overbars and superscripts can disappear in PDF text extraction.
  Unverified expressions are deliberately not treated as flat strings.

Import is reproducible with PyMuPDF: `python scripts/import-worksheet-pdfs.py
/path/to/pdf-paths.json` (a JSON array of local PDF paths). Reviewed rules live in
`scripts/worksheet-import/verified-keys.json`. Source hashes are retained in the
manifest. Never derive arbitrary grading keys from PDF instructions.

| Division | Chapter | Questions | Automatic | Teacher review |
|---|---:|---:|---:|---:|
| Intermediate | 4 | 32 | 16 | 16 |
| Intermediate | 5 | 30 | 30 | 0 |
| Intermediate | 6 | 19 | 19 | 0 |
| Intermediate | 7 | 41 | 20 | 21 |
| Intermediate | 8 | 32 | 32 | 0 |
| Intermediate | 9 | 10 | 9 | 1 |
| Intermediate | 10 | 32 | 22 | 10 |
| Intermediate | 11 | 43 | 22 | 21 |
| Intermediate | 12 | 5 | 5 | 0 |
| Senior | 1 | 40 | 39 | 1 |
| Senior | 2 | 30 | 29 | 1 |
| Senior | 3 | 15 | 15 | 0 |
| Senior | 4 | 32 | 17 | 15 |
| Senior | 5 | 35 | 35 | 0 |
| Senior | 6 | 20 | 20 | 0 |
| Senior | 7 | 41 | 20 | 21 |
| Senior | 8 | 10 | 8 | 2 |
| Senior | 9 | 32 | 32 | 0 |
| Senior | 10 | 32 | 26 | 6 |
| Senior | 11 | 43 | 32 | 11 |
| Senior | 12 | 5 | 5 | 0 |
