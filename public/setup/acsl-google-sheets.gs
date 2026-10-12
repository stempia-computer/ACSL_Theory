/** ACSL Classroom: paste into the Apps Script project bound to your score spreadsheet. */
var ATTEMPTS = '제출 기록';
var DETAILS = '문제별 결과';
var ATTEMPT_HEADERS = ['제출 ID', '서버 수신 시각 (UTC)', '학생 제출 시각 (UTC)', '학생 이름', 'Division', '과제', '점수', '총점', '정답률 (%)', '오답 번호'];
var DETAIL_HEADERS = ['제출 ID', '학생 이름', 'Division', '과제', '문제 번호', '학생 답', '정답', '결과'];

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('점수표에서 확장 프로그램 → Apps Script로 열어 주세요.');
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', ss.getId());
  if (!props.getProperty('ACSL_SHEETS_TOKEN')) props.setProperty('ACSL_SHEETS_TOKEN', Utilities.getUuid() + Utilities.getUuid());
  ensureSheet_(ss, ATTEMPTS, ATTEMPT_HEADERS);
  ensureSheet_(ss, DETAILS, DETAIL_HEADERS);
  SpreadsheetApp.getUi().alert('점수표 준비 완료', '프로젝트 설정 → 스크립트 속성에서 ACSL_SHEETS_TOKEN을 확인하세요. 이 값은 .env.local에만 입력하고 채팅이나 GitHub에는 올리지 마세요.', SpreadsheetApp.getUi().ButtonSet.OK);
}
function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    var actual = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (actual.join('|') !== headers.join('|')) throw new Error('점수표 열 제목이 변경되었습니다: ' + name);
  }
  return sheet;
}
function safeText_(value) {
  var text = String(value == null ? '' : value);
  return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
}
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  var lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 65536) return json_({ ok: false });
    var body = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('ACSL_SHEETS_TOKEN');
    if (!token || token.length < 32 || body.token !== token) return json_({ ok: false });
    var s = body.submission;
    if (!s || !/^[0-9a-f-]{36}$/i.test(s.id) || typeof s.student !== 'string' || s.student.length > 80 || !Array.isArray(s.results) || s.results.length < 1 || s.results.length > 40 || s.total !== s.results.length || s.score !== s.results.filter(function(q) { return q.correct === true; }).length) return json_({ ok: false });
    if (s.results.some(function(q) { return !Number.isInteger(q.number) || typeof q.answer !== 'string' || q.answer.length > 200 || typeof q.correctAnswer !== 'string' || typeof q.correct !== 'boolean'; })) return json_({ ok: false });
    if (new Set(s.results.map(function(q) { return q.number; })).size !== s.results.length) return json_({ ok: false });
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return json_({ ok: false });
    var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
    var attempts = ensureSheet_(ss, ATTEMPTS, ATTEMPT_HEADERS);
    var details = ensureSheet_(ss, DETAILS, DETAIL_HEADERS);
    var ids = attempts.getLastRow() > 1 ? attempts.getRange(2, 1, attempts.getLastRow() - 1, 1).getValues().map(function(r) { return r[0]; }) : [];
    if (ids.indexOf(s.id) !== -1) return json_({ ok: true, id: s.id, duplicate: true });
    // Write details first and resume missing rows after a partial failure.
    var existing = details.getLastRow() > 1 ? details.getRange(2, 1, details.getLastRow() - 1, 5).getValues().filter(function(r) { return r[0] === s.id; }).map(function(r) { return Number(r[4]); }) : [];
    var rows = s.results.filter(function(q) { return existing.indexOf(q.number) === -1; }).map(function(q) {
      return [s.id, safeText_(s.student), safeText_(s.division), safeText_(s.assignment), q.number, safeText_(q.answer), safeText_(q.correctAnswer), q.correct ? '정답' : q.answer.trim() ? '오답' : '미응답'];
    });
    if (rows.length) details.getRange(details.getLastRow() + 1, 1, rows.length, DETAIL_HEADERS.length).setNumberFormat('@').setValues(rows);
    SpreadsheetApp.flush();
    var row = [s.id, safeText_(s.receivedAt), safeText_(s.submittedAt), safeText_(s.student), safeText_(s.division), safeText_(s.assignment), s.score, s.total, Math.round(s.score / s.total * 100), s.results.filter(function(q) { return !q.correct; }).map(function(q) { return q.number; }).join(', ')];
    var rowNumber = attempts.getLastRow() + 1;
    attempts.getRange(rowNumber, 1, 1, ATTEMPT_HEADERS.length).setNumberFormat('@').setValues([row]);
    SpreadsheetApp.flush();
    return json_({ ok: true, id: s.id });
  } catch (_) { return json_({ ok: false }); }
  finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
