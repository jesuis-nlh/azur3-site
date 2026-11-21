# Design system

All tokens live in `app/globals.css` `:root`. Never hard-code a colour, size or easing in a
component — add a token if one is missing.

## Palette and roles

| Token | Hex | Role |
|---|---|---|
| `--c-void` | #070812 | page background |
| `--c-deep` / `--c-indigo` | #0B1026 / #17153A | surfaces, image placeholders |
| `--c-nebula` / `--c-violet` | #50328C / #8B5CF6 | atmosphere only (nebulae, glows) |
| `--c-cyan` | #63D9FF | interaction: focus-adjacent glows, links in prose, active nav dot |
| `--c-star` | #F4F3FF | text, primary buttons |
| `--c-silver` | #A9AEC8 | labels, hairlines |
| `--memory` (ember) | #E7C27A | **human memory only**: italic accents in headlines, milestone stars, legacy marks, the "add a star" CTA |

Rule of thumb: if it is structure or navigation it is cool; if it is a person's memory it is warm.
Do not make sections purple — violet appears only as light in the sky.

## Type

- Display: **Cormorant Garamond 400** (roman + italic) — `.display`, `.h1`–`.h3`. Only one weight
  is loaded on purpose (it is the LCP element on most pages). Do not add weights casually.
- Body: **Be Vietnam Pro** 400/500/600 — designed for Vietnamese diacritics.
- Mono: **JetBrains Mono** — only `.coord` / `.num` (dates, coordinates, folios). Not preloaded.
- `font-variant-numeric: lining-nums` is set on `body`: Cormorant defaults to old-style figures,
  where "1" reads as "I". Keep it.
- Italic `<em>` inside display headings = the warm accent. One accent per headline.

Scale: `--t-display-xl`, `--t-display-l`, `--t-h1`, `--t-h2`, `--t-h3`, `--t-lede`, `--t-body`
(fluid `clamp`). Reading measure for prose: `--read` (66ch).

## Space, layout, breakpoints

4px base (`--s-1`…`--s-11`), `--section` for vertical rhythm, `.shell` container
(`--max` 1320 + `--gutter`). Breakpoints used: 640, 700, 900, 1000, 1100, 1180 (desktop nav).
Asymmetry is intentional (album grid, orbits stagger, milestones zig-zag) — don't flatten
everything into equal three-column cards.

## Surfaces

Most content sits **directly on space**. Use `.surface` / bordered cards only where grouping
helps (timeline cards, form options). Hairline borders `--line`, never glowing borders.
`backdrop-filter` only on the header and modals.

## Motion

Easings `--ease-out`, `--ease-io`; durations `--d-fast` 180 / `--d-med` 420 / `--d-slow` 900.

- `data-reveal` (rise), `data-reveal="fade"`, `data-reveal="mask"` (clip unveil of the CHILD).
  Reveals are wired by `components/cosmic/Interactions.tsx` with one IntersectionObserver.
- `.rise > span` for headline lines (CSS-only, no JS).
- `.line-draw` + `--len` for SVG constellation lines.
- `data-magnetic` for at most one or two CTAs per screen. `data-cursor="view"` on photo links.

Known pitfalls (all hit during the build):
- **Never put `clip-path` on an element you observe** — IntersectionObserver treats a fully
  clipped box as invisible, so it never reveals. `mask` clips the child for that reason.
- **Don't reveal above-the-fold LCP content** (hero images, article covers) — it delays LCP.
  Entrance delays on the LCP element count in full: keep hero choreography under ~400 ms.
- **`backdrop-filter`/`transform`/`filter` on an ancestor makes it the containing block for
  `position: fixed` children.** The mobile menu collapsed to 72px because of this.
- Decorative elements that bleed off-canvas need `overflow-x: clip` on their section.
- **Next 16 + `scroll-behavior: smooth`:** keep `data-scroll-behavior="smooth"` on `<html>`
  (app/layout.tsx). Without it, every link navigation lands 300–440px down the new page —
  Next 16 stopped neutralising smooth scrolling unless you opt in. Covered by e2e-public.
- Scroll reveals never hide content that is on screen at load (`html.reveal-ready` is added
  only after on-screen elements get `.is-in`); transitions live on `.is-in` only.
- `experimental.inlineCss` is on: CSS ships inside the HTML. On slow 4G the separate CSS
  request kept losing bandwidth races to the 10 preloaded fonts (LCP flapped 2.2–3.4 s →
  stable 1.5 s). Cost: ~3× CSS in the HTML payload (style tag + RSC flight data), no CSS
  caching across pages. Re-evaluate when the flag leaves experimental.
- Focus indicators (skip link) appear instantly — no transitions on them.
- Respect `prefers-reduced-motion`: the global block in `globals.css` neutralises transitions;
  canvas and orrery check the media query themselves.

## Cosmic layer

`CosmicBackground` = CSS nebulae + one canvas (3 parallax star layers, twinkle, rare shooting
star). Capped DPR 1.5, ~40fps, paused when hidden, static frame for reduced motion, fewer stars
on coarse pointers. The `cosmos__veil` keeps text contrast — don't remove it.
`Orrery` is SVG rendered once by React; one rAF loop (~30fps, started on idle) writes each
star group's `transform`/`opacity` directly — **never drive per-frame animation through React
state** (it doubled main-thread work and cost 0.7 s of LCP). Hover/focus visuals are CSS.
Pauses on hover/focus, off-screen, hidden tab; static under reduced motion. No WebGL: the depth effect
(stars dim/shrink behind the core) is computed in 2D. Add Three.js only with a storytelling
reason and a static fallback.

## Cursor

The halo **follows** the native cursor; it never hides it. Fine pointers only, off for reduced
motion. States: `idle`, `link`, `view` (photos), `text` (inputs). Keep it under ~84px.
