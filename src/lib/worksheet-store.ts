"use client";

import { useSyncExternalStore } from "react";
import {
  worksheetAssignments,
  assignmentQuestions,
} from "@/lib/worksheet-data";
import { gradeAnswer } from "@/lib/worksheet-grading";
export type Attempt = {
  id: string;
  assignmentId: string;
  student: string;
  submittedAt: string;
  sheetSyncedAt?: string;
  sheetSyncError?: string;
  answers: Record<string, string>;
};
export type HomeworkState = {
  student: string;
  drafts: Record<string, Record<string, string>>;
  attempts: Attempt[];
};
const key = "acsl-worksheet-homework-v1";
const empty: HomeworkState = { student: "", drafts: {}, attempts: [] };
let snapshot: { state: HomeworkState; ready: boolean; warning: string } = {
  state: empty,
  ready: false,
  warning: "",
};
const listeners = new Set<() => void>();
function isAnswers(value: unknown): value is Record<string, string> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === "string")
  );
}
function isState(value: unknown): value is HomeworkState {
  if (!value || typeof value !== "object") return false;
  const s = value as HomeworkState;
  return (
    typeof s.student === "string" &&
    !!s.drafts &&
    typeof s.drafts === "object" &&
    !Array.isArray(s.drafts) &&
    Object.values(s.drafts).every(isAnswers) &&
    Array.isArray(s.attempts) &&
    s.attempts.every(
      (a) =>
        a &&
        typeof a.id === "string" &&
        typeof a.assignmentId === "string" &&
        typeof a.student === "string" &&
        typeof a.submittedAt === "string" &&
        Number.isFinite(Date.parse(a.submittedAt)) &&
        (a.sheetSyncedAt === undefined || typeof a.sheetSyncedAt === "string") &&
        (a.sheetSyncError === undefined || typeof a.sheetSyncError === "string") &&
        isAnswers(a.answers),
    )
  );
}
function load() {
  try {
    const raw = localStorage.getItem(key);
    const state: unknown = raw ? JSON.parse(raw) : empty;
    if (!isState(state)) throw new Error("Invalid saved record");
    snapshot = { state, ready: true, warning: "" };
  } catch {
    snapshot = {
      state: empty,
      ready: true,
      warning:
        "Saved homework could not be loaded. Work is available in this tab; export your results before closing it.",
    };
  }
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot.ready) load();
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) load();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
const serverSnapshot = { state: empty, ready: false, warning: "" };
export function useHomework() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnapshot,
  );
}
export function updateHomework(
  update: (state: HomeworkState) => HomeworkState,
) {
  const state = update(snapshot.state);
  let warning = "";
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    warning =
      "Browser storage is unavailable or full. Work is kept in this tab only. Export your results before closing it.";
  }
  snapshot = { state, ready: true, warning };
  listeners.forEach((listener) => listener());
}
export function studentKey(student: string) {
  return student.trim().toLocaleLowerCase();
}
export function draftKey(student: string, assignmentId: string) {
  return `${studentKey(student)}::${assignmentId}`;
}
export function exportResults(student: string, attempts: Attempt[]) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          student,
          exportedAt: new Date().toISOString(),
          attempts: attempts.map((attempt) => {
            const assignment = worksheetAssignments.find(
              (a) => a.id === attempt.assignmentId,
            );
            const questions = assignment ? assignmentQuestions(assignment) : [];
            const score = questions.filter((q) =>
              gradeAnswer(q, attempt.answers[q.id] || ""),
            ).length;
            return { ...attempt, score, total: questions.length };
          }),
        },
        null,
        2,
      ),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ACSL-homework-results.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
