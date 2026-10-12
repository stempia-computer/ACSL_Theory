"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  assignmentQuestions,
  worksheetAssignments,
  type WorksheetAssignment,
} from "@/lib/worksheet-data";
import { gradeAnswer } from "@/lib/worksheet-grading";
import {
  draftKey,
  exportResults,
  studentKey,
  updateHomework,
  useHomework,
} from "@/lib/worksheet-store";

const button =
  "inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50";
const secondary =
  "inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
const input =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2";

function StudentIdentity() {
  const { state, ready, warning } = useHomework();
  const [editing, setEditing] = useState(false);
  return (
    <section
      className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5"
      aria-label="Student identity"
    >
      {!state.student || editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(
              new FormData(event.currentTarget).get("student") || "",
            ).trim();
            if (name) {
              updateHomework((s) => ({ ...s, student: name }));
              setEditing(false);
            }
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="text-sm font-medium">
            Student name
            <input
              name="student"
              aria-label="Student name"
              defaultValue={state.student}
              required
              maxLength={80}
              pattern=".*\S.*"
              className={input}
              disabled={!ready}
            />
          </label>
          <button className={button} disabled={!ready}>
            Use this name
          </button>
          {state.student && (
            <button
              type="button"
              className={secondary}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          )}
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            Working as <strong>{state.student}</strong>
          </p>
          <button className={secondary} onClick={() => setEditing(true)}>
            Change student
          </button>
        </div>
      )}
      <p className="mt-3 text-sm text-slate-600">
        Drafts and results are saved in this browser under this name. Use the
        same name to return to your work. Results are not sent to your teacher
        automatically.
      </p>
      {warning && (
        <p role="alert" className="mt-3 text-sm font-semibold text-amber-800">
          {warning}
        </p>
      )}
    </section>
  );
}

export function HomeworkList({ scoresOnly = false }: { scoresOnly?: boolean }) {
  const { state, ready } = useHomework();
  const [division, setDivision] = useState("all");
  const attempts = state.attempts.filter(
    (a) => studentKey(a.student) === studentKey(state.student),
  );
  return (
    <>
      <StudentIdentity />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <label className="text-sm font-medium">
          Division
          <select
            aria-label="Division"
            className={input}
            value={division}
            onChange={(e) => setDivision(e.target.value)}
          >
            <option value="all">All divisions</option>
            {["junior", "intermediate", "senior"].map((d) => (
              <option key={d} value={d}>
                {d[0].toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <button
          className={secondary}
          disabled={!attempts.length}
          onClick={() => exportResults(state.student, attempts)}
        >
          Export my results
        </button>
      </div>
      <p className="mb-6 text-sm text-slate-600">
        Computer Number Systems · Both parts due Friday, October 16, 2026. Each
        question is worth 1 point. Submit to see your score and solutions.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        {worksheetAssignments
          .filter((a) => division === "all" || a.division === division)
          .map((assignment) => {
            const records = attempts.filter(
              (a) => a.assignmentId === assignment.id,
            );
            const latest = records.at(-1);
            const questions = assignmentQuestions(assignment);
            const score = latest
              ? questions.filter((q) =>
                  gradeAnswer(q, latest.answers[q.id] || ""),
                ).length
              : null;
            return (
              <article
                key={assignment.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h2 className="text-lg font-semibold">{assignment.title}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Original questions {assignment.first}–{assignment.last} ·{" "}
                  {questions.length} questions
                </p>
                <p className="my-4 font-medium">
                  {latest
                    ? `Latest score: ${score}/${questions.length} (${Math.round((score! / questions.length) * 100)}%) · ${records.length} attempt(s)`
                    : "Not submitted"}
                </p>
                <Link href={`/assignments/${assignment.id}`} className={button}>
                  {latest ? "Review / try again" : "Open homework"}
                </Link>
              </article>
            );
          })}
      </div>
      {scoresOnly && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Submission history</h2>
          {!attempts.length && (
            <p className="text-slate-500">
              No submissions yet. Complete a worksheet to see your results here.
            </p>
          )}
          <ul className="space-y-3">
            {[...attempts].reverse().map((a) => {
              const assignment = worksheetAssignments.find(
                (x) => x.id === a.assignmentId,
              );
              if (!assignment) return null;
              const qs = assignmentQuestions(assignment);
              const score = qs.filter((q) =>
                gradeAnswer(q, a.answers[q.id] || ""),
              ).length;
              return (
                <li
                  key={a.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <Link
                    href={`/assignments/${a.assignmentId}?attempt=${a.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    {assignment.title} · {score}/{qs.length}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {ready ? new Date(a.submittedAt).toLocaleString() : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

export function WorksheetHomework({
  assignment,
}: {
  assignment: WorksheetAssignment;
}) {
  const homework = useHomework();
  const requestedAttempt = useSearchParams().get("attempt");
  // Remount the exercise when changing students so drafts and review state never cross names.
  return (
    <>
      <StudentIdentity />
      {homework.ready && homework.state.student ? (
        <Exercise
          key={`${assignment.id}:${studentKey(homework.state.student)}:${requestedAttempt || "latest"}`}
          initialAttempt={requestedAttempt}
          assignment={assignment}
        />
      ) : (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500">
          Enter your name above to start this worksheet.
        </p>
      )}
    </>
  );
}

function Exercise({
  assignment,
  initialAttempt,
}: {
  assignment: WorksheetAssignment;
  initialAttempt: string | null;
}) {
  const { state } = useHomework();
  const questions = assignmentQuestions(assignment);
  const key = draftKey(state.student, assignment.id);
  const records = state.attempts.filter(
    (a) =>
      a.assignmentId === assignment.id &&
      studentKey(a.student) === studentKey(state.student),
  );
  const [chosenId, setChosenId] = useState<string | null>(initialAttempt);
  const [working, setWorking] = useState(
    () => !initialAttempt && (!!state.drafts[key] || !records.length),
  );
  const [wrongOnly, setWrongOnly] = useState(false);
  const [confirmBlank, setConfirmBlank] = useState(false);
  const [message, setMessage] = useState("");
  const selected = records.find((a) => a.id === chosenId) || records.at(-1);
  const review = !working && selected;
  const answers = review ? selected.answers : state.drafts[key] || {};
  const answered = questions.filter((q) => answers[q.id]?.trim()).length;
  const score = questions.filter((q) =>
    gradeAnswer(q, answers[q.id] || ""),
  ).length;
  const visible =
    review && wrongOnly
      ? questions.filter((q) => !gradeAnswer(q, answers[q.id] || ""))
      : questions;
  function submit() {
    if (answered < questions.length && !confirmBlank) {
      setConfirmBlank(true);
      return;
    }
    const attempt = {
      id: crypto.randomUUID(),
      assignmentId: assignment.id,
      student: state.student,
      submittedAt: new Date().toISOString(),
      answers: { ...answers },
    };
    updateHomework((s) => {
      const drafts = { ...s.drafts };
      delete drafts[key];
      return { ...s, drafts, attempts: [...s.attempts, attempt] };
    });
    setChosenId(attempt.id);
    setWorking(false);
    setConfirmBlank(false);
    setWrongOnly(false);
    setMessage("Submitted. Your score and solutions are ready below.");
    document
      .getElementById("worksheet-summary")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  function retry(onlyWrong: boolean) {
    const draft: Record<string, string> = {};
    if (onlyWrong)
      questions.forEach((q) => {
        if (gradeAnswer(q, answers[q.id] || "")) draft[q.id] = answers[q.id];
      });
    updateHomework((s) => ({ ...s, drafts: { ...s.drafts, [key]: draft } }));
    setWorking(true);
    setWrongOnly(false);
    setConfirmBlank(false);
    setMessage("New attempt started. Earlier results are preserved.");
  }
  return (
    <div className="space-y-6">
      <section
        id="worksheet-summary"
        className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <p className="text-sm text-slate-500">
          Questions {assignment.first}–{assignment.last} · Due Friday, October
          16, 2026
        </p>
        {review ? (
          <>
            <h2 className="mt-3 text-3xl font-bold">
              Score: {score}/{questions.length}{" "}
              <span className="text-xl text-indigo-600">
                ({Math.round((score / questions.length) * 100)}%)
              </span>
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Submitted {new Date(selected.submittedAt).toLocaleString()} ·{" "}
              {questions.length - score} to review
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className={button} onClick={() => retry(true)}>
                Retry incorrect questions
              </button>
              <button className={secondary} onClick={() => retry(false)}>
                Start a fresh attempt
              </button>
              <button
                className={secondary}
                onClick={() => exportResults(state.student, [selected])}
              >
                Export this result
              </button>
            </div>
            <label className="mt-5 block text-sm">
              <input
                type="checkbox"
                className="mr-2"
                checked={wrongOnly}
                onChange={(e) => setWrongOnly(e.target.checked)}
              />
              Show incorrect questions only
            </label>
            <label className="mt-4 block text-sm">
              Review attempt
              <select
                aria-label="Review attempt"
                className={input}
                value={selected.id}
                onChange={(e) => {
                  setChosenId(e.target.value);
                  setWrongOnly(false);
                }}
              >
                {records.map((a, i) => (
                  <option key={a.id} value={a.id}>
                    Attempt {i + 1} · {new Date(a.submittedAt).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <h2 className="mt-3 text-xl font-semibold">
              {answered}/{questions.length} answered
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter answers below each original question. For base conversions,
              type digits without the base subscript. Drafts save as you type.
            </p>
            <progress
              aria-label="Questions answered"
              value={answered}
              max={questions.length}
              className="mt-4 w-full accent-indigo-600"
            />
            {records.length > 0 && (
              <button
                className={`${secondary} mt-3`}
                onClick={() => {
                  setWorking(false);
                  setChosenId(records.at(-1)!.id);
                }}
              >
                Review previous result
              </button>
            )}
          </>
        )}
        <p role="status" className="mt-3 text-sm text-indigo-700">
          {message}
        </p>
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="space-y-6">
          {visible.map((q) => {
            const correct = gradeAnswer(q, answers[q.id] || "");
            return (
              <article
                key={q.id}
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Question {q.number}</h2>
                  {review && (
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
                    >
                      {correct
                        ? "Correct"
                        : answers[q.id]?.trim()
                          ? "Incorrect"
                          : "Unanswered"}
                    </span>
                  )}
                </div>
                <a
                  href={q.questionImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Enlarge question ${q.number}`}
                >
                  <Image
                    unoptimized
                    src={q.questionImage.src}
                    width={q.questionImage.width}
                    height={q.questionImage.height}
                    alt={`Original ${q.division} Computer Number Systems worksheet question ${q.number}. Open image to enlarge.`}
                    className="h-auto w-full"
                  />
                </a>
                {review ? (
                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <p className="break-words text-sm">
                      <strong>Your answer:</strong>{" "}
                      {answers[q.id]?.trim() || "Not answered"}
                    </p>
                    <p className="mt-2 text-sm">
                      <strong>Correct answer:</strong> {q.answer}
                    </p>
                    <details className="mt-4">
                      <summary className="cursor-pointer font-semibold text-indigo-700">
                        View explanation for question {q.number}
                      </summary>
                      <Image
                        unoptimized
                        src={q.solutionImage.src}
                        width={q.solutionImage.width}
                        height={q.solutionImage.height}
                        alt={`Original worked solution for question ${q.number}`}
                        className="mt-4 h-auto w-full"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Source: {q.division} Computer Number Systems solutions,
                        page {q.sourceSolutionPage}.
                      </p>
                    </details>
                  </div>
                ) : (
                  <label className="mt-5 block text-sm font-medium">
                    Answer to question {q.number}
                    <input
                      aria-label={`Answer to question ${q.number}`}
                      aria-describedby={`hint-${q.id}`}
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={200}
                      className={input}
                      value={answers[q.id] || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateHomework((s) => ({
                          ...s,
                          drafts: {
                            ...s.drafts,
                            [key]: { ...s.drafts[key], [q.id]: value },
                          },
                        }));
                        setConfirmBlank(false);
                      }}
                    />
                    <span
                      id={`hint-${q.id}`}
                      className="mt-2 block font-normal text-slate-500"
                    >
                      {q.hint}
                    </span>
                  </label>
                )}
              </article>
            );
          })}
        </div>
        {review && !visible.length && (
          <p className="rounded-xl bg-emerald-50 p-6 text-emerald-800">
            All answers are correct. There are no incorrect questions to review.
          </p>
        )}
        {!review && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            {confirmBlank && (
              <p role="alert" className="mb-4 text-amber-800">
                {questions.length - answered} questions are unanswered and will
                receive 0 points. Submit anyway, or continue answering.
              </p>
            )}
            <button type="submit" className={button}>
              {confirmBlank
                ? "Submit with unanswered questions"
                : "Submit and see score"}
            </button>
            {confirmBlank && (
              <button
                type="button"
                className={`${secondary} ml-3`}
                onClick={() => setConfirmBlank(false)}
              >
                Continue answering
              </button>
            )}
          </div>
        )}
      </form>
      <Link
        href="/assignments"
        className="inline-block text-sm font-medium text-indigo-700 hover:underline"
      >
        ← All worksheets
      </Link>
    </div>
  );
}
