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

Lighthouse (install in a scratch dir, `CHROME_PATH=/opt/pw-browsers/chromium`): record the
real numbers. Baseline at this commit: desktop perf 99–100, mobile perf 87–91 (LCP 3.5–3.9s,
slow-4G simulation), a11y/best-practices/SEO 100, CLS 0.

Scorecards: score only what was inspected; list what wasn't.
