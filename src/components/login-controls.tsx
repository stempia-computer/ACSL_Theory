"use client";
import { T } from "@/components/language";

import { signIn, signOut } from "next-auth/react";
export function LoginButton() {
  return (
    <button
      className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white"
      onClick={() => signIn("google", { redirectTo: "/dashboard" })}
    ><T>Google 계정으로 로그인</T></button>
  );
}
export function LogoutButton() {
  return (
    <button
      className="text-sm font-medium text-slate-600 underline"
      onClick={() => signOut({ redirectTo: "/login" })}
    ><T>로그아웃</T></button>
  );
}
