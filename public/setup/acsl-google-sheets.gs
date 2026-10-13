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
  setupAccounts_(ss);
  console.log('점수표와 계정 준비 완료. 기존 토큰과 기록을 유지했습니다. 새 버전으로 배포하세요.');
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
// Version 2: only authenticated server requests; legacy anonymous writes are rejected.
var STUDENTS = '학생 계정';
var TEACHERS = '선생님 계정';
var ACCOUNT_ATTEMPTS = '계정별 제출';
var MEMBER_HEADERS = ['ID', '이메일', '이름', 'Division', '학년', '활성', '계정 JSON'];
var ACCOUNT_HEADERS = ['제출 ID', '학생 ID', '이메일', '이름', 'Division', '과제', '점수', '총점', '제출 시각', '답안 JSON'];
function rows_(sheet, width) {
  return sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues() : [];
}
function members_(ss, sheetName) {
  return rows_(ensureSheet_(ss, sheetName, MEMBER_HEADERS), MEMBER_HEADERS.length).map(function(r) { return JSON.parse(r[6]); });
}
function isStaff_(member) { return member.role === 'admin' || member.role === 'teacher'; }
function writeMember_(ss, member) {
  var sheet = ensureSheet_(ss, isStaff_(member) ? TEACHERS : STUDENTS, MEMBER_HEADERS);
  var all = rows_(sheet, MEMBER_HEADERS.length);
  var index = all.findIndex(function(r) { return r[0] === member.id; });
  var row = [member.id, safeText_(member.email), safeText_(member.name), member.division || '', member.grade || '', member.active ? '활성' : '비활성', JSON.stringify(member)];
  sheet.getRange(index < 0 ? sheet.getLastRow() + 1 : index + 2, 1, 1, row.length).setNumberFormat('@').setValues([row]);
}
function setupAccounts_(ss) {
  ensureSheet_(ss, STUDENTS, MEMBER_HEADERS);
  ensureSheet_(ss, TEACHERS, MEMBER_HEADERS);
  ensureSheet_(ss, ACCOUNT_ATTEMPTS, ACCOUNT_HEADERS);
  // Seed only the first time. Re-running setup never restores a removed teacher.
  if (members_(ss, TEACHERS).length === 0) {
    ['wonup2@gmail.com', 'seanlee611@gmail.com'].forEach(function(email) {
      writeMember_(ss, { id: Utilities.getUuid(), email: email, name: email.split('@')[0], role: 'teacher', active: true });
    });
  }
  // Upgrade existing sheets as well as fresh installations. Preserve all other accounts.
  var adminEmail = 'stempiacomputer@gmail.com';
  var existing = members_(ss, TEACHERS).find(function(m) { return m.email === adminEmail; });
  if (members_(ss, STUDENTS).some(function(m) { return m.email === adminEmail; })) throw new Error('관리자 이메일이 학생으로 등록되어 있습니다. 학생 이메일을 수정한 뒤 setup을 다시 실행하세요.');
  if (!existing || existing.role !== 'admin') writeMember_(ss, { id: existing ? existing.id : Utilities.getUuid(), email: adminEmail, name: 'Stempia Computer', role: 'admin', active: true });
}
function fail_(code) { return json_({ ok: false, version: 2, code: code }); }
function ok_(data) { return json_({ ok: true, version: 2, data: data }); }
function doPost(e) {
  var lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 65536) return fail_('INVALID');
    var body = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('ACSL_SHEETS_TOKEN');
    if (!token || token.length < 32 || body.token !== token || body.version !== 2 || typeof body.actor !== 'string') return fail_('FORBIDDEN');
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return fail_('BUSY');
    var ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
    var students = members_(ss, STUDENTS), teachers = members_(ss, TEACHERS);
    var email = body.actor.trim().toLowerCase();
    var actor = teachers.concat(students).find(function(m) { return m.email === email && m.active; });
    if (!actor) return fail_('FORBIDDEN');
    var attemptSheet = ensureSheet_(ss, ACCOUNT_ATTEMPTS, ACCOUNT_HEADERS);
    var attemptRows = rows_(attemptSheet, ACCOUNT_HEADERS.length);
    if (body.action === 'load') {
      // Filter before returning data: students never receive another student's record.
      var allowed = attemptRows.filter(function(r) { return isStaff_(actor) || r[1] === actor.id; });
      return ok_({ member: actor, students: isStaff_(actor) ? students : [], teachers: isStaff_(actor) ? teachers : [], attempts: allowed.map(function(r) { return JSON.parse(r[9]); }).reverse() });
    }
    if (body.action === 'saveStudent' || body.action === 'saveTeacher') {
      if (!isStaff_(actor)) return fail_('FORBIDDEN');
      var d = body.data;
      if (!d || typeof d !== 'object' || typeof d.email !== 'string' || typeof d.name !== 'string' || typeof d.active !== 'boolean') return fail_('INVALID');
      var role = body.action === 'saveTeacher' ? 'teacher' : 'student';
      var list = role === 'teacher' ? teachers : students;
      var old = d.id ? list.find(function(m) { return m.id === d.id; }) : null;
      if (d.id && !old) return fail_('INVALID');
      if (old && old.role === 'admin') return fail_('FORBIDDEN');
      var normalized = d.email.trim().toLowerCase();
      if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || !d.name.trim() || d.name.length > 80 || /[\u0000-\u001f]/.test(d.name)) return fail_('INVALID');
      if (teachers.concat(students).some(function(m) { return m.email === normalized && (!old || m.id !== old.id); })) return fail_('INVALID');
      if (role === 'teacher' && !d.active && !teachers.some(function(m) { return m.role === 'teacher' && m.active && (!old || m.id !== old.id); })) return fail_('INVALID');
      if (role === 'student' && (['Junior', 'Intermediate', 'Senior'].indexOf(d.division) < 0 || typeof d.grade !== 'string' || !/^(K|[1-9]|1[0-2])$/.test(d.grade))) return fail_('INVALID');
      var member = { id: old ? old.id : Utilities.getUuid(), email: normalized, name: d.name.trim(), role: role, active: d.active };
      if (role === 'student') { member.division = d.division; member.grade = d.grade; }
      writeMember_(ss, member);
      SpreadsheetApp.flush();
      return ok_({ member: member });
    }
    if (body.action !== 'submit' || actor.role !== 'student') return fail_('FORBIDDEN');
    var s = body.data;
    if (!s || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.id) || s.division !== actor.division.toLowerCase() || typeof s.assignmentId !== 'string' || !/^(junior|intermediate|senior)-cns-[12]$/.test(s.assignmentId) || s.assignmentId.split('-')[0] !== actor.division.toLowerCase() || !Array.isArray(s.results) || s.results.length < 1 || s.results.length > 40 || s.total !== s.results.length || s.score !== s.results.filter(function(q) { return q.correct === true; }).length) return fail_('INVALID');
    if (s.results.some(function(q) { return typeof q.id !== 'string' || !Number.isInteger(q.number) || typeof q.answer !== 'string' || q.answer.length > 200 || typeof q.correctAnswer !== 'string' || typeof q.correct !== 'boolean'; }) || new Set(s.results.map(function(q) { return q.number; })).size !== s.results.length) return fail_('INVALID');
    var previous = attemptRows.find(function(r) { return r[0] === s.id; });
    if (previous && previous[1] !== actor.id) return fail_('CONFLICT');
    if (previous) {
      // Retry uses the first saved answers; a later request cannot alter an attempt.
      s = JSON.parse(previous[9]);
    } else {
      s.studentId = actor.id; s.email = actor.email; s.student = actor.name;
      s.receivedAt = new Date().toISOString(); s.submittedAt = s.receivedAt;
      s.percentage = Math.round(s.score / s.total * 100);
      var record = [s.id, actor.id, safeText_(actor.email), safeText_(actor.name), s.division, safeText_(s.assignment), s.score, s.total, s.receivedAt, JSON.stringify(s)];
      attemptSheet.getRange(attemptSheet.getLastRow() + 1, 1, 1, record.length).setNumberFormat('@').setValues([record]);
      SpreadsheetApp.flush();
    }
    projectAttempt_(ss, s);
    return ok_({ attempt: s });
  } catch (_) { return fail_('UNAVAILABLE'); }
  finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
// Keep the original human-readable tabs, with repairable, idempotent projections.
function projectAttempt_(ss, s) {
  var attempts = ensureSheet_(ss, ATTEMPTS, ATTEMPT_HEADERS);
  var details = ensureSheet_(ss, DETAILS, DETAIL_HEADERS);
  var ids = rows_(attempts, ATTEMPT_HEADERS.length).map(function(r) { return r[0]; });
  if (ids.indexOf(s.id) !== -1) return;
  var existing = rows_(details, DETAIL_HEADERS.length).filter(function(r) { return r[0] === s.id; }).map(function(r) { return Number(r[4]); });
  var rows = s.results.filter(function(q) { return existing.indexOf(q.number) === -1; }).map(function(q) {
    return [s.id, safeText_(s.student), safeText_(s.division), safeText_(s.assignment), q.number, safeText_(q.answer), safeText_(q.correctAnswer), q.correct ? '정답' : q.answer.trim() ? '오답' : '미응답'];
  });
  if (rows.length) details.getRange(details.getLastRow() + 1, 1, rows.length, DETAIL_HEADERS.length).setNumberFormat('@').setValues(rows);
  SpreadsheetApp.flush();
  var row = [s.id, s.receivedAt, s.submittedAt, safeText_(s.student), s.division, safeText_(s.assignment), s.score, s.total, s.percentage, s.results.filter(function(q) { return !q.correct; }).map(function(q) { return q.number; }).join(', ')];
  attempts.getRange(attempts.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
  SpreadsheetApp.flush();
}
