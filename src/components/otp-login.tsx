"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
export function OtpLogin() {
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function send() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(30000),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      setChallenge(result.challenge);
      setCooldown(60);
      setCode("");
      setMessage(
        "등록된 이메일이면 인증번호가 발송됩니다. 스팸함도 확인하세요. 10분 안에 입력해 주세요. 재발송은 1분 후에 가능합니다.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "요청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await signIn("email-otp", {
        email,
        code,
        challenge,
        redirect: false,
      });
      if (result?.error)
        throw new Error(
          "번호가 맞지 않거나 만료되었습니다. 최신 번호를 확인하세요. 5번 실패하면 새 번호를 받아야 합니다.",
        );
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Discard cached pages when the authenticated account changes.
      window.location.assign("/dashboard");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "로그인에 실패했습니다.");
      setBusy(false);
    }
  }
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="block font-medium">
          이메일
          <input
            aria-label="Login email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="mt-2 w-full rounded-lg border p-3"
            value={email}
            disabled={busy || !!challenge}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button
          disabled={busy || cooldown > 0}
          className="my-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy
            ? "처리 중…"
            : cooldown
              ? `${cooldown}초 후 재발송`
              : challenge
                ? "인증번호 다시 받기"
                : "인증번호 받기"}
        </button>
      </form>
      {challenge && (
        <form onSubmit={login}>
          <label className="block font-medium">
            6자리 인증번호
            <input
              aria-label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              disabled={busy}
              className="mt-2 w-full rounded-lg border p-3 text-xl tracking-widest"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <button
            disabled={busy}
            className="mt-4 w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white disabled:opacity-50"
          >
            로그인
          </button>
          <button
            type="button"
            disabled={busy}
            className="mt-3 text-sm text-slate-600 underline"
            onClick={() => {
              setChallenge("");
              setCode("");
              setMessage("");
            }}
          >
            이메일 변경
          </button>
        </form>
      )}
      {message && (
        <p role="status" className="mt-4 text-sm text-slate-700">
          {message}
        </p>
      )}
    </div>
  );
}
