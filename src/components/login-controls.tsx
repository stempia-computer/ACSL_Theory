"use client";
import { signIn, signOut } from "next-auth/react";
export function LoginButton() {
  return (
    <button
      className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white"
      onClick={() => signIn("google", { redirectTo: "/dashboard" })}
    >
      Google 계정으로 로그인
    </button>
  );
}
export function LogoutButton() {
  return (
    <button
      className="text-sm font-medium text-slate-600 underline"
      onClick={() => signOut({ redirectTo: "/login" })}
    >
      로그아웃
    </button>
  );
}
