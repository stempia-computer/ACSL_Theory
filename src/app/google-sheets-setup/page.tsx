import { PageHeader } from "@/components/ui";
import { CopySheetScript } from "@/components/google-sheets-setup";

export default function GoogleSheetsSetup() {
  return (
    <>
      <PageHeader
        title="Google Sheets 연결"
        description="한 번 설정하면 학생 제출 결과가 선생님들의 공유 점수표에 기록됩니다."
      />
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
            기록과 문제별 결과 탭이 생깁니다.
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
            검은 창에서 Ctrl+C 후 npm run dev로 다시 실행하세요. Dashboard의
            Google Sheets 안내가 설정됨 상태로 바뀝니다.
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">6. 실제 전송 확인</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            테스트 학생 이름으로 숙제를 제출하고 Google Sheets의 제출
            기록·문제별 결과에 행이 생기는지 확인하세요. 사이트에서 sent로
            표시돼야 전송 완료입니다. 이전 기록은 Retry sending saved results로
            보낼 수 있습니다. 같은 제출을 다시 보내도 중복 기록하지 않습니다.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            이 연결은 점수표 공유 기능입니다. 학생들의 집에서 웹사이트에
            접속하려면 별도의 사이트 배포가 필요합니다. 현재 학생 이름은 직접
            입력하므로 로그인으로 본인 확인하는 기능은 아직 없습니다.
          </p>
        </section>
      </div>
    </>
  );
}
