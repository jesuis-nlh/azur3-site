import type { FuzzyDate } from "./types";

const MONTHS = ["tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6", "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"];

export function formatFuzzy(d?: FuzzyDate): string {
  if (!d) return "Chưa rõ thời gian";
  const [y, m, day] = d.value.split("-");
  let out: string;
  if (d.precision === "year" || !m) out = `Năm ${y}`;
  else if (d.precision === "month" || !day) out = `${capital(MONTHS[Number(m) - 1])}, ${y}`;
  else out = `${Number(day)} ${MONTHS[Number(m) - 1]}, ${y}`;
  return d.approximate ? `Khoảng ${out.charAt(0).toLowerCase()}${out.slice(1)}` : out;
}

export function fuzzyParts(d?: FuzzyDate) {
  if (!d) return { day: "—", month: "—", year: "—" };
  const [y, m, day] = d.value.split("-");
  return { day: day ?? "··", month: m ?? "··", year: y };
}

export function fuzzySortKey(d?: FuzzyDate): string {
  if (!d) return "9999";
  const [y, m = "00", day = "00"] = d.value.split("-");
  return `${y}-${m}-${day}`;
}

export function formatIso(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
}

/** The school year a date belongs to (Vietnamese school years start in September). */
export function schoolYearOf(d: FuzzyDate): string | undefined {
  const [y, m] = d.value.split("-").map(Number);
  if (!m) return undefined;
  const start = m >= 8 ? y : y - 1;
  return `${start}-${start + 1}`;
}

function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
