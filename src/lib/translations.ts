import pairs from "./translations.json";
export type Language = "en" | "ko";
const en = new Map(pairs.map(([ko, english]) => [ko.trim(), english.trim()]));
const ko = new Map(pairs.map(([korean, english]) => [english.trim(), korean.trim()]));
const aliases: Record<string, string> = {
  "Students · 학생 관리": "학생 관리", "Teachers · 선생님 관리": "선생님 관리",
  "Scores · 점수와 오답": "점수와 오답", "Name · 이름": "이름",
  "Email · 이메일": "이메일", "Grade · 학년": "학년",
};
export function translate(text: string, language: Language): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const source = aliases[normalized] || normalized;
  const translated = language === "en" ? en.get(source) : ko.get(source) || (aliases[normalized] ? source : undefined);
  if (translated !== undefined) return text.replace(text.trim(), translated);
  if (language === "en") {
    const resend = normalized.match(/^(\d+)초 후 재발송$/);
    if (resend) return `Resend in ${resend[1]}s`;
    const result = normalized.match(/^새로 등록 (\d+)명 · 기존 계정 (\d+)명 · 확인 실패 (\d+)명(.*)$/);
    if (result) return `Registered ${result[1]} · Existing ${result[2]} · Failed ${result[3]}${result[4] ? '. Click Register roster again to retry only missing accounts.' : ''}`;
  }
  return text;
}
