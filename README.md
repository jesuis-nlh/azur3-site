# 12A3 — Hơn cả một lớp học

Kho lưu trữ số và kỷ yếu tương tác của lớp 12A3, THPT Chuyên Lê Quý Đôn Đà Nẵng, khoá 2022–2025.
A digital archive and interactive yearbook: timeline, photo and video archive, people
directory, class journal, legacy, a page-turning yearbook, moderated contributions, an admin
CMS and an import pipeline for photo folders and Facebook exports.

> **Status:** the software is complete and tested; the *content* is not. Almost every record
> is a clearly-labelled placeholder (`demo: true`, "Mẫu" badge). Real photos, stories and
> consents must come from the class. See `docs/QA-REPORT.md`.

## Quick start

```bash
npm install
cp .env.example .env.local     # set ADMIN_PASSWORD, SESSION_SECRET (≥32 chars), CONTRIBUTOR_CODE
npm run dev                    # http://localhost:3000 — admin at /admin
```

| Command | What it does |
|---|---|
| `npm run build` / `npm start` | production build / server |
| `npm test` | unit tests (governance, sessions, markdown safety, ingestion, form mapping) |
| `npm run lint` | TypeScript check |
| `npm run ingest -- --source <dir> --kind folder\|facebook --label "…"` | build a review batch |
| `npm run placeholders` | regenerate the abstract placeholder plates |

## Sections

| URL | Section |
|---|---|
| `/` | Mở đầu — opening with the orbit of memories |
| `/cau-chuyen` | Câu chuyện — seven chapters, linked to the timeline |
| `/dong-thoi-gian` (+ `/[slug]`) | Dòng thời gian — filter, search, jump to year, event pages |
| `/ky-uc` (+ `/[slug]`) | Ký ức — albums, masonry, lightbox, slideshow |
| `/thuoc-phim` (+ `/[slug]`) | Thước phim — click-to-load YouTube/Vimeo/file player |
| `/chung-ta` (+ `/[slug]`) | Chúng ta — "12A3" constellation + directory with privacy levels |
| `/nhat-ky` (+ `/[slug]`, `/chuyen-muc/[c]`) | Nhật ký lớp — journal with reading progress |
| `/di-san` | Di sản — achievements, verified vs. awaiting verification |
| `/ky-yeu` | Kỷ yếu — page-turning digital yearbook (`#trang-N` deep links) |
| `/dong-gop` | Đóng góp — moderated submissions, removal requests |
| `/tim-kiem` | Tìm kiếm — diacritic-insensitive search |
| `/quyen-rieng-tu` | Privacy policy |
| `/admin` | CMS, moderation, imports (password-protected) |

## Documentation

- `docs/ARCHITECTURE.md` — stack, data model, storage, security, deployment options
- `docs/INGESTION.md` — importing photo folders and Facebook exports
- `docs/OPERATIONS.md` — running the archive: moderation, removals, backups
- `docs/QA-REPORT.md` — what was tested, measured results, scorecard, limitations
- `.claude/skills/class-digital-archive/` — the project Skill for future development
