'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from './language';
type Worksheet = { id: string; title: string; division: string; problemPdf: string; solutionPdf: string; count: number; reviewCount: number; sourceNote: string };
export function WorksheetLibrary({ packets }: { packets: Worksheet[] }) {
  const { language } = useLanguage();
  const tr = (en: string, ko: string) => language === 'ko' ? ko : en;
  const [division, setDivision] = useState('');
  const [search, setSearch] = useState('');
  const visible = packets.filter((p) => (!division || p.division === division) && p.title.toLowerCase().includes(search.toLowerCase()));
  return <section className="mb-8 rounded-xl border bg-white p-6">
    <h2 className="text-2xl font-bold">{tr('Worksheet library', '워크시트 자료실')}</h2>
    <p className="my-3">{tr('Choose a title in Assignments to assign all questions or either half.', 'Assignments에서 제목을 선택해 전체 또는 절반씩 배정하세요.')}</p>
    <div className="my-4 flex flex-wrap gap-3"><select aria-label="Worksheet division" className="rounded-lg border p-2" value={division} onChange={(e) => setDivision(e.target.value)}><option value="">{tr('All divisions', '전체 디비전')}</option><option value="intermediate">Intermediate</option><option value="senior">Senior</option></select><input aria-label="Search worksheets" placeholder={tr('Search worksheet titles', '워크시트 제목 검색')} className="rounded-lg border p-2" value={search} onChange={(e) => setSearch(e.target.value)} /><Link className="rounded-lg bg-indigo-600 px-4 py-2 text-white" href="/assignments">{tr('Create assignment', '과제 만들기')}</Link></div>
    <div className="grid gap-3 md:grid-cols-2">{visible.map((p) => <article key={p.id} className="rounded-lg border p-4"><h3 className="font-semibold">{p.title}</h3><p className="my-2 text-sm">{p.count} {tr('questions', '문제')} · {p.count-p.reviewCount} {tr('auto-graded', '자동 채점')}{!!p.reviewCount && ` · ${p.reviewCount} ${tr('teacher review', '선생님 검토')}`}</p>{p.sourceNote && <p className="my-2 text-sm text-amber-800">{p.sourceNote}</p>}<div className="flex gap-4"><a className="text-indigo-700 underline" href={p.problemPdf} target="_blank" rel="noreferrer">{tr('Problems PDF', '문제 PDF')}</a><a className="text-indigo-700 underline" href={p.solutionPdf} target="_blank" rel="noreferrer">{tr('Solutions PDF', '해설 PDF')}</a></div></article>)}</div>
    {!visible.length && <p>{tr('No matching worksheets.', '검색 결과가 없습니다.')}</p>}
  </section>;
}
