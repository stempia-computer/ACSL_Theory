export type AnswerRule = {
  answer: string;
  aliases: string[];
  mode: string;
  base: number | null;
};

function clean(value: string): string {
  return value.normalize("NFKC").trim().toUpperCase().replace(/[−–]/g, "-");
}

function list(value: string): string[] {
  return clean(value)
    .replace(/\bAND\b/g, ",")
    .split(/[,;\s]+/)
    .filter(Boolean);
}

export function gradeAnswer(rule: AnswerRule, input: string): boolean | null {
  if (!input.trim()) return false;
  if (rule.mode === 'manual') return null;
  if (rule.mode === 'lisp') {
    const tokens = (s: string) => clean(s).replace(/^[‘’']/, '').match(/[()]|[^()\s]+/g)?.join(' ');
    return tokens(input) === tokens(rule.answer);
  }
  if (rule.mode === 'letters') {
    const letters = (s: string) => clean(s).replace(/[,\s]+/g, '');
    return letters(input) === letters(rule.answer);
  }
  if (rule.mode === 'tuples' || rule.mode === 'bitpattern') {
    const expand = (s: string): string | null => {
      s = clean(s).replace(/\bAND\b/g, ',');
      let patterns: string[];
      if (rule.mode === 'tuples') {
        const groups = s.match(/\([01*,\s]+\)/g);
        if (!groups || s.replace(/\([01*,\s]+\)/g, '').replace(/[,;\s]/g, '')) return null;
        patterns = groups.map((g) => g.replace(/[(),\s]/g, ''));
      } else patterns = s.split(/[,;\s]+/).filter(Boolean);
      const values = new Set<string>();
      for (const pattern of patterns) {
        if (!/^[01*]{1,12}$/.test(pattern)) return null;
        let expanded = [''];
        for (const bit of pattern) expanded = expanded.flatMap((prefix) => bit === '*' ? [prefix+'0',prefix+'1'] : [prefix+bit]);
        expanded.forEach((v) => values.add(v));
      }
      return [...values].sort().join(',');
    };
    const actual = expand(input);
    return actual !== null && actual === expand(rule.answer);
  }
  if (rule.mode === "fraction") {
    const rational = (value: string): [bigint, bigint] | null => {
      const normalized = clean(value).replace(/\s+/g, "");
      if (normalized.length > 100) return null;
      const fraction = normalized.match(/^(-?\d+)\/(\d+)$/);
      if (fraction)
        return BigInt(fraction[2]) === BigInt(0)
          ? null
          : [BigInt(fraction[1]), BigInt(fraction[2])];
      const decimal = normalized.match(/^(-?)(\d*)(?:\.(\d+))?$/);
      if (!decimal || (!decimal[2] && !decimal[3])) return null;
      const places = decimal[3] || "";
      return [
        BigInt(`${decimal[1]}${decimal[2] || "0"}${places}`),
        BigInt(10) ** BigInt(places.length),
      ];
    };
    const actual = rational(input),
      expected = rational(rule.answer);
    return (
      !!actual &&
      !!expected &&
      actual[0] * expected[1] === expected[0] * actual[1]
    );
  }
  if (rule.mode === "set" || rule.mode === "ordered") {
    const actual = list(input);
    const expected = list(rule.answer);
    if (actual.length !== expected.length) return false;
    if (rule.mode === "set") {
      actual.sort();
      expected.sort();
    }
    return actual.every((value, i) => value === expected[i]);
  }
  const normalize = (value: string) => {
    let result = clean(value).replace(/\s+/g, "");
    if (rule.mode === "number" && rule.base) {
      // Only explicit base notation is stripped. Bare trailing digits remain significant.
      result = result.replace(
        new RegExp(`(?:_${rule.base}|\\(${rule.base}\\))$`),
        "",
      );
      const digits =
        rule.base === 2
          ? "[01]"
          : rule.base === 8
            ? "[0-7]"
            : rule.base === 16
              ? "[0-9A-F]"
              : "[0-9]";
      if (!new RegExp(`^-?${digits}+$`).test(result)) return "INVALID";
      result = result.replace(/^(-?)0+(?=.)/, "$1");
      if (result === "-0") result = "0";
    }
    return result;
  };
  const actual = normalize(input);
  if (actual === "INVALID") return false;
  return [rule.answer, ...rule.aliases].some(
    (answer) => normalize(answer) === actual,
  );
}
