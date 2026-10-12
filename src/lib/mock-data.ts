export const questions = [
  {
    id: "Q001",
    topic: "Number Systems",
    prompt: "Convert the binary number 101101 to decimal.",
    difficulty: "Beginner",
    answer: "45",
  },
  {
    id: "Q002",
    topic: "Boolean Algebra",
    prompt: "Simplify the expression A + A · B.",
    difficulty: "Intermediate",
    answer: "A",
  },
  {
    id: "Q003",
    topic: "Data Structures",
    prompt: "Which data structure follows a first-in, first-out order?",
    difficulty: "Beginner",
    answer: "Queue",
  },
  {
    id: "Q004",
    topic: "Computer Organization",
    prompt: "How many distinct values can an unsigned 8-bit integer represent?",
    difficulty: "Beginner",
    answer: "256",
  },
  {
    id: "Q005",
    topic: "Prefix / Infix / Postfix",
    prompt: "Write A + B * C in postfix notation.",
    difficulty: "Intermediate",
    answer: "A B C * +",
  },
  {
    id: "Q006",
    topic: "Graph Theory",
    prompt: "What is the sum of vertex degrees in a graph with 7 edges?",
    difficulty: "Intermediate",
    answer: "14",
  },
];

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
