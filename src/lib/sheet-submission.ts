import { gradeAnswer } from "./worksheet-grading.ts";
export type SubmissionQuestion = {
  id: string;
  number: number;
  answer: string;
  aliases: string[];
  mode: string;
  base: number | null;
};
export type SubmissionAssignment = {
  id: string;
  title: string;
  division: string;
  questionIds: string[];
};
export type Submission = {
  id: string;
  assignmentId: string;
  student: string;
  submittedAt: string;
  answers: Record<string, string>;
};
export function prepareSheetSubmission(
  value: unknown,
  assignments: SubmissionAssignment[],
  questions: SubmissionQuestion[],
) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid submission.");
  const a = value as Submission;
  if (
    typeof a.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      a.id,
    )
  )
    throw new Error("Invalid submission ID.");
  if (
    typeof a.student !== "string" ||
    !a.student.trim() ||
    a.student.length > 80 ||
    /[\u0000-\u001f]/.test(a.student)
  )
    throw new Error("Enter a valid student name.");
  if (
    typeof a.submittedAt !== "string" ||
    a.submittedAt.length > 40 ||
    !Number.isFinite(Date.parse(a.submittedAt))
  )
    throw new Error("Invalid submission time.");
  const assignment = assignments.find((x) => x.id === a.assignmentId);
  if (!assignment) throw new Error("Unknown assignment.");
  if (
    !a.answers ||
    typeof a.answers !== "object" ||
    Array.isArray(a.answers) ||
    Object.keys(a.answers).some((id) => !assignment.questionIds.includes(id)) ||
    Object.values(a.answers).some(
      (answer) => typeof answer !== "string" || answer.length > 200,
    )
  )
    throw new Error("Invalid answers.");
  const results = assignment.questionIds.map((id) => {
    const q = questions.find((x) => x.id === id);
    if (!q) throw new Error("Question unavailable.");
    const answer = a.answers[id] || "";
    return {
      id,
      number: q.number,
      answer,
      correctAnswer: q.answer,
      correct: gradeAnswer(q, answer),
    };
  });
  const score = results.filter((q) => q.correct).length;
  return {
    id: a.id,
    assignmentId: assignment.id,
    assignment: assignment.title,
    division: assignment.division,
    student: a.student.trim(),
    submittedAt: new Date(a.submittedAt).toISOString(),
    receivedAt: new Date().toISOString(),
    score,
    total: results.length,
    percentage: Math.round((score / results.length) * 100),
    results,
  };
}
