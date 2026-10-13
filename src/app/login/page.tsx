import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { loginConfigured } from "@/auth";
import { LoginButton } from "@/components/login-controls";
async function Content({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8">
      <p className="text-sm font-semibold text-indigo-600">ACSL CLASSROOM</p>
      <h1 className="mt-3 text-3xl font-bold">로그인</h1>
      <p className="my-6 text-slate-600">
        선생님이 등록한 이메일의 Google 계정으로 로그인하세요. 학생은 본인의
        과제와 결과만 볼 수 있습니다.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-red-700">
          로그인에 실패했습니다. 계정을 확인하고 다시 시도하세요.
        </p>
      )}
      {loginConfigured() ? (
        <LoginButton />
      ) : (
        <p className="rounded-lg bg-amber-50 p-4">
          Google 로그인 설정이 아직 필요합니다.{" "}
          <Link className="text-indigo-700 underline" href="/login-setup">
            관리자 설정 안내
          </Link>
        </p>
      )}
      <p className="mt-5 text-sm text-slate-500">
        학교 이메일도 Google 계정으로 사용할 수 있어야 합니다. 등록되지 않은
        계정은 성적에 접근할 수 없습니다.
      </p>
    </div>
  );
}
export default function Login(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<p>로그인 준비 중…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
