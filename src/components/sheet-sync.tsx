"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import {
  useHomework,
  updateHomework,
  studentKey,
  type Attempt,
} from "@/lib/worksheet-store";

export async function sendAttemptToSheet(attempt: Attempt) {
  try {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: attempt.id,
        assignmentId: attempt.assignmentId,
        student: attempt.student,
        submittedAt: attempt.submittedAt,
        answers: attempt.answers,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true || result.id !== attempt.id)
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : "Google Sheets has not confirmed receipt.",
      );
    updateHomework((state) => ({
      ...state,
      attempts: state.attempts.map((a) =>
        a.id === attempt.id
          ? { ...a, sheetSyncedAt: result.syncedAt, sheetSyncError: undefined }
          : a,
      ),
    }));
  } catch (error) {
    const message =
      error instanceof Error && error.name !== "TimeoutError"
        ? error.message
        : "Google Sheets did not respond in time. Retry to confirm delivery.";
    updateHomework((state) => ({
      ...state,
      attempts: state.attempts.map((a) =>
        a.id === attempt.id ? { ...a, sheetSyncError: message } : a,
      ),
    }));
  }
}
export function SheetSyncStatus() {
  const { state, ready } = useHomework();
  const [configured, setConfigured] = useReducer(
    (_: boolean | "error" | null, value: boolean | "error" | null) => value,
    null,
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/submissions", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((r) => setConfigured(r.configured === true))
      .catch(() => {
        if (!controller.signal.aborted) setConfigured("error");
      });
    return () => controller.abort();
  }, []);
  const mine = state.attempts.filter(
    (a) => studentKey(a.student) === studentKey(state.student),
  );
  const pending = mine.filter((a) => !a.sheetSyncedAt);
  async function retry() {
    setBusy(true);
    try {
      for (const a of pending) await sendAttemptToSheet(a);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="Teacher score sharing"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2 className="font-semibold">Teacher score sharing · Google Sheets</h2>
      <p className="mt-2 text-sm text-slate-600">
        {configured === false
          ? "Google Sheets is not configured yet. Results remain in this browser until a teacher connects the shared sheet."
          : configured === true
            ? "Submissions are sent to the shared teacher score sheet. Delivery is confirmed separately from your local score."
            : configured === "error"
              ? "Could not check the connection settings. Your results remain saved; retry sending when the connection is restored."
              : "Checking the Google Sheets connection settings…"}
      </p>
      {mine.length > 0 && (
        <p role="status" className="mt-2 text-sm">
          {mine.length - pending.length} sent · {pending.length} awaiting
          confirmation
        </p>
      )}
      {pending.find((a) => a.sheetSyncError) && (
        <p className="mt-2 text-sm text-amber-800">
          {pending.find((a) => a.sheetSyncError)?.sheetSyncError}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        {pending.length > 0 && (
          <button
            disabled={!ready || busy || configured === false}
            onClick={retry}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Retry sending saved results"}
          </button>
        )}
        <Link
          href="/google-sheets-setup"
          className="py-2 text-sm font-medium text-indigo-700 hover:underline"
        >
          Teacher: connect Google Sheets
        </Link>
      </div>
    </section>
  );
}
