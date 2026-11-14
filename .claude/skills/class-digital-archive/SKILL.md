---
name: class-digital-archive
description: Use for any work on the 12A3 class archive — adding or editing pages, components, content, timeline events, albums, profiles, the ingestion pipeline, admin/CMS, privacy rules, Vietnamese copy, or visual QA. Encodes the project's design system, content-governance rules (consent, provenance, no invented history), and the QA workflow that catches this codebase's known pitfalls.
---

# Class Digital Archive

A Next.js 16 (App Router) archive for lớp 12A3, THPT Chuyên Lê Quý Đôn Đà Nẵng, 2022–2025.
Visual concept: **an astronomical publication** — cool deep space for structure, warm
starlight (`--memory`, ember gold) reserved for human memories.

Read the reference that matches your task before changing anything:

| Task | Read |
|---|---|
| Any UI, layout, motion, new component | `references/design-system.md` |
| Content, metadata, people, publishing, privacy | `references/governance.md` |
| Writing or editing Vietnamese text | `references/vietnamese-copy.md` |
| Importing photos / Facebook exports | `references/ingestion.md` |
| Before saying anything is "done" | `references/qa.md` |

## Non-negotiables

1. **Never invent history.** No made-up events, dates, names, captions, awards or quotes.
   Unknown → leave empty or mark `review: "needs_review"` and add the field to `uncertain`.
   Placeholder records carry `demo: true` and render a "Mẫu" badge.
2. **One public gate.** Public pages read only through `lib/queries.ts`, which filters with
   `isPublic()` (published + public + consent granted/not_required) and `redactProfile()`.
   Never read `readDb()` directly in a public page. Never render `fullName` or `contact`.
3. **Approval ≠ publication.** Moderation creates *drafts*. Publishing is a separate,
   deliberate edit in `/admin`.
4. **Originals stay private.** Public asset URLs point to EXIF-stripped `preview.webp` /
   `thumb.webp`. `/media/u/*` serves a file to visitors only if a public record references it.
5. **Every admin mutation calls `requireAdmin()`** even though `proxy.ts` guards `/admin` —
   server actions are reachable by POST regardless of the page that rendered them.
6. **No generated imagery of real people or events.** Abstract plates
   (`scripts/generate-placeholders.mjs`) are the only generated media.

## Where things live

```
app/(site)/…           public pages (Vietnamese slugs: /dong-thoi-gian, /ky-uc, /chung-ta …)
app/admin/…            CMS; actions.ts holds every server action
app/api/contribute     public submission endpoint (rate-limited, contributor code, honeypot)
app/media/u/[...path]  access-checked media server
components/cosmic      CosmicBackground (canvas), Interactions (reveals/cursor/magnetic), Orrery
lib/types.ts           the data model — start here
lib/governance.ts      isPublic / profileExposure
lib/queries.ts         every public read
lib/admin-schema.ts    field definitions → admin editor is generated from these
lib/ingest-core.ts     pure ingestion logic (tested); scripts/ingest.ts is the CLI
content/seed.ts        seed archive (demo records clearly flagged)
qa/                    shoot.mjs, serve.sh, e2e-public.mjs, e2e-admin.mjs
```

## Workflow for a change

1. Read `lib/types.ts` and the relevant reference.
2. Adding a content field? Add it to `lib/types.ts`, then to `lib/admin-schema.ts` — the
   editor picks it up. Render it publicly only after checking it is safe under rule 2.
3. Adding a page? Put it under `app/(site)/`, use `PageHero`, read via `lib/queries.ts`,
   add an empty state, and add it to `nav` in `lib/site.ts` if it is top-level.
4. Run `npm run lint && npm test && npm run build`.
5. Run the QA loop in `references/qa.md` — screenshots at 390 / 768 / 1024 / 1440 and the
   e2e suites. Look at the screenshots; do not report visual results you did not view.
