"use client";
import { T } from "@/components/language";

import { useState } from "react";
import { parseStudents, type ImportStudent } from "@/lib/student-import";
import type { Classroom, Division } from "@/lib/classroom-types";
const field = "mt-2 w-full rounded-lg border border-slate-300 bg-white p-3";
export function StudentImport({ onSaved }: { onSaved: () => Promise<void> }) {
  const [text, setText] = useState("");
  const [division, setDivision] = useState<Division>("Junior");
  const [rows, setRows] = useState<ImportStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function preview() {
    try {
      setRows(parseStudents(text, division));
      setStatuses({});
      setMessage("");
    } catch (e) {
      setRows([]);
      setMessage(e instanceof Error ? e.message : "명단을 확인하세요.");
    }
  }
  async function register() {
    setBusy(true);
    setMessage("");
    let added = 0,
      skipped = 0,
      failed = 0;
    try {
      const response = await fetch("/api/classroom", {
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "현재 명단을 확인하지 못했습니다.");
      const classroom = data as Classroom;
      const existing = new Set(
        [...classroom.students, ...classroom.teachers].map((m) =>
          m.email.toLowerCase(),
        ),
      );
      for (const row of rows) {
        if (existing.has(row.email)) {
          skipped++;
          setStatuses((s) => ({
            ...s,
            [row.email]: "이미 등록됨 · 변경 안 함",
          }));
          continue;
        }
        setStatuses((s) => ({ ...s, [row.email]: "등록 중…" }));
        try {
          const r = await fetch("/api/classroom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "saveStudent", data: row }),
            signal: AbortSignal.timeout(30000),
          });
          const result = await r.json();
          if (!r.ok) throw new Error(result.error || "등록 실패");
          if (result.member?.email !== row.email)
            throw new Error("등록 확인에 실패했습니다.");
          existing.add(row.email);
          added++;
          setStatuses((s) => ({ ...s, [row.email]: "등록 완료" }));
        } catch (e) {
          failed++;
          setStatuses((s) => ({
            ...s,
            [row.email]:
              e instanceof Error ? e.message : "확인 실패 · 재시도 가능",
          }));
        }
      }
      await onSaved();
      setMessage(
        `새로 등록 ${added}명 · 기존 계정 ${skipped}명 · 확인 실패 ${failed}명${failed ? ". 등록 버튼을 다시 누르면 현재 명단을 확인한 후 빠진 계정만 재시도합니다." : ""}`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "등록하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 sm:p-6">
      <h2 className="text-xl font-bold"><T>학생 일괄 등록</T></h2>
      <p className="mt-2 text-sm text-slate-600"><T>이름 · 학년 · 이메일 순서의 표를 복사해 붙여넣으세요. 등록 후 Division을 개별 수정할 수 있습니다. 이미 있는 이메일은 덮어쓰지 않습니다.</T></p>
      <label className="mt-4 block max-w-xs"><T>일괄 등록 Division</T><select
          aria-label="Import division"
          className={field}
          value={division}
          disabled={busy}
          onChange={(e) => {
            setDivision(e.target.value as Division);
            setRows([]);
            setMessage("");
          }}
        >
          {["Classroom", "Junior", "Intermediate", "Senior"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <label className="mt-4 block"><T>학생 명단</T><textarea
          aria-label="Student roster"
          rows={8}
          className={field + " font-mono text-sm"}
          placeholder={"Example Student\t9\tstudent@example.com"}
          value={text}
          disabled={busy}
          onChange={(e) => {
            setText(e.target.value);
            setRows([]);
            setMessage("");
          }}
        />
      </label>
      <button
        className="mt-3 rounded-lg border bg-white px-4 py-2 font-semibold disabled:opacity-50"
        disabled={busy}
        onClick={preview}
      ><T>명단 확인</T></button>
      <T>{rows.length > 0 && (
        <>
          <p className="my-4 font-semibold">
            {rows.length}명 · {division}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {["이름", "학년", "이메일", "Division", "등록 상태"].map(
                    (h) => (
                      <th key={h} className="p-2">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.email} className="border-t border-indigo-100">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.grade}</td>
                    <td className="p-2">{r.email}</td>
                    <td className="p-2">{r.division}</td>
                    <td className="p-2">{statuses[r.email] || "등록 대기"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            disabled={busy}
            onClick={register}
            className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "등록 중… 창을 닫지 마세요" : "명단 등록"}
          </button>
        </>
      )}</T>
      {message && (
        <p role="status" className="mt-4 text-sm font-medium">
          <T>{message}</T>
        </p>
      )}
    </section>
  );
}
