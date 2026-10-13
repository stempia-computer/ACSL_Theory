# 학생·선생님 계정으로 업그레이드

기존 `.env.local`의 Google Sheets 주소와 토큰은 유지합니다. 새 토큰이나 OAuth 비밀 값은 채팅·GitHub에 올리지 마세요.

## 1. Apps Script 업데이트 (기존 시트 유지)

1. 최신 코드를 GitHub Desktop에서 Pull 합니다. 프로젝트 명령 프롬프트에서 `npm ci`로 새 로그인 패키지를 설치하고 `npm run dev`를 실행합니다.
2. 사이트 `/google-sheets-setup`의 **연결 코드 복사**로 최신 코드를 복사합니다.
3. 기존 점수표의 확장 프로그램 → Apps Script에서 Code.gs 전체를 바꾸고 저장합니다.
4. `setup`을 한 번 실행합니다. 이제 팝업 없이 끝나며, 기존 토큰·기록을 유지하고 **학생 계정**, **선생님 계정**, **계정별 제출** 탭을 추가합니다.
5. **Deploy → Manage deployments → 연필 → Version: New version → Deploy**를 선택합니다. 기존 URL을 유지하세요. Execute as: Me, Who has access: Anyone입니다. 요청은 서버 토큰과 서버가 검증한 이메일로 제한됩니다.
6. 초기 선생님은 `wonup2@gmail.com`, `seanlee611@gmail.com`입니다. 이후 Teachers 화면에서 추가·수정·비활성화할 수 있습니다. 두 선생님은 같은 관리 권한을 갖습니다. 마지막 활성 선생님은 비활성화할 수 없습니다.

**중요:** 시트를 학생에게 공유하지 마세요. 선생님에게만 뷰어 권한을 줍니다. 계정 탭의 JSON과 열 제목은 직접 편집하지 말고 사이트에서 수정하세요. 시트 편집 권한이 있으면 앱 권한도 변경할 수 있으므로 소유자만 편집하도록 유지하세요.

## 2. Google 로그인 설정 (한 번)

Apps Script 배포 승인과 웹사이트 Google 로그인은 별개의 설정입니다. Google Cloud Console에서 OAuth 클라이언트를 만듭니다. 기본 Google 로그인에는 결제 계정 연결이 필요하지 않습니다.

1. https://console.cloud.google.com/ 에서 프로젝트를 선택하거나 새 프로젝트를 만듭니다. Google Auth Platform을 엽니다.
2. Branding/Get started에서 이름 `ACSL Classroom`, 지원 이메일을 입력합니다. Audience는 학교 계정에만 제한할 계획이 아니라면 **External**로 설정합니다.
3. Testing 상태라면 Test users에 두 선생님과 실제 테스트할 학생 이메일을 추가하세요. 테스트 사용자 한도와 학교의 앱 접근 정책이 적용됩니다. 실제 학급 운영 전 Google의 게시·사용자 제한 조건을 확인하세요.
4. Data Access는 Google 로그인 기본 정보인 `openid`, `email`, `profile`만 사용합니다. 학생 로그인에 Sheets·Drive 권한을 요청하지 않습니다.
5. Clients → Create client → **Web application**을 선택합니다.
6. Authorized JavaScript origins: `http://localhost:3000`
7. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (철자와 포트를 정확히 맞춥니다.)
8. Client ID와 Client secret을 복사해 기존 `.env.local` 아래에 추가합니다.

```env
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=발급받은_Client_ID
AUTH_GOOGLE_SECRET=발급받은_Client_secret
AUTH_SECRET=컴퓨터에서_생성한_무작위_값
```

AUTH_SECRET은 명령 프롬프트에서 아래 명령으로 생성해서 직접 파일에 복사합니다. Sheets 토큰과 다른 값입니다.

```bat
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

실행 중인 서버에서 Ctrl+C, `npm run dev`로 다시 시작합니다. 사이트 `/login`에서 두 선생님 중 하나로 로그인합니다. Google 비밀번호를 이 사이트에 입력하지 않습니다.

## 3. 학생 등록과 권한 확인

- Teachers: 선생님 추가·수정·비활성화. 새 선생님에게 전체 학생 조회와 계정 관리 권한이 생깁니다.
- Students: 이름, 실제 Google 로그인 이메일, Division, 학년(K 또는 1–12)을 등록합니다. 중복 이메일은 허용하지 않습니다.
- 학생은 같은 이메일로 로그인해야 합니다. Gmail 이외 이메일도 Google 계정이어야 합니다. 이름을 임의로 바꾸어 다른 기록을 볼 수 없습니다.
- 학생은 등록된 Division의 과제를 보고 제출하며, 본인 제출 이력과 오답을 다른 기기에서도 볼 수 있습니다.
- 선생님 Dashboard: 학생별 Part 1/Part 2 점수, 최근 제출 평균, 전체 제출 이력, 문제별 결과. 학생 이름을 눌러 학생 상세, 점수나 ‘답안 보기’를 눌러 개별 답·정답·해설을 봅니다.
- 다른 학생 계정으로 로그인하여 첫 학생 기록이 보이지 않는지, 학생의 `/students`, `/teachers`, `/question-bank` 접근이 차단되는지도 확인하세요.
- 제출 실패 시 같은 답안 다시 전송을 누릅니다. 제출 ID를 유지해 중복을 막습니다. 제출 전 답안은 현재 탭에만 있으므로 저장 완료 메시지 전에 닫지 마세요.

## 기존 기록 및 운영 범위

예전 이름 입력 방식의 제출은 소유 이메일을 검증할 수 없어 학생 계정에 자동 연결하지 않습니다. 기존 ‘제출 기록’과 ‘문제별 결과’ 시트는 그대로 보존하며 선생님이 볼 수 있습니다. 새 Dashboard는 로그인 이후 ‘계정별 제출’ 기록을 사용합니다. 기존 브라우저 기록도 전송하거나 학생에게 표시하지 않습니다.

로그아웃 또는 계정 변경 후 새 로그인으로 접근합니다. 세션은 최대 8시간이며, 학생/교사 활성 여부는 서버 요청마다 시트에서 다시 확인합니다. 이미 화면에 열린 데이터나 다운로드한 내용까지 회수되지는 않습니다.

이 앱은 연습용입니다. 원본 문제·해설 이미지 파일은 공개 정적 파일이며 엄격한 시험 보안용이 아닙니다. Question Bank의 수동 문제 편집은 아직 브라우저에만 저장됩니다. 학생 성적은 공유 시트에 저장됩니다. 계정 정보·성적은 브라우저 localStorage에 새로 저장하지 않습니다.

Google Sheets는 소규모 학급용 저장소입니다. 데이터가 많아지면 읽기 시간과 Apps Script 실행량 제한이 생길 수 있습니다. 실제 Google 로그인·배포 연결은 본인 환경에서 위 검증을 마쳐야 합니다.

localhost는 현재 Windows 컴퓨터 전용입니다. 학생들이 집에서 접속하려면 HTTPS 공개 사이트 배포가 별도로 필요하며, 그 사이트의 AUTH_URL과 Google redirect URI도 함께 등록해야 합니다. 비밀 환경변수를 학생 컴퓨터에 복사하지 마세요.
