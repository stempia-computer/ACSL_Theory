import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/import-contest-pdfs.mjs /tmp/acsl-contests");
const extraSolutions = process.argv.slice(3);

const problemRoots = ["z1", "z4", "z5", "z7", "z10"];
const solutionRoots = ["z2", "z3", "z6", "z8", "z9"];
const output = new URL("../public/contest-pdfs/", import.meta.url);
mkdirSync(output, { recursive: true });

function files(root) {
  const found = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name.toLowerCase().endsWith(".pdf")) found.push(path);
    }
  }
  visit(join(source, root));
  return found;
}

function identity(path) {
  const name = basename(path).toLowerCase().replaceAll(" ", "_");
  const divisionCode = name.match(/_(cl|jr|in|sr)(?:_sol)?\.pdf$/)?.[1];
  let seasonCode = name.match(/(?:sol_)?(2021|2122|2223|2324|2425|2526|2426|2624)/)?.[1];
  if (!divisionCode || !seasonCode) throw new Error(`Unrecognized filename: ${path}`);
  if (seasonCode === "2426") seasonCode = "2425";
  if (seasonCode === "2624") seasonCode = "2324";
  const contest = name.includes("_all_") ? "all-star" : `contest-${name.match(/c_?(\d)/)?.[1]}`;
  const division = { cl: "Classroom", jr: "Junior", in: "Intermediate", sr: "Senior" }[divisionCode];
  const season = seasonCode === "2021" ? "2020-2021" : `20${seasonCode.slice(0, 2)}-20${seasonCode.slice(2)}`;
  return { id: `${seasonCode}-${contest}-${divisionCode}`, seasonCode, season, contest, division };
}

function text(path) {
  return execFileSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8", maxBuffer: 10_000_000 });
}

function categoryName(value) {
  const clean = value.replace(/[\u200b-\u200d\ufeff]/g, "").replace(/\s+[A-E]\..*$/, "").replace(/\s+/g, " ").trim();
  if (/^Computer Number System/i.test(clean)) return "Computer Number Systems";
  if (/^Recursive (Functions|Number Systems)/i.test(clean)) return "Recursive Functions";
  if (/^Prefix|Infix.*Postfix/i.test(clean)) return "Prefix/Infix/Postfix Notation";
  if (/^What Does ?This Program Do/i.test(clean)) return "What Does This Program Do?";
  if (/^(FSA|FSAs|Regular Expressions)/i.test(clean)) return "FSAs and Regular Expressions";
  if (/^LISP/i.test(clean)) return "LISP";
  if (/^Assembly Language/i.test(clean)) return "Assembly Language";
  return clean;
}

function problemQuestions(path) {
  const pages = text(path).split("\f");
  const questions = [];
  for (let page = 0; page < pages.length; page++) {
    const lines = pages[page].split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\s*(\d+)\.\s*(.*\S)?\s*$/);
      if (!match) continue;
      let number = Number(match[1]);
      if (!number) continue;
      // One source PDF labels question 7 as 3. A repeated heading after a
      // consecutive run is the next question; numbered steps have no category.
      if (questions.some((q) => q.number === number) && match[2]) number = questions.at(-1).number + 1;
      if (questions.some((q) => q.number === number)) continue;
      const category = categoryName(match[2] || lines.slice(i + 1).find((line) => line.trim()) || "Theory");
      questions.push({ number, category, page: page + 1, correctAnswer: null });
    }
  }
  return questions.sort((a, b) => a.number - b.number);
}

function answers(path) {
  const lines = text(path).split(/\r?\n/);
  const result = new Map();
  // 2020-2021 packets print answers as "1. answer text (C)" on the same line.
  for (const line of lines) {
    const keyed = line.match(/(?:^|\s)(\d+)\..*\(([A-E])\)\s*$/);
    if (keyed) result.set(Number(keyed[1]), keyed[2]);
  }
  const starts = [];
  lines.forEach((line, index) => {
    const match = line.match(/^\s*(\d+)\.\s*(.*\S)?\s*$/);
    if (match) starts.push({ number: Number(match[1]), index });
  });
  starts.forEach((start, i) => {
    if (result.has(start.number)) return;
    const block = lines.slice(start.index, starts[i + 1]?.index ?? lines.length).join("\n");
    const candidates = [...block.matchAll(/(?:^|\s)([A-E])\.[\s​]/gm)];
    if (candidates.length) result.set(start.number, candidates.at(-1)[1]);
    else {
      const parenthetical = [...block.matchAll(/\(([A-E])\)/g)];
      if (parenthetical.length) result.set(start.number, parenthetical.at(-1)[1]);
    }
  });
  return result;
}

const problems = new Map(problemRoots.flatMap(files).map((path) => [identity(path).id, path]));
const solutions = new Map([...solutionRoots.flatMap(files), ...extraSolutions].map((path) => [identity(path).id, path]));
const answerOverrides = new Map(Object.entries({
  "2021-all-star-jr:15": "C",
  "2021-all-star-sr:8": "B",
  "2021-contest-2-jr:2": "B",
  "2324-contest-3-cl:10": "E",
  "2324-contest-3-sr:5": "C",
  "2425-contest-4-cl:9": "B",
  "2425-contest-4-cl:10": "E",
}));
const packets = [];
for (const [id, problem] of [...problems].sort()) {
  const meta = identity(problem);
  const solution = solutions.get(id);
  const key = `${id}`;
  const problemName = `${key}-problems.pdf`;
  const solutionName = solution ? `${key}-solutions.pdf` : null;
  copyFileSync(problem, new URL(problemName, output));
  if (solution) copyFileSync(solution, new URL(solutionName, output));
  const answerMap = solution ? answers(solution) : new Map();
  const questions = problemQuestions(problem).map((question) => ({
    ...question,
    correctAnswer: answerMap.get(question.number) || answerOverrides.get(`${id}:${question.number}`) || null,
  }));
  packets.push({
    ...meta,
    title: `${meta.season} ${meta.contest === "all-star" ? "All-Star" : `Contest ${meta.contest.at(-1)}`} · ${meta.division}`,
    problemPdf: `/contest-pdfs/${problemName}`,
    solutionPdf: solutionName ? `/contest-pdfs/${solutionName}` : null,
    questions,
  });
}

const missingSolutions = [...problems.keys()].filter((id) => !solutions.has(id));
const orphanSolutions = [...solutions.keys()].filter((id) => !problems.has(id));
const report = {
  packets: packets.length,
  questions: packets.reduce((total, packet) => total + packet.questions.length, 0),
  graded: packets.reduce((total, packet) => total + packet.questions.filter((q) => q.correctAnswer).length, 0),
  missingSolutions,
  orphanSolutions,
};
writeFileSync(new URL("../src/data/contest-packets.json", import.meta.url), JSON.stringify(packets, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
