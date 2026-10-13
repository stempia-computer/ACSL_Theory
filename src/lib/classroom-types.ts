export type Division = "Junior" | "Intermediate" | "Senior";
export type Member = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  role: "teacher" | "student";
  division?: Division;
  grade?: string;
};
export type Result = {
  id: string;
  number: number;
  answer: string;
  correctAnswer: string;
  correct: boolean;
};
export type SavedAttempt = {
  id: string;
  studentId: string;
  email: string;
  student: string;
  assignmentId: string;
  assignment: string;
  division: string;
  submittedAt: string;
  receivedAt: string;
  score: number;
  total: number;
  percentage: number;
  results: Result[];
};
export type Classroom = {
  member: Member;
  students: Member[];
  teachers: Member[];
  attempts: SavedAttempt[];
};
