export { sampleQuestions as questions } from "./questions";

export const assignments = [
  {
    id: "A001",
    title: "Number Systems Practice",
    topic: "Number Systems",
    due: "Oct 19, 2026",
    questions: 10,
    submitted: 3,
    total: 4,
    status: "Open",
  },
  {
    id: "A002",
    title: "Boolean Algebra Review",
    topic: "Boolean Algebra",
    due: "Oct 22, 2026",
    questions: 8,
    submitted: 1,
    total: 4,
    status: "Open",
  },
  {
    id: "A003",
    title: "Data Structures Quiz",
    topic: "Data Structures",
    due: "Oct 9, 2026",
    questions: 10,
    submitted: 4,
    total: 4,
    status: "Closed",
  },
];

export const students = [
  { id: "S001", name: "Alex Kim", division: "Junior", completed: 2, score: 90 },
  {
    id: "S002",
    name: "Jamie Park",
    division: "Junior",
    completed: 2,
    score: 85,
  },
  {
    id: "S003",
    name: "Taylor Lee",
    division: "Intermediate",
    completed: 2,
    score: 95,
  },
  {
    id: "S004",
    name: "Morgan Choi",
    division: "Intermediate",
    completed: 2,
    score: 82.5,
  },
];

export const scores = [
  {
    student: "Alex Kim",
    assignment: "Number Systems Practice",
    earned: 9,
    possible: 10,
  },
  {
    student: "Jamie Park",
    assignment: "Number Systems Practice",
    earned: 8,
    possible: 10,
  },
  {
    student: "Taylor Lee",
    assignment: "Number Systems Practice",
    earned: 10,
    possible: 10,
  },
  {
    student: "Morgan Choi",
    assignment: "Boolean Algebra Review",
    earned: 6,
    possible: 8,
  },
  {
    student: "Alex Kim",
    assignment: "Data Structures Quiz",
    earned: 9,
    possible: 10,
  },
  {
    student: "Jamie Park",
    assignment: "Data Structures Quiz",
    earned: 9,
    possible: 10,
  },
  {
    student: "Taylor Lee",
    assignment: "Data Structures Quiz",
    earned: 9,
    possible: 10,
  },
  {
    student: "Morgan Choi",
    assignment: "Data Structures Quiz",
    earned: 9,
    possible: 10,
  },
];
