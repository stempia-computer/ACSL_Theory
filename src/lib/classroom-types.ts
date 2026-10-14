export type Division = "Classroom" | "Junior" | "Intermediate" | "Senior";
export type Member = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  role: "admin" | "teacher" | "student";
  division?: Division;
  grade?: string;
  address?: string;
  phone?: string;
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

export function isStaff(member: Pick<Member, "role">) {
  return member.role === "admin" || member.role === "teacher";
}
