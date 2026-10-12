"use client";

import { useEffect, useReducer, useState, type FormEvent } from "react";
import {
  categories,
  choiceKeys,
  divisions,
  isQuestion,
  sampleQuestions,
  validateQuestion,
  type Question,
} from "@/lib/questions";

const storageKey = "acsl-theory-question-bank-v1";
const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const buttonClass =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700";
const emptyQuestion = (): Question => ({
  id: "",
  year: "2021-2022",
  contest: "Contest 1",
  division: "Intermediate",
  category: categories[0],
  type: "Multiple Choice",
  text: "",
  choices: { A: "", B: "", C: "", D: "" },
  correctAnswer: "A",
  explanation: "",
  points: 1,
  sourcePdf: "",
  questionNumber: 1,
});

export function QuestionBank() {
  const [questions, replaceQuestions] = useReducer(
    (_: Question[], next: Question[]) => next,
    sampleQuestions,
  );
  const [ready, setReady] = useReducer(() => true, false);
  const [notice, setNotice] = useReducer((_: string, next: string) => next, "");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    year: "",
    contest: "",
    division: "",
    category: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Question | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          !Array.isArray(parsed) ||
          !parsed.every(isQuestion) ||
          new Set(parsed.map((q) => q.id)).size !== parsed.length
        )
          throw new Error("Invalid data");
        replaceQuestions(parsed);
      }
    } catch {
      setNotice(
        "Saved browser data could not be loaded. Sample questions are shown instead.",
      );
    }
    setReady();
  }, []);

  const selected = questions.find((q) => q.id === selectedId);
  const visible = questions.filter(
    (q) =>
      Object.entries(filters).every(
        ([key, value]) => !value || q[key as keyof typeof filters] === value,
      ) &&
      `${q.text} ${q.category} ${q.id} ${q.year} ${q.contest} ${q.division} ${q.questionNumber}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const normalized = {
      ...draft,
      year: draft.year.trim(),
      text: draft.text.trim(),
      explanation: draft.explanation.trim(),
      sourcePdf: draft.sourcePdf.trim(),
      choices: Object.fromEntries(
        choiceKeys.map((k) => [k, draft.choices[k].trim()]),
      ) as Question["choices"],
    };
    const problem = validateQuestion(normalized);
    if (problem) {
      setError(problem);
      return;
    }
    const saved = { ...normalized, id: draft.id || crypto.randomUUID() };
    const next = draft.id
      ? questions.map((q) => (q.id === draft.id ? saved : q))
      : [...questions, saved];
    replaceQuestions(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice(
        "Question saved in this browser. This is demo data, not shared classroom data.",
      );
    } catch {
      setNotice(
        "Question updated for this session only. Browser storage is unavailable.",
      );
    }
    setSelectedId(saved.id);
    setDraft(null);
    setError("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm text-slate-500">
          Sample questions are illustrative, not imported official ACSL
          questions. Changes are stored only in this browser. Source PDFs are
          optional links; uploads are not available yet.
        </p>
        <button
          type="button"
          disabled={!ready}
          className={`${buttonClass} disabled:opacity-50`}
          onClick={() => {
            setDraft(emptyQuestion());
            setError("");
          }}
        >
          Add question
        </button>
      </div>
      <p role="status" className="text-sm text-indigo-700">
        {notice}
      </p>
      {draft ? (
        <section
          className="rounded-xl border border-slate-200 bg-white p-6"
          aria-labelledby="editor-heading"
        >
          <h2 id="editor-heading" className="mb-5 text-xl font-semibold">
            {draft.id ? "Edit question" : "Add question"}
          </h2>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-medium">
                Year
                <input
                  required
                  placeholder="2021-2022"
                  className={inputClass}
                  aria-label="Year"
                  value={draft.year}
                  onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium">
                Contest
                <select
                  className={inputClass}
                  aria-label="Contest"
                  value={draft.contest}
                  onChange={(e) =>
                    setDraft({ ...draft, contest: e.target.value })
                  }
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n}>Contest {n}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Division
                <select
                  className={inputClass}
                  aria-label="Division"
                  value={draft.division}
                  onChange={(e) =>
                    setDraft({ ...draft, division: e.target.value })
                  }
                >
                  {divisions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Category
                <select
                  className={inputClass}
                  aria-label="Category"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                >
                  {categories.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-sm text-slate-500">
              Question type: Multiple Choice · Short Answer and Programming will
              be added later.
            </p>
            <label className="block text-sm font-medium">
              Question text
              <textarea
                required
                rows={4}
                className={inputClass}
                aria-label="Question text"
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {choiceKeys.map((k) => (
                <label key={k} className="text-sm font-medium">
                  Choice {k}
                  <input
                    required
                    className={inputClass}
                    aria-label={`Choice ${k}`}
                    value={draft.choices[k]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        choices: { ...draft.choices, [k]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium">
                Correct answer
                <select
                  className={inputClass}
                  aria-label="Correct answer"
                  value={draft.correctAnswer}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      correctAnswer: e.target
                        .value as Question["correctAnswer"],
                    })
                  }
                >
                  {choiceKeys.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Points
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  className={inputClass}
                  aria-label="Points"
                  value={draft.points}
                  onChange={(e) =>
                    setDraft({ ...draft, points: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-sm font-medium">
                Question number
                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  className={inputClass}
                  aria-label="Question number"
                  value={draft.questionNumber}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      questionNumber: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Explanation
              <textarea
                required
                rows={3}
                className={inputClass}
                aria-label="Explanation"
                value={draft.explanation}
                onChange={(e) =>
                  setDraft({ ...draft, explanation: e.target.value })
                }
              />
            </label>
            <label className="block text-sm font-medium">
              Source PDF URL (optional)
              <input
                type="url"
                placeholder="https://example.com/contest.pdf"
                className={inputClass}
                aria-label="Source PDF URL (optional)"
                value={draft.sourcePdf}
                onChange={(e) =>
                  setDraft({ ...draft, sourcePdf: e.target.value })
                }
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button type="submit" className={buttonClass}>
                Save question
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section
            aria-label="Question filters"
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <label className="block text-sm font-medium">
              Search questions
              <input
                type="search"
                className={inputClass}
                placeholder="Search text, category, or question number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(["year", "contest", "division", "category"] as const).map(
                (key) => (
                  <label key={key} className="text-sm font-medium capitalize">
                    {key}
                    <select
                      className={inputClass}
                      aria-label={key}
                      value={filters[key]}
                      onChange={(e) =>
                        setFilters({ ...filters, [key]: e.target.value })
                      }
                    >
                      <option value="">
                        All {key === "category" ? "categories" : `${key}s`}
                      </option>
                      {Array.from(new Set(questions.map((q) => q[key])))
                        .sort()
                        .map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                    </select>
                  </label>
                ),
              )}
            </div>
            <button
              type="button"
              className="mt-4 text-sm font-medium text-indigo-700 hover:underline"
              onClick={() => {
                setSearch("");
                setFilters({
                  year: "",
                  contest: "",
                  division: "",
                  category: "",
                });
              }}
            >
              Clear filters
            </button>
          </section>
          <p className="text-sm text-slate-500">
            {visible.length} of {questions.length} questions
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {visible.map((q) => (
              <article
                key={q.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <p className="text-xs text-slate-500">
                  {q.year} · {q.contest} · {q.division} · Question{" "}
                  {q.questionNumber}
                </p>
                <p className="mt-3 text-sm font-semibold text-indigo-700">
                  {q.category}
                </p>
                <h2 className="mt-2 whitespace-pre-wrap font-medium">
                  {q.text}
                </h2>
                <div className="mt-5 flex gap-4">
                  <button
                    type="button"
                    className="text-sm font-medium text-indigo-700 hover:underline"
                    onClick={() => setSelectedId(q.id)}
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium text-slate-600 hover:underline"
                    disabled={!ready}
                    onClick={() => {
                      setDraft({ ...q, choices: { ...q.choices } });
                      setError("");
                    }}
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!visible.length && (
            <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              No questions match these filters. Clear the filters or add a
              question.
            </p>
          )}
          {selected && (
            <section
              aria-labelledby="detail-heading"
              className="rounded-xl border border-indigo-200 bg-white p-6"
            >
              <div className="flex justify-between gap-4">
                <h2 id="detail-heading" className="text-xl font-semibold">
                  Question details
                </h2>
                <button
                  type="button"
                  className="text-sm text-slate-600 hover:underline"
                  onClick={() => setSelectedId(null)}
                >
                  Close details
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {selected.year} · {selected.contest} · {selected.division} ·{" "}
                {selected.category} · Question {selected.questionNumber} ·{" "}
                {selected.points} points · {selected.type}
              </p>
              <p className="mt-5 whitespace-pre-wrap font-medium">
                {selected.text}
              </p>
              <ul className="mt-4 space-y-2">
                {choiceKeys.map((k) => (
                  <li
                    key={k}
                    className={`rounded-lg border p-3 ${k === selected.correctAnswer ? "border-indigo-300 bg-indigo-50" : "border-slate-200"}`}
                  >
                    <span className="font-semibold">{k}.</span>{" "}
                    {selected.choices[k]}
                    {k === selected.correctAnswer && (
                      <span className="ml-2 text-sm font-semibold text-indigo-700">
                        Correct answer
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <h3 className="mt-5 font-semibold">Explanation</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {selected.explanation}
              </p>
              <p className="mt-5 text-sm">
                Source PDF:{" "}
                {selected.sourcePdf ? (
                  <a
                    href={selected.sourcePdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-700 underline"
                  >
                    Open source PDF
                  </a>
                ) : (
                  "Not linked"
                )}
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
