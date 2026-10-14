
import { T } from "@/components/language";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { googleConfigured } from "@/auth";
import { otpConfigured } from "@/lib/otp";
import { OtpLogin } from "@/components/otp-login";
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
      <h1 className="mt-3 text-3xl font-bold"><T>로그인</T></h1>
      <p className="my-6 text-slate-600"><T>등록된 이메일로 인증번호를 받아 로그인하세요. 학생은 본인의 숙제와 점수만 볼 수 있습니다.</T></p>
      {error && (
        <p role="alert" className="mb-4 text-red-700"><T>로그인에 실패했습니다. 계정을 확인하고 다시 시도하세요.</T></p>
      )}
      {otpConfigured() ? (
        <OtpLogin />
      ) : (
        <p className="rounded-lg bg-amber-50 p-4"><T>이메일 OTP 연결 설정이 아직 필요합니다.</T>{" "}
          <Link className="text-indigo-700 underline" href="/login-setup"><T>관리자 설정 안내</T></Link>
        </p>
      )}
      {googleConfigured() && (
        <div className="mt-6 border-t pt-5">
          <p className="mb-3 text-sm text-slate-500"><T>기존 Google 로그인도 사용할 수 있습니다.</T></p>
          <LoginButton />
        </div>
      )}
      <p className="mt-5 text-sm text-slate-500"><T>Google 계정이 아니어도 등록된 이메일로 번호를 받을 수 있습니다. 미등록 계정은 선생님에게 문의하세요.</T></p>
    </div>
  );
}
export default function Login(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<p><T>로그인 준비 중…</T></p>}>
      <Content {...props} />
    </Suspense>
  );
}
