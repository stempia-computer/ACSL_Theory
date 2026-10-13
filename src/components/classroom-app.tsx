"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Classroom, Member, SavedAttempt } from "@/lib/classroom-types";
import type { WorksheetAssignment } from "@/lib/worksheet-data";
import type { View } from "@/components/classroom-gate";
import { LogoutButton } from "@/components/login-controls";
const input =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2";
const button =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const secondary =
  "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium";
const panel = "mb-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6";
export type PracticeQuestion = {
  id: string;
  number: number;
  hint: string;
  questionImage: { src: string; width: number; height: number };
};
async function mutate(action: string, data: unknown) {
  const response = await fetch("/api/classroom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
    signal: AbortSignal.timeout(45000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "저장하지 못했습니다.");
  return result;
}
function latestAttempts(attempts: SavedAttempt[]) {
  const latest = new Map<string, SavedAttempt>();
  for (const a of [...attempts].sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt),
  )) {
    const key = `${a.studentId}:${a.assignmentId}`;
    if (!latest.has(key)) latest.set(key, a);
  }
  return [...latest.values()];
}
function average(attempts: SavedAttempt[]) {
  const total = attempts.reduce((n, a) => n + a.total, 0);
  return total
    ? `${Math.round((attempts.reduce((n, a) => n + a.score, 0) / total) * 100)}%`
    : "—";
}
export function ClassroomApp({
  initial,
  view,
  assignments,
  assignment,
  questions,
}: {
  initial: Classroom;
  view: View;
  assignments: WorksheetAssignment[];
  assignment?: WorksheetAssignment;
  questions: PracticeQuestion[];
}) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [review, setReview] = useState<SavedAttempt | null>(null);
  const teacher = data.member.role === "teacher";
  async function refresh() {
    setRefreshing(true);
    setError("");
    try {
      const r = await fetch("/api/classroom", { cache: "no-store" });
      const body = await r.json();
      if (!r.ok) {
        if ([401, 403].includes(r.status)) setBlocked(true);
        throw new Error(body.error);
      }
      setData(body);
      setReview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "새로고침 실패");
    } finally {
      setRefreshing(false);
    }
  }
  if (blocked)
    return (
      <div className={panel}>
        <p role="alert">{error}</p>
        <LogoutButton />
      </div>
    );
  const title =
    view === "students"
      ? "Students · 학생 관리"
      : view === "teachers"
        ? "Teachers · 선생님 관리"
        : view === "assignments"
          ? "My Assignments"
          : view === "exercise"
            ? assignment?.title
            : view === "scores"
              ? "Scores · 점수와 오답"
              : teacher
                ? "Teacher Dashboard"
                : "Student Dashboard";
  const mine = selected
    ? data.attempts.filter((a) => a.studentId === selected)
    : data.attempts;
  const latest = latestAttempts(mine);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {teacher
              ? "Teacher"
              : `${data.member.division} · Grade ${data.member.grade}`}{" "}
            · {data.member.email}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        </div>
        <LogoutButton />
      </div>
      {teacher && (
        <nav
          aria-label="Teacher navigation"
          className="mb-6 flex flex-wrap gap-3"
        >
          {[
            ["Overview", "/dashboard"],
            ["Students", "/students"],
            ["Teachers", "/teachers"],
            ["Question Bank", "/question-bank"],
            ["Scores", "/scores"],
          ].map(([label, href]) => (
            <Link className={secondary} key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          로그인 계정으로 저장된 기록 · 이전 이름 입력 방식의 기록은 자동
          연결되지 않습니다.
        </p>
        <button className={secondary} disabled={refreshing} onClick={refresh}>
          {refreshing ? "Loading…" : "Refresh"}
        </button>
      </div>
      {view === "students" || view === "teachers" ? (
        <MemberManager
          key={view}
          role={view === "teachers" ? "teacher" : "student"}
          members={view === "teachers" ? data.teachers : data.students}
          onSaved={refresh}
        />
      ) : (
        <>
          {view !== "exercise" && view !== "assignments" && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  [
                    teacher ? "등록 학생" : "내 과제",
                    teacher
                      ? data.students.filter((s) => s.active).length
                      : assignments.length,
                  ],
                  ["제출 횟수", mine.length],
                  ["최근 제출 평균", average(latest)],
                  [
                    "최근 제출 오답",
                    latest.reduce((n, a) => n + a.total - a.score, 0),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              {teacher && (
                <StudentScores
                  students={data.students}
                  attempts={data.attempts}
                  assignments={assignments}
                  selected={selected}
                  onSelect={(id) => {
                    setSelected(id);
                    setReview(null);
                  }}
                  onReview={setReview}
                />
              )}
              {selected && (
                <div className="mb-4 flex items-center gap-4">
                  <h2 className="text-xl font-bold">
                    {data.students.find((s) => s.id === selected)?.name} · 학생
                    상세
                  </h2>
                  <button
                    className={secondary}
                    onClick={() => setSelected(null)}
                  >
                    전체 학생 보기
                  </button>
                </div>
              )}
              <AttemptList
                attempts={mine}
                teacher={teacher}
                onReview={setReview}
              />
              {teacher && <QuestionResults attempts={latest} />}
            </>
          )}
          {review && (
            <Review
              key={review.id}
              attempt={review}
              onClose={() => setReview(null)}
            />
          )}
          {(view === "assignments" ||
            (!teacher && view !== "exercise" && view !== "scores")) && (
            <section className={panel}>
              <h2 className="mb-4 text-xl font-bold">내 디비전 과제</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {assignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/assignments/${a.id}`}
                    className="rounded-lg border border-indigo-100 p-5 hover:bg-indigo-50"
                  >
                    <p className="font-semibold text-indigo-700">{a.title}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Questions {a.first}–{a.last} · {a.questionIds.length}{" "}
                      points · Due {a.due}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {view === "exercise" && assignment && (
            <Exercise
              key={`${data.member.id}:${assignment.id}`}
              member={data.member}
              assignment={assignment}
              questions={questions}
              onSubmitted={(a) => {
                setData((s) => ({
                  ...s,
                  attempts: [a, ...s.attempts.filter((x) => x.id !== a.id)],
                }));
              }}
            />
          )}
        </>
      )}
    </>
  );
}
function MemberManager({
  role,
  members,
  onSaved,
}: {
  role: "teacher" | "student";
  members: Member[];
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState("");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      await mutate(role === "teacher" ? "saveTeacher" : "saveStudent", {
        id: editing?.id,
        name: form.get("name"),
        email: form.get("email"),
        division: form.get("division"),
        grade: form.get("grade"),
        active: form.get("active") === "on",
      });
      setEditing(null);
      setFormKey((k) => k + 1);
      await onSaved();
      setMessage("저장했습니다.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className={panel}>
        <h2 className="mb-4 text-xl font-bold">
          {editing
            ? "계정 수정"
            : role === "teacher"
              ? "선생님 추가"
              : "학생 등록"}
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          {role === "teacher"
            ? "추가된 선생님은 모든 학생의 성적·답안을 보고 학생과 선생님을 관리할 수 있습니다."
            : "실제로 로그인할 Google 계정 이메일을 입력하세요. 비활성 계정은 기록을 보존하면서 접근을 막습니다."}
        </p>
        <form
          key={`${editing?.id || "new"}:${formKey}`}
          onSubmit={save}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label>
            Name · 이름
            <input
              className={input}
              name="name"
              required
              maxLength={80}
              defaultValue={editing?.name}
            />
          </label>
          <label>
            Email · 이메일
            <input
              className={input}
              name="email"
              type="email"
              required
              maxLength={254}
              defaultValue={editing?.email}
            />
          </label>
          {role === "student" && (
            <>
              <label>
                Division
                <select
                  className={input}
                  name="division"
                  aria-label="Division"
                  defaultValue={editing?.division || "Junior"}
                >
                  {["Junior", "Intermediate", "Senior"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                Grade · 학년
                <select
                  className={input}
                  name="grade"
                  aria-label="Grade · 학년"
                  defaultValue={editing?.grade || "6"}
                >
                  {[
                    "K",
                    ...Array.from({ length: 12 }, (_, i) => String(i + 1)),
                  ].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={editing?.active ?? true}
            />
            활성 계정
          </label>
          <div className="flex gap-3">
            <button className={button} disabled={busy}>
              {busy ? "Saving…" : editing ? "변경 저장" : "등록"}
            </button>
            {editing && (
              <button
                type="button"
                className={secondary}
                onClick={() => {
                  setEditing(null);
                  setFormKey((k) => k + 1);
                }}
              >
                취소
              </button>
            )}
          </div>
        </form>
        {message && (
          <p role="status" className="mt-4 text-indigo-700">
            {message}
          </p>
        )}
      </section>
      <section className={panel}>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            className={input + " sm:max-w-xs"}
            aria-label="Search members"
            placeholder="이름 또는 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {role === "student" && (
            <select
              className={input + " sm:max-w-xs"}
              aria-label="Filter division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
            >
              <option value="">All divisions</option>
              {["Junior", "Intermediate", "Senior"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "Name",
                  "Email",
                  ...(role === "student" ? ["Division", "Grade"] : []),
                  "Status",
                  "",
                ].map((h, i) => (
                  <th className="border-b p-3" key={i}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members
                .filter(
                  (m) =>
                    (!division || m.division === division) &&
                    `${m.name} ${m.email}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .map((m) => (
                  <tr key={m.id}>
                    <td className="border-b p-3">{m.name}</td>
                    <td className="border-b p-3">{m.email}</td>
                    {role === "student" && (
                      <>
                        <td className="border-b p-3">{m.division}</td>
                        <td className="border-b p-3">{m.grade}</td>
                      </>
                    )}
                    <td className="border-b p-3">
                      {m.active ? "활성" : "비활성"}
                    </td>
                    <td className="border-b p-3">
                      <button
                        className="font-medium text-indigo-700"
                        onClick={() => {
                          setEditing(m);
                          setFormKey((k) => k + 1);
                          setMessage("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {members.length === 0 && (
            <p className="py-6 text-slate-500">아직 등록된 학생이 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
function StudentScores({
  students,
  attempts,
  assignments,
  selected,
  onSelect,
  onReview,
}: {
  students: Member[];
  attempts: SavedAttempt[];
  assignments: WorksheetAssignment[];
  selected: string | null;
  onSelect: (id: string) => void;
  onReview: (a: SavedAttempt) => void;
}) {
  const [filter, setFilter] = useState("");
  const latest = latestAttempts(attempts);
  return (
    <section className={panel}>
      <h2 className="text-xl font-bold">학생별 점수</h2>
      <p className="my-2 text-sm text-slate-500">
        과제별 마지막 제출 기준입니다. 이름을 누르면 학생 상세, 점수를 누르면
        답안이 열립니다.
      </p>
      <input
        aria-label="Search scores"
        className={input + " mb-4 sm:max-w-sm"}
        placeholder="이름, 이메일, Division 검색"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Student",
                "Division",
                "CNS Part 1",
                "CNS Part 2",
                "Average",
              ].map((h) => (
                <th key={h} className="border-b p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students
              .filter((s) =>
                `${s.name} ${s.email} ${s.division}`
                  .toLowerCase()
                  .includes(filter.toLowerCase()),
              )
              .map((s) => {
                const own = latest.filter((a) => a.studentId === s.id);
                return (
                  <tr
                    key={s.id}
                    className={selected === s.id ? "bg-indigo-50" : ""}
                  >
                    <td className="border-b p-3">
                      <button
                        className="font-semibold text-indigo-700"
                        onClick={() => onSelect(s.id)}
                      >
                        {s.name}
                      </button>
                      <p className="text-xs text-slate-500">
                        Grade {s.grade}
                        {!s.active && " · 비활성"}
                      </p>
                    </td>
                    <td className="border-b p-3">{s.division}</td>
                    {[1, 2].map((part) => {
                      const assignment = assignments.find(
                        (a) =>
                          a.division === s.division?.toLowerCase() &&
                          a.id.endsWith(`-${part}`),
                      );
                      const a = own.find(
                        (a) => a.assignmentId === assignment?.id,
                      );
                      return (
                        <td key={part} className="border-b p-3">
                          {a ? (
                            <button
                              className="text-indigo-700 underline"
                              onClick={() => onReview(a)}
                            >
                              {a.score}/{a.total}
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                    <td className="border-b p-3 font-semibold">
                      {average(own)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {students.length === 0 && (
        <p className="mt-4 text-slate-500">
          Students에서 학생을 먼저 등록하세요.
        </p>
      )}
    </section>
  );
}
function AttemptList({
  attempts,
  teacher,
  onReview,
}: {
  attempts: SavedAttempt[];
  teacher: boolean;
  onReview: (a: SavedAttempt) => void;
}) {
  return (
    <section className={panel}>
      <h2 className="mb-4 text-xl font-bold">
        {teacher ? "제출 기록" : "내 점수와 오답 리뷰"}
      </h2>
      {attempts.length === 0 ? (
        <p className="text-slate-500">아직 제출된 답안이 없습니다.</p>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  ...(teacher ? ["Student"] : []),
                  "Assignment",
                  "Submitted",
                  "Score",
                  "",
                ].map((h, i) => (
                  <th key={i} className="border-b p-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  {teacher && <td className="border-b p-3">{a.student}</td>}
                  <td className="border-b p-3">{a.assignment}</td>
                  <td className="border-b p-3">
                    {new Date(a.receivedAt).toLocaleString()}
                  </td>
                  <td className="border-b p-3 font-semibold">
                    {a.score}/{a.total} ({a.percentage}%)
                  </td>
                  <td className="border-b p-3">
                    <button
                      className="text-indigo-700 underline"
                      onClick={() => onReview(a)}
                    >
                      답안 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
function QuestionResults({ attempts }: { attempts: SavedAttempt[] }) {
  const counts = new Map<
    string,
    { title: string; number: number; correct: number; total: number }
  >();
  for (const a of attempts)
    for (const r of a.results) {
      const c = counts.get(r.id) || {
        title: a.division,
        number: r.number,
        correct: 0,
        total: 0,
      };
      c.total++;
      if (r.correct) c.correct++;
      counts.set(r.id, c);
    }
  return (
    <details className={panel}>
      <summary className="cursor-pointer text-lg font-semibold">
        문제별 결과 · 최근 제출 기준
      </summary>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[...counts.entries()].map(([id, c]) => (
          <p key={id} className="rounded-lg bg-slate-50 p-3 text-sm">
            {c.title} Q{c.number}:{" "}
            <strong>
              {c.correct}/{c.total}
            </strong>{" "}
            정답 · {c.total - c.correct}명 오답
          </p>
        ))}
      </div>
      {!counts.size && (
        <p className="mt-4 text-slate-500">제출 후 표시됩니다.</p>
      )}
    </details>
  );
}
function Review({
  attempt,
  onClose,
}: {
  attempt: SavedAttempt;
  onClose: () => void;
}) {
  const [wrongOnly, setWrongOnly] = useState(false);
  const reviewRef = useRef<HTMLElement>(null);
  useEffect(() => {
    reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return (
    <section ref={reviewRef} className={panel} aria-label="Answer review">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {attempt.student} · {attempt.assignment}
        </h2>
        <button className={secondary} onClick={onClose}>
          리뷰 닫기
        </button>
      </div>
      <p className="my-3 text-lg font-semibold">
        {attempt.score} / {attempt.total} · {attempt.percentage}%
      </p>
      <label className="mb-5 flex items-center gap-2">
        <input
          type="checkbox"
          checked={wrongOnly}
          onChange={(e) => setWrongOnly(e.target.checked)}
        />
        오답만 보기
      </label>
      {wrongOnly && attempt.score === attempt.total && <p>모두 정답입니다.</p>}
      <div className="space-y-4">
        {attempt.results
          .filter((r) => !wrongOnly || !r.correct)
          .map((r) => (
            <article
              key={r.id}
              className={`rounded-lg border p-4 ${r.correct ? "border-emerald-200" : "border-amber-200"}`}
            >
              <h3 className="font-semibold">
                Question {r.number} ·{" "}
                {r.correct ? "정답" : r.answer.trim() ? "오답" : "미응답"}
              </h3>
              <p className="mt-2 break-words">
                학생 답:{" "}
                <span className="font-mono">{r.answer || "(빈 답안)"}</span>
              </p>
              <p className="break-words">
                정답: <span className="font-mono">{r.correctAnswer}</span>
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-indigo-700">
                  원본 문제와 해설 보기
                </summary>
                {["question", "solution"].map((type) => (
                  <Image
                    key={type}
                    src={`/worksheets/${attempt.division.toLowerCase()}/${type}-${String(r.number).padStart(2, "0")}.png`}
                    alt={`${type} ${r.number}`}
                    width={1200}
                    height={600}
                    unoptimized
                    className="mt-3 h-auto w-full"
                  />
                ))}
              </details>
            </article>
          ))}
      </div>
    </section>
  );
}
function Exercise({
  member,
  assignment,
  questions,
  onSubmitted,
}: {
  member: Member;
  assignment: WorksheetAssignment;
  questions: PracticeQuestion[];
  onSubmitted: (a: SavedAttempt) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{
    id: string;
    answers: Record<string, string>;
  } | null>(null);
  const [result, setResult] = useState<SavedAttempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmBlank, setConfirmBlank] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (
      !pending &&
      !confirmBlank &&
      questions.some((q) => !answers[q.id]?.trim())
    ) {
      setConfirmBlank(true);
      return;
    }
    const payload = pending || {
      id: crypto.randomUUID(),
      answers: { ...answers },
    };
    setPending(payload);
    setBusy(true);
    setError("");
    try {
      const saved = await mutate("submit", {
        ...payload,
        assignmentId: assignment.id,
      });
      if (!saved.attempt || saved.attempt.id !== payload.id)
        throw new Error("저장 확인에 실패했습니다.");
      setResult(saved.attempt);
      onSubmitted(saved.attempt);
      setPending(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "전송 실패. 같은 답안으로 다시 시도하세요.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <>
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 p-4 text-emerald-800"
        >
          제출과 서버 저장이 완료되었습니다. 다른 기기에서도 로그인하면 확인할
          수 있습니다.
        </p>
        <Review
          attempt={result}
          onClose={() => {
            setResult(null);
            setAnswers({});
            setConfirmBlank(false);
          }}
        />
        <button
          className={secondary}
          onClick={() => {
            setResult(null);
            setAnswers(
              Object.fromEntries(
                result.results
                  .filter((r) => r.correct)
                  .map((r) => [r.id, r.answer]),
              ),
            );
            setConfirmBlank(false);
          }}
        >
          틀린 문제 다시 풀기
        </button>
      </>
    );
  return (
    <form onSubmit={submit}>
      <p className="mb-5 text-slate-600">
        {member.role === "teacher"
          ? "선생님 미리보기입니다. 제출은 학생 계정에서 가능합니다."
          : `${member.name} · ${member.email}`}{" "}
        · {questions.length} questions
      </p>
      <p className="mb-5 text-sm text-slate-500">
        답안은 제출 전까지 이 탭에만 있습니다. 저장 완료 메시지를 확인한 뒤 창을
        닫으세요.
      </p>
      {questions.map((q) => (
        <section className={panel} key={q.id}>
          <h2 className="mb-4 text-lg font-semibold">Question {q.number}</h2>
          <Image
            src={q.questionImage.src}
            width={q.questionImage.width}
            height={q.questionImage.height}
            alt={`Original worksheet question ${q.number}`}
            unoptimized
            className="h-auto w-full"
          />
          <label className="mt-4 block font-medium">
            Your answer
            <input
              aria-label={`Answer to question ${q.number}`}
              className={input}
              value={answers[q.id] || ""}
              disabled={busy || !!pending}
              maxLength={200}
              onChange={(e) => {
                setAnswers({ ...answers, [q.id]: e.target.value });
                setConfirmBlank(false);
              }}
            />
          </label>
          <p className="mt-2 text-sm text-slate-500">{q.hint}</p>
        </section>
      ))}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-amber-50 p-4 text-amber-800"
        >
          {error} 답안은 이 탭에 유지됩니다. 재전송해도 중복 저장되지 않습니다.
        </p>
      )}
      {confirmBlank && !pending && (
        <p className="mb-4 text-amber-800">
          빈 답안은 0점입니다. 그대로 제출하려면 아래 버튼을 다시 누르세요.
        </p>
      )}
      <button className={button} disabled={busy || member.role !== "student"}>
        {busy
          ? "채점 및 저장 중…"
          : pending
            ? "같은 답안 다시 전송"
            : confirmBlank
              ? "빈 답안 포함 제출"
              : "Submit and see score"}
      </button>
    </form>
  );
}
