import type { Division } from "./classroom-types.ts";
export type ImportStudent = {
  name: string;
  grade: string;
  email: string;
  division: Division;
  active: true;
};
export function parseStudents(
  text: string,
  division: Division,
): ImportStudent[] {
  if (!["Classroom", "Junior", "Intermediate", "Senior"].includes(division))
    throw new Error("Division을 선택하세요.");
  const rows: ImportStudent[] = [];
  const emails = new Set<string>();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const cells = (
      line.includes("|")
        ? line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|")
        : line.split("\t")
    ).map((x) => x.trim().replace(/\*\*/g, "").replace(/\\\./g, "."));
    if (cells.every((x) => /^:?-+:?$/.test(x.replace(/\s/g, "")))) continue;
    if (
      cells.length === 3 &&
      /^(name|이름)$/i.test(cells[0]) &&
      /^(email|이메일)$/i.test(cells[2])
    )
      continue;
    const [name, grade, rawEmail] = cells;
    const email = rawEmail?.toLowerCase();
    if (
      cells.length !== 3 ||
      !name ||
      name.length > 80 ||
      /[\u0000-\u001f]/.test(name) ||
      !/^(K|[1-9]|1[0-2])$/.test(grade) ||
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      throw new Error(
        `${index + 1}번째 줄을 확인하세요. 이름 · 학년(K, 1–12) · 이메일 순서로 표를 붙여넣으세요.`,
      );
    if (emails.has(email))
      throw new Error(
        `${index + 1}번째 줄: 명단 안에 같은 이메일이 두 번 있습니다.`,
      );
    emails.add(email);
    rows.push({ name, grade, email, division, active: true });
  }
  if (!rows.length) throw new Error("학생 명단을 붙여넣으세요.");
  if (rows.length > 100)
    throw new Error("한 번에 100명까지 등록할 수 있습니다.");
  return rows;
}
