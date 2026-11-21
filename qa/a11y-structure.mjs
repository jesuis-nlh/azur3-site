// Structural accessibility audit of public pages (what screen readers rely on), plus ARIA
// snapshots of the most complex widgets. Automated — not a substitute for VoiceOver/TalkBack.
// Usage: PW_PATH=<playwright> node qa/a11y-structure.mjs <outdir>
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH ?? "playwright");
const B = process.env.BASE ?? "http://localhost:3000";
const out = process.argv[2] ?? ".";
const PAGES = ["/", "/cau-chuyen", "/dong-thoi-gian", "/dong-thoi-gian/dem-van-nghe", "/ky-uc", "/ky-uc/buoi-dau",
  "/thuoc-phim", "/thuoc-phim/tiet-muc-van-nghe", "/chung-ta", "/chung-ta/thanh-vien-01", "/nhat-ky",
  "/nhat-ky/vi-sao-co-kho-luu-tru-nay", "/di-san", "/ky-yeu", "/dong-gop", "/tim-kiem?q=ky+yeu", "/quyen-rieng-tu"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let failures = 0;

for (const path of PAGES) {
  await page.goto(B + path, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const issues = [];
    const vis = (el) => { const s = getComputedStyle(el); return s.display !== "none" && s.visibility !== "hidden" && !el.closest("[hidden],[aria-hidden=true]"); };
    const name = (el) => {
      if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
      const lb = el.getAttribute("aria-labelledby");
      if (lb) return lb.split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
      if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) return l.textContent; }
      const wrap = el.closest("label"); if (wrap && wrap !== el) return wrap.textContent;
      if (el.tagName === "IMG") return el.getAttribute("alt") ?? null;
      const t = (el.textContent ?? "").trim() || Array.from(el.querySelectorAll("img[alt]")).map((i) => i.alt).join(" ") || el.getAttribute("title") || "";
      return t;
    };
    if (document.documentElement.lang !== "vi") issues.push("html lang is not vi");
    for (const role of [["header", "banner"], ["main", "main"], ["footer", "contentinfo"], ["nav", "navigation"]])
      if (!document.querySelector(role[0])) issues.push(`missing <${role[0]}> (${role[1]} landmark)`);
    const h1 = [...document.querySelectorAll("h1")].filter(vis);
    if (h1.length !== 1) issues.push(`${h1.length} visible h1`);
    const levels = [...document.querySelectorAll("main h1, main h2, main h3, main h4")].filter(vis).map((h) => Number(h.tagName[1]));
    levels.forEach((l, i) => { if (i && l > levels[i - 1] + 1) issues.push(`heading jumps h${levels[i - 1]}→h${l}`); });
    document.querySelectorAll("img").forEach((img) => { if (!img.hasAttribute("alt")) issues.push(`img without alt: ${img.src.split("/").pop()}`); });
    document.querySelectorAll("a[href], button, [role=button]").forEach((el) => {
      if (!vis(el) && !el.closest("dialog")) return;
      if (!(name(el) ?? "").trim()) issues.push(`unnamed ${el.tagName.toLowerCase()}: ${el.outerHTML.slice(0, 80)}`);
    });
    document.querySelectorAll("input:not([type=hidden]), select, textarea").forEach((el) => {
      if (el.closest("[aria-hidden=true]")) return;
      if (!(name(el) ?? "").trim()) issues.push(`unlabelled field: ${el.outerHTML.slice(0, 80)}`);
    });
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id); const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) issues.push(`duplicate ids: ${[...new Set(dup)].join(", ")}`);
    return { issues, headings: levels.join(""), links: document.querySelectorAll("a[href]").length };
  });
  failures += r.issues.length;
  console.log(`${r.issues.length ? "✗" : "✓"} ${path.padEnd(38)} headings=${r.headings || "-"} ${r.issues.length ? "→ " + [...new Set(r.issues)].slice(0, 6).join(" | ") : ""}`);
}

// ARIA snapshots of complex widgets, read as a screen reader would traverse them
await page.goto(`${B}/ky-uc/buoi-dau`);
await page.click(".masonry__btn >> nth=0");
await page.waitForSelector(".lightbox[open]");
const lb = await page.locator(".lightbox").ariaSnapshot();
await page.keyboard.press("Escape");
await page.goto(`${B}/ky-yeu`);
const yb = await page.locator(".yearbook").ariaSnapshot();
await page.goto(`${B}/dong-thoi-gian`);
const tl = await page.locator(".timeline__controls").ariaSnapshot();
writeFileSync(`${out}/aria-snapshots.txt`, `## Lightbox (open)\n${lb}\n\n## Yearbook\n${yb}\n\n## Timeline controls\n${tl}\n`);
console.log(`ARIA snapshots → ${out}/aria-snapshots.txt`);
console.log(failures ? `${failures} issue(s)` : "no structural issues");
process.exitCode = failures ? 1 : 0;
await browser.close();
