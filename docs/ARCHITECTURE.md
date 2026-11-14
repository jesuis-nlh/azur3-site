# Architecture

## Stack

Next.js 16 (App Router, React 19, TypeScript), plain CSS with design tokens (no CSS framework),
`sharp` for images, `exifr` for EXIF. No database server, no paid services, no analytics.
No Three.js: the cosmic layer is one canvas + SVG (see the Skill's design-system reference for
the reasoning).

## Data

- Model: `lib/types.ts`. Collections: events, albums, videos, articles, profiles, legacy,
  submissions, imports, batches, audit.
- Store: `lib/store.ts` — a JSON file at `DATA_DIR/archive.json` (default `./.data`), seeded
  from `content/seed.ts` on first write. Writes are serialised and atomic (temp + rename).
  Uploads live in `DATA_DIR/uploads/` (originals private, WebP previews generated).
- Every public read goes through `lib/queries.ts` → `isPublic()` / `redactProfile()`.

**Why a file store:** a class archive is small (thousands of records, not millions), edited by a
handful of people, and must stay readable for decades. A JSON file + folder of images is
trivially backed up, diffed and migrated. **Limitation:** it needs a persistent disk and a single
server process. It does not work on serverless platforms with ephemeral filesystems (Vercel,
Netlify functions) — reads fall back to the seed and writes fail with a clear error.

Deployment options:
1. **Single VPS / Render / Railway with a persistent disk** (recommended for this design):
   `npm run build && npm start`, `DATA_DIR` on the persistent volume.
2. **Serverless**: replace `lib/store.ts` (`readDb`/`mutate`) with a database adapter
   (e.g. Postgres/Supabase) and `lib/uploads.ts` with object storage (S3/R2/Blob). The rest of
   the app only uses those two modules.

Videos are never stored in the repo or the store: they are linked from YouTube/Vimeo or an
https file URL.

## Security

- Admin: `ADMIN_PASSWORD`; session = HMAC-SHA256-signed cookie (`SESSION_SECRET`), httpOnly,
  SameSite=Strict, Secure in production, 8h expiry. Login attempts throttled (5 → 60s lock).
- `proxy.ts` guards `/admin/*` and `/api/admin/*`; every server action also calls
  `requireAdmin()` (defence in depth).
- `/api/contribute`: contributor code (constant-time compare), 8 req / 10 min per IP,
  honeypot, type/size validation (MIME with extension fallback), 20 files max.
- `/media/u/*`: serves only files referenced by public records (or to admins); traversal-safe.
- Markdown renderer builds React elements from a parsed AST — no raw HTML, `javascript:` and
  protocol-relative links dropped.
- Security headers in `next.config.ts`. Admin pages are `noindex` and `no-store`.
- Secrets only via environment variables; `.env*` is git-ignored.

Limitations: rate limits and login throttling are in-memory (reset on restart, per process);
there is a single shared admin password (no per-editor accounts or roles); no CSRF token
beyond SameSite=Strict + Next's server-action origin checks.

## Front end

- `app/(site)/layout.tsx`: cosmos background, header, footer, interaction island.
- `components/cosmic/Interactions.tsx`: one IntersectionObserver for all reveals, cursor halo,
  magnetic buttons — a single small client island instead of many.
- Client components only where interaction requires it (timeline filters, gallery, yearbook,
  people search, forms, player). Everything else is server-rendered and works without JS.
