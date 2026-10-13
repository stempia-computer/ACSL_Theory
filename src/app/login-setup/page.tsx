import Link from "next/link";
export default function LoginSetup() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">학생·선생님 로그인 설정</h1>
      <p className="text-slate-600">
        기존 Google Sheets 연결을 유지합니다. Apps Script 업데이트와 Google
        로그인 설정을 한 번 완료하면 됩니다.
      </p>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">1. 기존 Apps Script 업데이트</h2>
        <p className="mt-3">
          <Link
            href="/google-sheets-setup"
            className="text-indigo-700 underline"
          >
            연결 코드 복사 페이지
          </Link>
          에서 최신 코드를 복사해 기존 Code.gs를 바꾸고 저장하세요. setup을
          실행하면 학생 계정·선생님 계정·계정별 제출 탭이 추가됩니다. 기존
          점수와 토큰은 유지됩니다.
        </p>
        <p className="mt-3">
          Deploy → Manage deployments → 연필 → New version → Deploy. 기존 연결
          URL을 유지하세요.
        </p>
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">
          2. Google 로그인 클라이언트 만들기
        </h2>
        <p className="mt-3">
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-700 underline"
          >
            Google Cloud Console
          </a>{" "}
          → Google Auth Platform에서 앱 이름 ACSL Classroom, Audience External을
          설정하세요. Testing 상태에서는 두 선생님과 테스트 학생을 Test users에
          추가하세요.
        </p>
        <p className="mt-3">Clients → Create client → Web application</p>
        <p className="mt-3 break-all">
          JavaScript origin: <code>http://localhost:3000</code>
        </p>
        <p className="mt-2 break-all">
          Redirect URI:{" "}
          <code>http://localhost:3000/api/auth/callback/google</code>
        </p>
        <p className="mt-3">
          기본 로그인 권한(openid, email, profile)만 사용합니다. 결제 계정을
          연결할 필요는 없습니다.
        </p>
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">3. 컴퓨터 설정</h2>
        <p className="mt-3">
          기존 .env.local의 Sheets 주소·토큰 아래에 추가하세요.
        </p>
        <pre className="my-4 overflow-auto rounded bg-slate-100 p-4 text-sm">{`AUTH_URL=http://localhost:3000\nAUTH_GOOGLE_ID=발급받은_Client_ID\nAUTH_GOOGLE_SECRET=발급받은_Client_secret\nAUTH_SECRET=아래_명령으로_만든_값`}</pre>
        <p>명령 프롬프트에서 다음을 실행해 AUTH_SECRET 값을 만드세요.</p>
        <pre className="my-4 overflow-auto rounded bg-slate-100 p-4 text-sm">{`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`}</pre>
        <p>
          비밀 값은 채팅이나 GitHub에 올리지 마세요. 저장 후 Ctrl+C → npm run
          dev로 재시작하세요.
        </p>
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">4. 선생님 로그인과 학생 등록</h2>
        <p className="mt-3">
          초기 선생님: wonup2@gmail.com, seanlee611@gmail.com
        </p>
        <p className="mt-3">
          <Link href="/login" className="text-indigo-700 underline">
            로그인
          </Link>{" "}
          후 Students에서 이름·이메일·Division·학년을 등록하세요. Teachers에서
          선생님을 추가할 수 있습니다. 학생은 등록된 Google 계정으로 본인의
          과제와 결과만 봅니다.
        </p>
        <p className="mt-3">
          Google 점수표는 선생님에게만 공유하세요. 이전 이름 입력 방식의 기록은
          보존하지만 계정에 자동 연결하지 않습니다.
        </p>
      </section>
      <p className="text-sm text-slate-500">
        학생들이 집에서 접속할 공개 사이트 배포는 별도입니다. 전체 안내는 저장소
        docs/login-setup.ko.md에 있습니다.
      </p>
    </div>
  );
}
