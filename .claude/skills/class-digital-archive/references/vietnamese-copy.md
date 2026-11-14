# Vietnamese copy

Voice: warm, plain, a little literary — like a classmate who writes well, not a school
announcement and not marketing. Short sentences. Second person "bạn" for visitors; "chúng ta"
for the class.

- Always full diacritics, NFC-normalised. Search uses `foldVietnamese()` so users can type
  without accents; never strip accents from displayed text.
- Use the en dash in ranges: `2022–2025`, `2023–2024`. School years are stored `2022-2023`
  and displayed with `schoolYearLabel()`.
- Dates: "Tháng 11, 2023", "20 tháng 11, 2023", "Năm 2024"; inferred → "Khoảng tháng 11, 2023"
  (use `formatFuzzy`, don't hand-format).
- Labels/eyebrows are uppercase via CSS — write them in sentence case in source.
- Honesty words: "Mẫu" (placeholder), "Cần xác minh", "Chờ xác minh", "Ảnh minh hoạ".
- Avoid: "khoảnh khắc đáng nhớ nhất", superlatives about real people, claims like "cả lớp đều…"
  unless sourced. Don't invent jokes, nicknames or quotes.
- Headlines: one italic warm accent at most — "Hơn cả *một lớp học.*"
- Section names are fixed: Câu chuyện, Dòng thời gian, Ký ức, Thước phim, Chúng ta,
  Nhật ký lớp, Di sản, Kỷ yếu, Đóng góp.
- Teachers: "thầy cô"; never name a teacher without their consent.
- Facebook exports arrive as mojibake ("Ä\u0090Ãªm") — `fixFacebookMojibake()` repairs it.
