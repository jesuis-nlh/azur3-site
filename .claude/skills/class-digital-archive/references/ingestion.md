# Ingestion

`npm run ingest -- --source <dir> --kind folder|facebook --label "<label>"` (set `DATA_DIR` to
match the server). Output: `DATA_DIR/inbox/<batch>.json` + processed files in
`DATA_DIR/uploads/imports/<batch>/`. Nothing is published.

Pipeline: walk → SHA-256 exact dedupe (within batch; against archive on load) → dHash
near-duplicate flag (Hamming ≤ 6) → EXIF `DateTimeOriginal` → date inference → previews
(1800w/640w WebP, EXIF stripped) → review queue in `/admin/imports` → accept → **draft** album.

Date rules (`inferEventDate`): EXIF → day precision but `approximate`; Facebook upload time →
`publishedAt` + month-precision approximate event date + issue; nothing → no date. Camera
clocks before 1990 are ignored.

Facebook: use "Download your information" (JSON). Parsers accept post files
(`your_posts_*.json`) and album files (`album/*.json`). Never scrape, never use someone
else's export without permission. Videos are listed for review but not stored — upload them to
an authorised host and paste the URL.

When extending: keep logic in `lib/ingest-core.ts` (pure, `.ts` imports with extensions so
Node can run it) and add a test in `tests/ingest.test.ts`.
