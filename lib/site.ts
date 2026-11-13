/**
 * Project identity. Everything that names the class, school or cohort lives
 * here so another class can reuse the archive by editing one file.
 */
export const site = {
  name: "12A3",
  title: "12A3 — Hơn cả một lớp học",
  titleEn: "12A3 — More Than a Class",
  school: "THPT Chuyên Lê Quý Đôn",
  city: "Đà Nẵng",
  country: "Việt Nam",
  className: "12A3",
  cohort: { start: 2022, end: 2025 },
  schoolYears: ["2022-2023", "2023-2024", "2024-2025"],
  tagline: "Mỗi ký ức là một vì sao. Mỗi câu chuyện là một chòm sao.",
  description:
    "Kho lưu trữ số và kỷ yếu tương tác của lớp 12A3, THPT Chuyên Lê Quý Đôn Đà Nẵng, khoá 2022–2025.",
  /**
   * While true, the site shows a discreet notice that most records are
   * demonstration placeholders. Turn off once real, consented material is in.
   */
  demoMode: true,
  locale: "vi-VN",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const nav = [
  { href: "/cau-chuyen", label: "Câu chuyện", en: "Our Story" },
  { href: "/dong-thoi-gian", label: "Dòng thời gian", en: "Timeline" },
  { href: "/ky-uc", label: "Ký ức", en: "Memories" },
  { href: "/thuoc-phim", label: "Thước phim", en: "Moving Memories" },
  { href: "/chung-ta", label: "Chúng ta", en: "The People" },
  { href: "/nhat-ky", label: "Nhật ký lớp", en: "Class Journal" },
  { href: "/di-san", label: "Di sản", en: "Our Legacy" },
  { href: "/ky-yeu", label: "Kỷ yếu", en: "Yearbook" },
] as const;

export function schoolYearLabel(y: string) {
  return y.replace("-", "–");
}
