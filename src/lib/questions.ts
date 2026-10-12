export const choiceKeys = ["A", "B", "C", "D"] as const;
export type ChoiceKey = (typeof choiceKeys)[number];
export const divisions = ["Elementary", "Junior", "Intermediate", "Senior"];
export const categories = [
  "Computer Number Systems",
  "Boolean Algebra",
  "Data Structures",
  "Computer Organization",
  "Prefix / Infix / Postfix",
  "Graph Theory",
  "Digital Electronics",
];
export type Question = {
  id: string;
  year: string;
  contest: string;
  division: string;
  category: string;
  type: "Multiple Choice";
  text: string;
  choices: Record<ChoiceKey, string>;
  correctAnswer: ChoiceKey;
  explanation: string;
  points: number;
  sourcePdf: string;
  questionNumber: number;
};

export const sampleQuestions: Question[] = [
  {
    id: "Q001",
    year: "2021-2022",
    contest: "Contest 1",
    division: "Intermediate",
    category: "Computer Number Systems",
    type: "Multiple Choice",
    text: "Convert the binary number 101101 to decimal.",
    choices: { A: "43", B: "45", C: "47", D: "53" },
    correctAnswer: "B",
    explanation: "32 + 8 + 4 + 1 = 45.",
    points: 1,
    sourcePdf: "",
    questionNumber: 3,
  },
  {
    id: "Q002",
    year: "2021-2022",
    contest: "Contest 2",
    division: "Intermediate",
    category: "Boolean Algebra",
    type: "Multiple Choice",
    text: "Simplify the expression A + A · B.",
    choices: { A: "B", B: "A · B", C: "A", D: "A + B" },
    correctAnswer: "C",
    explanation: "The absorption law states that A + A · B = A.",
    points: 1,
    sourcePdf: "",
    questionNumber: 1,
  },
  {
    id: "Q003",
    year: "2022-2023",
    contest: "Contest 3",
    division: "Junior",
    category: "Data Structures",
    type: "Multiple Choice",
    text: "Which data structure follows a first-in, first-out order?",
    choices: { A: "Stack", B: "Tree", C: "Graph", D: "Queue" },
    correctAnswer: "D",
    explanation: "A queue removes items in the order they were added.",
    points: 1,
    sourcePdf: "",
    questionNumber: 2,
  },
];

export function validateQuestion(q: Question): string | null {
  if (
    !/^\d{4}-\d{4}$/.test(q.year) ||
    Number(q.year.slice(5)) !== Number(q.year.slice(0, 4)) + 1
  )
    return "Enter consecutive years, for example 2021-2022.";
  if (
    !q.text.trim() ||
    !q.explanation.trim() ||
    choiceKeys.some((k) => !q.choices[k].trim())
  )
    return "Question text, all four choices, and explanation are required.";
  if (
    new Set(choiceKeys.map((k) => q.choices[k].trim().toLowerCase())).size !== 4
  )
    return "Each choice must have a different answer.";
  if (!choiceKeys.includes(q.correctAnswer)) return "Select a correct answer.";
  if (
    !Number.isInteger(q.points) ||
    q.points < 1 ||
    !Number.isInteger(q.questionNumber) ||
    q.questionNumber < 1
  )
    return "Points and question number must be positive whole numbers.";
  if (
    !divisions.includes(q.division) ||
    !categories.includes(q.category) ||
    !/^Contest [1-4]$/.test(q.contest) ||
    q.type !== "Multiple Choice"
  )
    return "Select valid question metadata.";
  if (q.sourcePdf) {
    try {
      const url = new URL(q.sourcePdf);
      if (url.protocol !== "https:") return "Source PDF must be an HTTPS URL.";
    } catch {
      return "Source PDF must be an HTTPS URL.";
    }
  }
  return null;
}

export function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== "object") return false;
  const q = value as Question;
  return (
    typeof q.id === "string" &&
    typeof q.year === "string" &&
    typeof q.text === "string" &&
    typeof q.explanation === "string" &&
    typeof q.sourcePdf === "string" &&
    !!q.choices &&
    choiceKeys.every((k) => typeof q.choices[k] === "string") &&
    validateQuestion(q) === null
  );
}
