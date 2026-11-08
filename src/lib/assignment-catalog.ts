import { contestPackets } from './contest-packets';
import { worksheetQuestions, type WorksheetAssignment } from './worksheet-data';
import type { Member } from './classroom-types';
import importedWorksheets from '@/data/imported-worksheets.json';

export type AssignedHomework = WorksheetAssignment & {
  sourceId: string; studentIds: string[]; createdBy: string;
};
const divisions = ['classroom', 'junior', 'intermediate', 'senior'];
export const assignmentCatalog = [
  ...importedWorksheets.map((p) => ({ id: p.id, title: p.title, division: p.division, kind: 'Worksheet', questionIds: p.questions.map((q) => q.id), reviewCount: p.questions.filter((q) => q.mode === 'manual').length, sourceNote: p.sourceNote })),
  ...divisions.flatMap((division) => {
    const questions = worksheetQuestions.filter((q) => q.id.startsWith(division + '-'));
    return questions.length ? [{ id: 'worksheet-' + division + '-cns', title: `${division[0].toUpperCase() + division.slice(1)} · Computer Number Systems`, division, kind: 'Worksheet', questionIds: questions.map((q) => q.id) }] : [];
  }),
  ...contestPackets.filter((p) => p.questions.every((q) => q.correctAnswer)).map((p) => ({
    id: p.id, title: p.title, division: p.division.toLowerCase(), kind: 'Contest',
    questionIds: p.questions.map((q) => `${p.id}:q${q.number}`),
  })),
];
export function assignedQuestions(assignment: Pick<AssignedHomework, 'sourceId' | 'questionIds'>) {
  const packet = contestPackets.find((p) => p.id === assignment.sourceId);
  const imported = importedWorksheets.find((p) => p.id === assignment.sourceId);
  return assignment.questionIds.map((id) => {
    const item = imported?.questions.find((q) => q.id === id);
    if (imported && item) return { ...item, questionImage: undefined, choices: item.choices || undefined, multiple: !!item.choices,
      hint: `${item.heading}${item.mode === 'manual' ? ' · Teacher review required / 선생님 검토 필요' : item.mode === 'tuples' ? ' · Enter tuples, e.g. (0,1,0), (1,1,0)' : item.mode === 'bitpattern' ? ' · Use * for either bit; separate patterns with commas' : item.mode === 'set' ? ' · Separate answers with commas' : ''}`,
      problemPdf: `${imported.problemPdf}#page=${item.page}`, solutionPdf: item.solutionPage ? `${imported.solutionPdf}#page=${item.solutionPage}` : undefined };
    const worksheet = worksheetQuestions.find((q) => q.id === id);
    if (worksheet) return { ...worksheet, choices: undefined, problemPdf: undefined, solutionPdf: undefined };
    const q = packet?.questions.find((q) => `${packet.id}:q${q.number}` === id);
    if (!packet || !q?.correctAnswer) throw new Error('Question not found');
    return { id, number: q.number, answer: q.correctAnswer, aliases: [], mode: 'text', base: null,
      hint: q.category, questionImage: undefined, choices: ['A', 'B', 'C', 'D', 'E'],
      problemPdf: `${packet.problemPdf}#page=${q.page}`, solutionPdf: packet.solutionPdf || undefined };
  });
}
export function createHomework(value: unknown, students: Member[], email: string): AssignedHomework {
  const d = value as Record<string, unknown>;
  const source = assignmentCatalog.find((s) => s.id === d?.sourceId);
  if (!source || typeof d.title !== 'string' || !d.title.trim() || d.title.length > 160 ||
    typeof d.id !== 'string' || !/^assigned-[0-9a-f-]{36}$/i.test(d.id) ||
    typeof d.due !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.due) || !Number.isFinite(Date.parse(d.due)) ||
    !['all', 'first', 'second'].includes(String(d.part)) || !Array.isArray(d.studentIds) || !d.studentIds.length ||
    new Set(d.studentIds).size !== d.studentIds.length ||
    d.studentIds.some((id) => !students.some((s) => s.id === id && s.active && s.division?.toLowerCase() === source.division)))
    throw new Error('Check the title, due date and students.');
  const middle = Math.ceil(source.questionIds.length / 2);
  const ids = d.part === 'first' ? source.questionIds.slice(0, middle) : d.part === 'second' ? source.questionIds.slice(middle) : source.questionIds;
  if (!ids.length) throw new Error('No questions selected.');
  const numbers = assignedQuestions({ sourceId: source.id, questionIds: ids }).map((q) => q.number);
  return { id: d.id, sourceId: source.id, title: d.title.trim(), division: source.division,
    due: d.due, questionIds: ids, first: Math.min(...numbers), last: Math.max(...numbers),
    studentIds: d.studentIds as string[], createdBy: email };
}
