'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './language';
import type { Member } from '@/lib/classroom-types';
type Source = { id: string; title: string; division: string; kind: string; contest: string; questionIds: string[]; reviewCount?: number; sourceNote?: string };
export function AssignmentBuilder({ students, catalog, enabled, reviewEnabled }: { students: Member[]; catalog: Source[]; enabled: boolean; reviewEnabled: boolean }) {
  const { language } = useLanguage();
  const tr = (en: string, ko: string) => language === 'ko' ? ko : en;
  const router = useRouter();
  const [division, setDivision] = useState('junior');
  const [materialDivision, setMaterialDivision] = useState('');
  const [kind, setKind] = useState('Worksheet');
  const [contest, setContest] = useState('');
  const [sourceId, setSource] = useState('');
  const [part, setPart] = useState('all');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<Record<string, unknown> | null>(null);
  const source = catalog.find((s) => s.id === sourceId);
  const visible = catalog.filter((s) => s.kind === kind && (!materialDivision || s.division === materialDivision) && (!contest || s.contest === contest));
  const eligible = students.filter((s) => s.active && s.division?.toLowerCase() === division);
  const count = source ? part === 'all' ? source.questionIds.length : part === 'first' ? Math.ceil(source.questionIds.length / 2) : Math.floor(source.questionIds.length / 2) : 0;
  const input = 'w-full rounded-lg border bg-white p-3';
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    const payload = pending || { id: 'assigned-' + crypto.randomUUID(), sourceId, division, part, title, due, studentIds: ids };
    setPending(payload); setBusy(true); setNotice('');
    try {
      const r = await fetch('/api/classroom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'createAssignment', data: payload }) });
      const result = await r.json(); if (!r.ok) { if (r.status < 500) setPending(null); throw new Error(result.error); }
      setPending(null); setNotice(tr('Assignment saved. Students can now open it in Assignments.', '과제를 저장했습니다. 학생의 Assignments에서 볼 수 있습니다.')); router.refresh();
    } catch (error) { setNotice((error as Error).message); } finally { setBusy(false); }
  }
  return <section className="mb-8 rounded-xl border bg-white p-6">
    <h2 className="mb-4 text-2xl font-bold">{tr('Create assignment', '과제 만들기')}</h2>
    {enabled && !reviewEnabled && <p role="alert" className="mb-4 text-amber-800">{tr('Update Apps Script to enable the new worksheets and teacher grading.', '새 워크시트와 선생님 채점을 사용하려면 Apps Script를 업데이트하세요.')} <a className="underline" href="/google-sheets-setup">{tr('Setup guide', '설정 안내')}</a></p>}
    {!enabled ? <p role="alert">{tr('Update the Apps Script from Google Sheets setup and deploy a new version to enable assignment management.', '과제 배정을 사용하려면 Google Sheets 연결 안내의 Apps Script를 업데이트하고 새 버전으로 배포하세요.')} <a href="/google-sheets-setup" className="text-indigo-700 underline">{tr('Setup guide', '설정 안내')}</a></p> : <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={busy || !!pending} className="space-y-4 disabled:opacity-60">
        <label className="block">{tr('Student division', '배정할 학생 디비전')}<select aria-label="Student division" className={input} value={division} onChange={(e) => { setDivision(e.target.value); setIds([]); }}>
          {['classroom','junior','intermediate','senior'].map((d) => <option key={d} value={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}
        </select></label>
        <p className="text-sm text-slate-600">{tr('You may assign a worksheet from another division. Its original division is shown in the title.', '다른 디비전의 워크시트도 배정할 수 있습니다. 자료의 원래 디비전은 제목에 표시됩니다.')}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label>{tr('Material type', '자료 유형')}<select aria-label="Material type" className={input} value={kind} onChange={(e) => { setKind(e.target.value); setSource(''); setContest(''); }}><option value="Worksheet">{tr('Worksheets by topic', '단원별 워크시트')}</option><option value="Contest">{tr('Past contest papers', '기출 대회 문제')}</option></select></label>
          <label>{tr('Material division', '자료 디비전')}<select aria-label="Material division" className={input} value={materialDivision} onChange={(e) => { setMaterialDivision(e.target.value); setSource(''); }}><option value="">{tr('All material divisions', '모든 자료 디비전')}</option>{['classroom','junior','intermediate','senior'].map((d) => <option key={d} value={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}</select></label>
          <label>Contest<select aria-label="Worksheet contest" className={input} value={contest} onChange={(e) => { setContest(e.target.value); setSource(''); }}><option value="">{tr('All contests', '전체 Contest')}</option>{[1,2,3,4].map((n) => <option key={n} value={`contest-${n}`}>Contest {n}</option>)}{kind === 'Contest' && <option value="all-star">All-Star</option>}</select></label>
        </div>
        <label className="block">{tr('Problem set title', '문제집 제목')}<select aria-label="Problem set title" required className={input} value={sourceId} onChange={(e) => { setSource(e.target.value); setTitle(catalog.find((s) => s.id === e.target.value)?.title || ''); setPart('all'); }}>
          <option value="">{tr('Choose a problem set', '문제집 선택')}</option>
          {visible.map((s) => <option disabled={s.reviewCount !== undefined && !reviewEnabled} key={s.id} value={s.id}>{s.title} ({s.questionIds.length})</option>)}
        </select></label>
        {!visible.length && <p role="status">{tr('No uploaded worksheets match these filters. Try another material division.', '이 조건에 맞는 등록 자료가 없습니다. 자료 디비전을 바꿔 보세요.')}</p>}
        {source && source.division !== division && <p className="text-indigo-700">{tr(`Using ${source.division} material for ${division} students.`, `${source.division} 자료를 ${division} 학생에게 배정합니다.`)}</p>}
        {!!source?.reviewCount && <p className="text-amber-800">{tr(`${source.reviewCount} questions in this set need teacher review. Other questions are automatically graded.`, `이 문제집의 ${source.reviewCount}문제는 선생님 검토가 필요합니다. 나머지는 자동 채점됩니다.`)}</p>}
        {source?.sourceNote && <p className="text-amber-800">{source.sourceNote}</p>}
        <label className="block">{tr('Question range', '문제 범위')}<select aria-label="Question range" className={input} value={part} onChange={(e) => setPart(e.target.value)}>
          <option value="all">{tr('All questions', '전체')}</option><option value="first">{tr('First half', '앞 절반')}</option><option value="second">{tr('Second half', '뒤 절반')}</option>
        </select></label><p>{count} {tr('questions · 1 point each', '문제 · 각 1점')}</p>
        <label className="block">{tr('Assignment title', '과제 제목')}<input aria-label="Assignment title" required maxLength={160} className={input} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block">{tr('Due date', '마감일')}<input aria-label="Due date" required type="date" className={input} value={due} onChange={(e) => setDue(e.target.value)} /></label>
        <p className="text-sm text-slate-500">{tr('Late submissions are accepted.', '마감일 이후 제출도 허용합니다.')}</p>
        <div><p className="font-semibold">{tr('Assign to students', '학생 선택')}</p><button type="button" className="my-2 text-indigo-700 underline" onClick={() => setIds(eligible.map((s) => s.id))}>{tr('Select all in this division', '디비전 전체 선택')}</button>
        {!eligible.length && <p>{tr('No active students in this division.', '이 디비전에 등록된 학생이 없습니다.')}</p>}
        {eligible.map((s) => <label key={s.id} className="block py-1"><input type="checkbox" checked={ids.includes(s.id)} onChange={(e) => setIds(e.target.checked ? [...ids,s.id] : ids.filter((id) => id !== s.id))} /> {s.name} · {s.email}</label>)}</div>
      </fieldset>
      <button disabled={busy || (!pending && (!source || !ids.length))} className="rounded-lg bg-indigo-600 px-5 py-3 text-white disabled:opacity-50">{busy ? tr('Saving…','저장 중…') : pending ? tr('Retry saving','같은 과제 저장 재시도') : tr('Create and assign','과제 생성 및 배정')}</button>
      <p role="status">{notice}</p>
    </form>}
  </section>;
}
