# QA loop

Build first: `npm run lint && npm test && npm run build`.

Then, with Playwright from `/opt/node-tools/node_modules/playwright` (PW_PATH):

```bash
qa/serve.sh /path/to/scratch/data            # restarts next-server with throwaway creds
node qa/shoot.mjs <outdir> / 390,768,1024,1440 --full
node qa/e2e-public.mjs <outdir>              # 38 interaction checks
node qa/e2e-admin.mjs <outdir>               # needs a pending submission + an inbox batch
```

- `pkill -f "next start"` does NOT stop the server (process is `next-server`) — use
  `qa/serve.sh`, otherwise you test a stale build.
- `html { scroll-behavior: smooth }` makes `scrollTo(y)` animate; scripts must pass
  `behavior: "instant"` or reveals never fire.
- Full-page screenshots show the fixed cosmos only behind the first viewport and may show
  the skip link — capture artefacts, verify with viewport shots before "fixing".
- Next's route announcer is also `role="alert"` — select errors by class.

Look at every screenshot you cite. Check: no horizontal overflow (shoot.mjs prints it),
Vietnamese diacritics intact, demo badges present, empty states, focus rings, 390px tap targets.

Lighthouse (install in a scratch dir, `CHROME_PATH=/opt/pw-browsers/chromium`): record the real numbers.

**Measure with `--throttling-method=devtools`, not only the default simulation.** The default
(Lantern) *models* slow 4G + 4× CPU from an unthrottled trace and charges the JS bundle's
boot-up to LCP even when the LCP element painted before any JS ran. On this site the simulated
home LCP was 3.7 s while the real trace showed LCP = FCP ≈ 0.28 s. Use the simulation for quick
comparisons, devtools throttling for the numbers you report, and read
`audits.metrics.details.items[0].observed*` before blaming a cause.

Change one variable per measurement and revert experiments before the next one. In the LCP
investigation, two plausible causes (hero animations, page-enter fade) had **no** effect;
fonts were worth ~0.5 s; the real culprits were (1) the orrery re-rendering React 30×/s and
(2) a 700 ms delay on the LCP paragraph's fade-in. Final, devtools-throttled (mobile LCP 1.7–2.4 s on all 7 pages, a11y/BP/SEO 100): see
`docs/QA-REPORT.md`.

Suites: `npm test`, `qa/e2e-public.mjs`, `qa/e2e-admin.mjs`, `qa/e2e-video.mjs` (mutates the
data dir), `qa/a11y-structure.mjs` (landmarks, one h1, heading order, names, labels + ARIA
snapshots of lightbox/yearbook/timeline). Don't run Lighthouse while another server or browser
suite is running — CPU contention skews the throttled numbers.

Scorecards: score only what was inspected; list what wasn't.
