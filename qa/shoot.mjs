// Usage: node qa/shoot.mjs <outDir> <path> [widths=390,1440] [--full] [--reduce]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH ?? "playwright");
const [outDir, path = "/", widthsArg = "390,1440", ...flags] = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3000";
const full = flags.includes("--full");
const reduce = flags.includes("--reduce");
const browser = await chromium.launch();
for (const w of widthsArg.split(",").map(Number)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : w < 1000 ? 1024 : 900 }, deviceScaleFactor: 1, reducedMotion: reduce ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(base + path, { waitUntil: "load" });
  // reveal everything + let entrance animations finish
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 90)); }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1600);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const name = `${outDir}/${path.replace(/[^a-z0-9]+/gi, "_") || "home"}-${w}${full ? "-full" : ""}${reduce ? "-rm" : ""}.png`;
  await page.screenshot({ path: name, fullPage: full });
  console.log(name, "overflowX=" + overflow, errors.length ? "ERRORS: " + errors.join(" | ") : "");
  await ctx.close();
}
await browser.close();
