
import { T } from "@/components/language";
import Link from "next/link";
export default function LoginSetup() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold"><T>학생·선생님 로그인 설정</T></h1>
      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6">
        <h2 className="text-xl font-semibold"><T>이메일 OTP로 로그인하기</T></h2>
        <p className="mt-3"><T>최신 Apps Script 코드를 붙여넣고 setup을 실행해 이메일 발송 권한을 승인한 뒤 기존 배포를 새 버전으로 업데이트하세요. 기존 Sheets 연결값과 AUTH_URL, AUTH_SECRET을 사용합니다. OTP만 사용한다면 아래 Google OAuth 클라이언트 설정은 생략할 수 있습니다.</T></p>
        <p className="mt-3"><T>학생은 등록된 이메일 → 인증번호 받기 → 6자리 번호 → 내 숙제 순서로 로그인합니다. 번호는 10분간 유효합니다. 명단 등록만으로 메일을 보내지는 않습니다.</T></p>
        <Link
          className="mt-3 inline-block text-indigo-700 underline"
          href="/google-sheets-setup"
        ><T>최신 연결 코드 복사</T></Link>
      </section>
      <p className="text-slate-600"><T>기존 Google Sheets 연결을 유지합니다. Apps Script 업데이트와 Google 로그인 설정을 한 번 완료하면 됩니다.</T></p>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold"><T>1. 기존 Apps Script 업데이트</T></h2>
        <p className="mt-3">
          <Link
            href="/google-sheets-setup"
            className="text-indigo-700 underline"
          ><T>연결 코드 복사 페이지</T></Link><T>에서 최신 코드를 복사해 기존 Code.gs를 바꾸고 저장하세요. setup을 실행하면 학생 계정·선생님 계정·계정별 제출 탭이 추가됩니다. 기존 점수와 토큰은 유지됩니다.</T></p>
        <p className="mt-3"><T>Deploy → Manage deployments → 연필 → New version → Deploy. 기존 연결 URL을 유지하세요.</T></p>
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold"><T>2. Google 로그인 클라이언트 만들기</T></h2>
        <p className="mt-3">
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-700 underline"
          ><T>Google Cloud Console</T></a>{" "}<T>→ Google Auth Platform에서 앱 이름 ACSL Classroom, Audience External을 설정하세요. Testing 상태에서는 두 선생님과 테스트 학생을 Test users에 추가하세요.</T></p>
        <p className="mt-3"><T>Clients → Create client → Web application</T></p>
        <p className="mt-3 break-all"><T>JavaScript origin: </T><code>http://localhost:3000</code>
        </p>
        <p className="mt-2 break-all"><T>Redirect URI:</T>{" "}
          <code>http://localhost:3000/api/auth/callback/google</code>
        </p>
        <p className="mt-3"><T>기본 로그인 권한(openid, email, profile)만 사용합니다. 결제 계정을 연결할 필요는 없습니다.</T></p>
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold"><T>3. 컴퓨터 설정</T></h2>
        <p className="mt-3"><T>기존 .env.local의 Sheets 주소·토큰 아래에 추가하세요.</T></p>
        <pre className="my-4 overflow-auto rounded bg-slate-100 p-4 text-sm">{`AUTH_URL=http://localhost:3000\nAUTH_GOOGLE_ID=발급받은_Client_ID\nAUTH_GOOGLE_SECRET=발급받은_Client_secret\nAUTH_SECRET=아래_명령으로_만든_값`}</pre>
        <p><T>명령 프롬프트에서 다음을 실행해 AUTH_SECRET 값을 만드세요.</T></p>
        <pre className="my-4 overflow-auto rounded bg-slate-100 p-4 text-sm">{`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`}</pre>
        <p><T>비밀 값은 채팅이나 GitHub에 올리지 마세요. 저장 후 Ctrl+C → npm run dev로 재시작하세요.</T></p>
      </section>
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold"><T>4. 선생님 로그인과 학생 등록</T></h2>
        <p className="mt-3"><T>초기 선생님: wonup2@gmail.com, seanlee611@gmail.com</T></p>
        <p className="mt-3">
          <Link href="/login" className="text-indigo-700 underline"><T>로그인</T></Link>{" "}<T>후 Students에서 이름·이메일·Division·학년을 등록하세요. Teachers에서 선생님을 추가할 수 있습니다. 학생은 등록된 Google 계정으로 본인의 과제와 결과만 봅니다.</T></p>
        <p className="mt-3"><T>Google 점수표는 선생님에게만 공유하세요. 이전 이름 입력 방식의 기록은 보존하지만 계정에 자동 연결하지 않습니다.</T></p>
      </section>
      <p className="text-sm text-slate-500"><T>학생들이 집에서 접속할 공개 사이트 배포는 별도입니다. 전체 안내는 저장소 docs/login-setup.ko.md에 있습니다.</T></p>
    </div>
  );
}
