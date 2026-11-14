# QA report

Date: November 2026 · Build: Next.js 16.4.6 production build (`next start`) · Browser: Chromium via Playwright.
Every number below was measured in this session; anything not measured is listed as such.

## 1. Tool audit

| Tool | Status in this session | Used |
|---|---|---|
| GitHub (git push to `jesuis-nlh/azur3-site`) | available | yes — branch + PR |
| Playwright + Chromium | available | yes — screenshots, e2e suites |
| Lighthouse 12 (installed in scratch dir) | available | yes — 7 pages × mobile/desktop |
| npm registry, Google Fonts | available | yes |
| Figma, Canva, Notion, Linear and ~40 other connectors | failed to connect (proxy 403) | no |
| Higgsfield, Vercel, Supabase MCP | appeared late in the session | not used — no generated imagery of real events; no deployment authorised |
| Bloom | not present | no |

## 2. Automated tests

| Suite | Result |
|---|---|
| `npm test` (unit: governance gate, profile exposure, sessions/tampering/expiry, Vietnamese folding, Facebook mojibake, fuzzy dates, markdown safety, video URLs, ingestion parsing/dHash/date inference, admin form mapping) | **14/14 pass** |
| `qa/e2e-public.mjs` (skip link, cursor states, magnetic CTA, orrery labels, timeline search/filter/empty state/year jump, lightbox keys/wrap/focus return/slideshow, yearbook keys/End/index/deep links, form validation & focus, removal without code, search, touch: no cursor + menu lock/Esc/focus return, reduced motion: no effects/all content visible/static orrery, no page errors) | **38/38 pass** |
| `qa/e2e-admin.mjs` (redirect when signed out, wrong/right password, private preview visible to admin, approve → draft, draft not public, publish → public, preview public / original private, archive → 404 page + 404 image, import batch → review → draft album, audit log, logout, admin API 401, no page errors) | **19/19 pass** |
| API checks with curl (wrong code, bad type, honeypot, rate limit 429 after 8, unreviewed files 404, path traversal 404, preview has no EXIF) | all as expected |
| Ingest CLI on sample data (exact duplicate skipped, corrupt file reported, Facebook mojibake repaired, inferred dates marked approximate) | as expected |

## 3. Lighthouse (measured)

| Page | Mobile perf | Desktop perf | A11y | Best pr. | SEO | Mobile LCP | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 88 | 100 | 100 | 100 | 100 | 3.7 s | 0 |
| `/dong-thoi-gian` | 91 | 99 | 100 | 100 | 100 | 3.5 s | 0 |
| `/nhat-ky/vi-sao-…` | 87 | 100 | 100 | 100 | 100 | 3.9 s | 0 |
| `/ky-uc` | 88 | 99 | 100 | 100 | 100 | 3.9 s | 0 |
| `/chung-ta` | 90 | 100 | 100 | 100 | 100 | 3.5 s | 0 |
| `/ky-yeu` | 89 | 100 | 100 | 100 | 100 | 3.6 s | 0 |
| `/dong-gop` | 89 | 100 | 100 | 100 | 100 | 3.6 s | 0 |

Mobile = Lighthouse default (simulated slow 4G, 4× CPU). Desktop LCP 0.7–1.0 s. TBT ≤ 50 ms.
Mobile LCP is above the 2.5 s "good" threshold; the LCP element is web-font display text.
Lighthouse runs were local (TTFB ≈ 450 ms simulated) — real-world field data does not exist yet.

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
| Photography & media presentation | 15 | 9 | lightbox/masonry/slideshow work; zero real photos; video player not tested with a real URL in-browser |
| Motion & interaction | 10 | 9 | purposeful, reduced-motion safe, 38 interaction checks pass |
| Information architecture & discovery | 10 | 9 | timeline filters, search, cross-links, year jumps |
| Responsive & accessibility | 10 | 9 | a11y 100 on 7 pages; 4 widths checked; no manual screen-reader pass |
| Technical quality & performance | 10 | 8 | tests + e2e green; mobile LCP 3.5–3.9 s; file store needs persistent disk |
| Vietnamese copy & factual accuracy | 5 | 4 | no invented facts; copy not yet reviewed by a classmate |
| **Total** | 100 | **79** | below the 90 gate |

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
| Technical performance | 5 | 4 |
| **Total** | 100 | **85** — below the 90 gate |

## 6. What would close the gap

1. Real material: ~10 real albums with consent, 5–10 real stories, real teacher/student
   profiles, verified legacy items, at least one real video → storytelling and media scores.
2. A classmate reviewing all Vietnamese copy.
3. Deploying on a host with a persistent disk (or swapping the store adapter) and measuring field
   Core Web Vitals.
4. Mobile LCP: subset the display font to the glyphs used in headlines, or self-host a variable
   font; consider a system-font first paint for the hero.
5. A manual screen-reader pass (VoiceOver/TalkBack) of timeline, lightbox and yearbook.

## 7. Demonstration-only / not implemented

- All seed events, albums, videos, profiles and most legacy items are placeholders (`demo`).
- English version: navigation carries English labels; content is Vietnamese only.
- Per-editor admin accounts/roles, member login for "restricted" content: not implemented
  (single admin password; restricted = admin-only).
- Video upload hosting: links only (YouTube/Vimeo/https file) by design.
- HEIC previews depend on the server's libvips build; originals are kept regardless.
- No deployment was made; nothing was published.
