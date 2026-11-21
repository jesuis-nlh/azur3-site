# QA report

Date: November 2026 · Build: Next.js 16.4.6 production build (`next start`) · Browser: Chromium via Playwright.
Every number below was measured in this session; anything not measured is listed as such.

## 1. Tool audit

| Tool | Status in this session | Used |
|---|---|---|
| GitHub (git push to `jesuis-nlh/azur3-site`) | available | yes — all work on `claude/stoic-hopper-rj87ft` |
| Playwright + Chromium | available | yes — screenshots, e2e suites |
| Lighthouse 12 (installed in scratch dir) | available | yes — 7 pages × mobile/desktop, DevTools throttling |
| npm registry, Google Fonts | available | yes |
| Vercel connector | read-only subset (view deployments, AI Gateway, Drive) | checked: repo not linked; no create-project/deploy tools; `api.vercel.com` blocked by the network proxy; no token → **not deployed** (see `docs/DEPLOY.md`) |
| Figma, Canva, Notion, Linear and ~40 other connectors | failed to connect (proxy 403) | no |
| Higgsfield, Supabase | intermittently available | not used — no generated imagery of real events; no database authorised |
| Bloom | not present | no |

## 2. Automated tests

| Suite | Result |
|---|---|
| `npm test` (unit: governance gate, profile exposure, sessions/tampering/expiry, Vietnamese folding, Facebook mojibake, fuzzy dates, markdown safety, video URLs, ingestion parsing/dHash/date inference, admin form mapping) | **14/14 pass** |
| `qa/e2e-public.mjs` (skip link, cursor states, magnetic CTA, orrery motion + labels, timeline search/filter/empty state/year jump, lightbox keys/wrap/focus return/slideshow, yearbook keys/End/index/deep links, form validation & focus, removal without code, search, **link navigation opens at top + Back restores position**, touch: no cursor + menu lock/Esc/focus return, reduced motion: no effects/all content visible/static orrery, no page errors) | **41/41 pass** (×3 consecutive runs) |
| `qa/e2e-admin.mjs` (redirect when signed out, wrong/right password, private preview visible to admin, approve → draft, draft not public, publish → public, preview public / original private, archive → 404 page + 404 image, import batch → review → draft album, audit log, logout, admin API 401, no page errors) | **19/19 pass** |
| `qa/e2e-video.mjs` (real YouTube + mp4 URLs: **no request to YouTube/Google before play**, keyboard play loads `youtube-nocookie.com` embed with title + fullscreen, native `<video controls preload=none>`, waiting state) | **12/12 pass** — embed verified, actual playback not (YouTube unreachable from the sandbox) |
| `qa/a11y-structure.mjs` (17 public pages: lang, landmarks, exactly one h1, no heading-level jumps, alt on every image, named links/buttons/fields, unique ids + ARIA snapshots of lightbox/yearbook/timeline) | **17/17 clean** |
| Read-only deployment simulation (store unreachable, as on Vercel) | 7/7 public pages 200 from the seed; `/dong-gop` shows the preview notice; API 503; admin warns and save reports the error |
| API checks with curl (wrong code, bad type, MIME fallback, honeypot, rate limit 429 after 8, unreviewed files 404, path traversal 404, preview has no EXIF) | all as expected |
| Ingest CLI on sample data (exact duplicate skipped, corrupt file reported, Facebook mojibake repaired, inferred dates marked approximate) | as expected |

## 3. Lighthouse (measured, final build)

DevTools throttling (real slow-4G + 4× CPU applied to the browser, not the Lantern estimate).

| Page | Mobile perf | Desktop perf | A11y | Best pr. | SEO | Mobile FCP | Mobile LCP | Mobile TBT | CLS (max) |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 96 | 99 | 100 | 100 | 100 | 0.9 s | 2.0 s | 220 ms | 0.045 |
| `/dong-thoi-gian` | 86 | 100 | 100 | 100 | 100 | 1.1 s | 2.3 s | 470 ms | 0.018 |
| `/nhat-ky/vi-sao-…` | 98 | 100 | 100 | 100 | 100 | 1.0 s | 1.7 s | 140 ms | 0 |
| `/ky-uc` | 88 | 99 | 100 | 100 | 100 | 0.8 s | 1.8 s | 460 ms | 0 |
| `/chung-ta` | 93 | 99 | 100 | 100 | 100 | 0.9 s | 2.4 s | 250 ms | 0 |
| `/ky-yeu` | 87 | 99 | 100 | 100 | 100 | 0.8 s | 1.7 s | 520 ms | 0.022 |
| `/dong-gop` | 96 | 100 | 100 | 100 | 100 | 0.8 s | 1.8 s | 210 ms | 0 |

All mobile LCPs are under the 2.5 s "good" threshold; desktop LCP 0.5–1.0 s. Remaining cost:
mobile TBT 140–520 ms (React hydration on a 4×-slowed CPU) — the lab proxy for responsiveness on
low-end phones. Local server, so TTFB is near zero; real hosting adds network latency. No field
(real-user) data exists yet.

How the numbers moved (each step measured, one variable at a time):

| Change | Effect |
|---|---|
| Orrery animates by writing SVG attributes instead of React state; starts on idle | home LCP 3.6 → 2.2 s, main-thread 9.5 → ~7 s |
| Hero entrance delay 700 → 200 ms | home LCP held at 2.2 s under real throttling |
| Above-the-fold content never hidden by scroll reveals; eager responsive yearbook image | `/ky-yeu` 4.5 → 2.5 s, `/ky-uc` 3.7 → 2.2 s, timeline desktop 1.9 → 0.3 s |
| `experimental.inlineCss` (render-blocking CSS lost bandwidth races to font preloads) | LCP flapping 2.2–3.4 s → stable |
| No font preloads once CSS is inlined | worst mobile LCP 3.4 → ≤ 2.4 s; FCP ~1.0 → ~0.8 s; cost: CLS ≤ 0.045 from font swap |
| Rejected (measured, no effect or net loss): disabling hero animations, removing the page-enter fade, preloading only one font family | reverted |

The first Lighthouse table in this project (LCP 3.5–3.9 s) used the default simulated throttling,
which charged JS boot-up to LCP even though the real trace painted LCP at ~0.28 s. Report devtools
numbers; see the Skill's `references/qa.md`.

## 4. Visual QA — three passes (screenshots reviewed)

Widths inspected: 390, 768, 1024, 1440. Horizontal overflow measured on every capture: 0 after pass 1.

**Pass 1 — composition.** Found and fixed: orrery viewBox wasted vertical space and clipped year
labels on mobile; decorative hero orbit caused 10 % horizontal overflow on all inner pages;
`mask` reveal never fired (clip-path on the observed element) → prologue plate and article
cover invisible; prose paragraphs had no spacing (specificity bug); timeline milestone star
landed inside left-hand cards; form legends rendered at label size; directory search lacked
its icon; Cormorant old-style figures made "1" read as "I" → lining figures globally.

**Pass 2 — interaction.** Found and fixed: yearbook deep links failed after in-page navigation
(Next.js App Router restores its URL on `popstate`; the yearbook now reads the hash on
`popstate` and derives the URL from state); mobile menu let the page show through
(`backdrop-filter` made the header the containing block of the fixed panel); lightbox image
overflowed the viewport and its metadata list broke. Verified: halo never hides the native
cursor, is absent on touch and with reduced motion.

**Pass 3 — performance/accessibility/polish.** Lighthouse-driven: trimmed display font to one
weight and stopped preloading the mono face (fonts 271 KB → ~205 KB; mobile LCP −0.5 to −0.9 s),
removed the full-page blur transition, took the article cover out of the scroll reveal, added
the favicon (console 404), fixed restricted-card contrast and the brand link's accessible name
(WCAG 2.5.3) → accessibility 100 on all measured pages.

**Pass 4 — behaviour found by new tests (after the first report).** Link navigation landed
300–440 px down every new page (Next 16 no longer neutralises CSS smooth scrolling unless
`<html data-scroll-behavior="smooth">`); the skip link's slide-in could start late during
hydration (now instant); card titles were `<span>`s, so screen-reader users could not jump
between articles/events (now real headings: timeline h1 › h2 year › h3 event); yearbook folios
were read aloud (now hidden from AT); a read-only store turned every public page into a 500
(now falls back to the seed); a hanging filesystem could hang the contribute page (check is
now bounded to 1 s).

## 5. Scorecards (honest)

The briefs require ≥ 90/100. **The build does not reach that bar yet**, and the main reason is
not code: there is no real class content. Scoring photography or storytelling as if
placeholder plates were memories would be dishonest.

### Master brief

| Category | Max | Score | Basis |
|---|---|---|---|
| Art direction & originality | 15 | 13 | coherent astronomical-publication system; orrery and 12A3 constellation are bespoke |
| Storytelling & emotional impact | 15 | 9 | structure is there (chapters, timeline, yearbook); real stories are not |
| Typography & layout | 10 | 9 | strong hierarchy, Vietnamese-first faces, asymmetric layouts |
| Photography & media presentation | 15 | 10 | lightbox/masonry/slideshow and real-URL video embed verified; zero real photos |
| Motion & interaction | 10 | 9 | purposeful, reduced-motion safe, 41 interaction checks pass |
| Information architecture & discovery | 10 | 9 | timeline filters, search, cross-links, year jumps |
| Responsive & accessibility | 10 | 9 | Lighthouse a11y 100 ×14; structural audit 17/17; 4 widths; no manual screen-reader pass |
| Technical quality & performance | 10 | 9 | 105 automated checks green; mobile LCP ≤ 2.4 s; TBT up to 520 ms; file store needs a persistent disk |
| Vietnamese copy & factual accuracy | 5 | 4 | no invented facts; copy not yet reviewed by a classmate |
| **Total** | 100 | **81** | below the 90 gate |

### Cosmic transformation brief

| Category | Max | Score |
|---|---|---|
| Cosmic art direction & originality | 20 | 17 |
| Typography, layout & hierarchy | 15 | 13 |
| Background & atmosphere | 15 | 13 |
| Interactivity & cursor | 15 | 12 |
| Motion & 3D | 10 | 7 (2D depth only, deliberately no WebGL) |
| Preservation of functionality | 10 | 10 (built together; all suites green) |
| Responsive & accessibility | 10 | 9 |
| Technical performance | 5 | 5 |
| **Total** | 100 | **86** — below the 90 gate |

## 6. What would close the gap

1. Real material: ~10 real albums with consent, 5–10 real stories, real teacher/student
   profiles, verified legacy items, at least one real video → storytelling and media scores.
2. A classmate reviewing all Vietnamese copy.
3. Deploying on a host with a persistent disk (or swapping the store adapter for a database +
   blob storage) and measuring field Core Web Vitals.
4. Mobile TBT: fewer/lighter client islands on the heaviest pages (timeline, memories, yearbook).
5. A manual screen-reader pass (VoiceOver/TalkBack) of timeline, lightbox and yearbook.

## 7. Demonstration-only / not implemented

- All seed events, albums, videos, profiles and most legacy items are placeholders (`demo`).
- English version: navigation carries English labels; content is Vietnamese only.
- Per-editor admin accounts/roles, member login for "restricted" content: not implemented
  (single admin password; restricted = admin-only).
- Video upload hosting: links only (YouTube/Vimeo/https file) by design.
- HEIC previews depend on the server's libvips build; originals are kept regardless.
- **Not deployed.** Vercel could not be reached from this environment (see section 1). The repo is
  ready to import on Vercel as a read-only preview — `docs/DEPLOY.md`. On Vercel the admin and
  contributions cannot persist (read-only filesystem); real operation needs a persistent disk or
  a database adapter.
- `experimental.inlineCss` is an experimental Next.js flag; it repeats the CSS in the RSC payload
  (~52 KB gzipped HTML on `/chung-ta`) and disables cross-page CSS caching.
