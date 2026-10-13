import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CopySheetScript } from "@/components/google-sheets-setup";

export default function GoogleSheetsSetup() {
  return (
    <>
      <PageHeader
        title="Google Sheets 연결"
        description="한 번 설정하면 학생 제출 결과가 선생님들의 공유 점수표에 기록됩니다."
      />
      <div className="mb-6 rounded-xl bg-indigo-50 p-5">
        이미 시트를 연결했다면 새로 만들지 마세요.{" "}
        <Link className="text-indigo-700 underline" href="/login-setup">
          학생·선생님 로그인 업그레이드 안내
        </Link>
        에 따라 아래 코드를 업데이트하세요.
      </div>
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">1. Google 점수표 만들기</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-700 underline"
            >
              새 Google Sheets 열기
            </a>
            에서 점수표를 만들고 이름을 ACSL Classroom Scores로 바꾸세요. 오른쪽
            위 공유 버튼에서 선생님들의 Google 이메일을 추가하고 뷰어 권한을
            주세요. 일반 액세스는 제한됨으로 유지하세요.
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">2. 연결 코드 붙여넣기</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            점수표 상단의 확장 프로그램 → Apps Script를 여세요. 아래 코드를
            복사해서 기본 Code.gs의 내용을 바꾸고 저장하세요.
          </p>
          <CopySheetScript />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">3. 점수표 준비</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Apps Script 상단 함수 목록에서 setup을 선택하고 실행하세요. 본인
            Google 계정으로 이 스크립트의 스프레드시트 접근을 승인하면 제출
            기록·문제별 결과·학생 계정·선생님 계정·계정별 제출 탭이 생깁니다.
            완료 알림 팝업 없이 실행이 끝납니다.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            왼쪽 톱니바퀴 프로젝트 설정 → 스크립트 속성에서 ACSL_SHEETS_TOKEN
            값을 복사해 두세요. 이 값은 다음 단계의 컴퓨터 설정에만 사용하며,
            채팅·GitHub·학생에게 공유하지 마세요.
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">4. 연결 주소 만들기</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            배포 → 새 배포 → 유형 선택의 톱니바퀴 → 웹 앱을 선택하세요. 실행
            사용자: 나, 액세스 권한: 모든 사용자(Anyone)로 설정한 뒤 배포하세요.
            끝이 /exec인 웹 앱 URL을 복사하세요. 웹 앱은 비밀 토큰을 확인한
            요청만 기록하며 점수표 내용은 공개하지 않습니다.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            학교 Google 계정에서 모든 사용자 옵션이 제한되어 있으면 관리자
            허용이 필요합니다.
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">5. Windows 프로젝트에 연결</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            프로젝트 폴더의 .env.local.example을 복사해서 파일 이름을
            .env.local로 바꾸세요. 메모장으로 열어서 아래 두 값을 본인의 웹 앱
            URL과 스크립트 속성 토큰으로 바꾼 뒤 저장하세요. 파일 끝에 .txt가
            붙지 않도록 확인하세요.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-100 p-4 text-xs">{`ACSL_SHEETS_WEBHOOK_URL=웹_앱_URL\nACSL_SHEETS_TOKEN=스크립트_속성의_토큰`}</pre>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            기존 .env.local 파일이 있다면 주소와 토큰을 유지하세요. 로그인 설정
            안내에서 Google OAuth 설정도 완료한 뒤 서버를 재시작하세요.
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">6. 실제 전송 확인</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            선생님으로 로그인해 학생을 등록하고, 등록된 학생 계정으로 숙제를
            제출하세요. 저장 완료 메시지와 Google Sheets의 새 행을 확인하세요.
            실패 시 같은 답안 다시 전송을 누르면 중복 없이 재시도합니다.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            이 연결은 점수표 공유 기능입니다. 학생들의 집에서 웹사이트에
            접속하려면 별도의 사이트 배포가 필요합니다. Google 점수표는
            선생님에게만 공유하고 학생에게는 공유하지 마세요.
          </p>
        </section>
      </div>
    </>
  );
}
