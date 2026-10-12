"use client";

import { useState } from "react";
export function CopySheetScript() {
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  async function copy() {
    try {
      const response = await fetch("/setup/acsl-google-sheets.gs");
      if (!response.ok) throw new Error("Download failed");
      const text = await response.text();
      setCode(text);
      try {
        await navigator.clipboard.writeText(text);
        setMessage("복사했습니다. Apps Script 편집기에 붙여넣으세요.");
      } catch {
        setMessage("아래 코드 상자를 클릭하고 Ctrl+A, Ctrl+C로 복사하세요.");
      }
    } catch {
      setMessage(
        "코드를 불러오지 못했습니다. 아래 파일 다운로드를 사용하세요.",
      );
    }
  }
  return (
    <>
      <button
        onClick={copy}
        className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
      >
        연결 코드 복사
      </button>
      <a
        href="/setup/acsl-google-sheets.gs"
        download
        className="ml-4 text-sm text-indigo-700 underline"
      >
        코드 파일 다운로드
      </a>
      <p role="status" className="mt-3 text-sm text-indigo-700">
        {message}
      </p>
      {code && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm">코드 직접 보기</summary>
          <textarea
            aria-label="Apps Script 코드"
            readOnly
            value={code}
            rows={12}
            className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
          />
        </details>
      )}
    </>
  );
}
