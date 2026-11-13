#!/usr/bin/env node
/**
 * Generates abstract "astronomical plate" images used as clearly-labelled
 * placeholders until real, consented class photographs are imported.
 * They contain no people and depict no real event.
 *
 *   node scripts/generate-placeholders.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/media/demo");
const SHAPES = [
  [1600, 1067], [1200, 1600], [1400, 1400], [1800, 1013],
  [1600, 1067], [1200, 1500], [1600, 1067], [1400, 1750],
  [1800, 1013], [1600, 1200], [1200, 1600], [1600, 1067],
  [1400, 1400], [1600, 1067], [1200, 1600], [1800, 1013],
];
const PALETTES = [
  ["#50328C", "#63D9FF", "#17153A"],
  ["#8B5CF6", "#F0B37E", "#0B1026"],
  ["#2B4C9B", "#63D9FF", "#070812"],
  ["#6E3A8E", "#FF9DB8", "#17153A"],
  ["#1E6F8C", "#B8F2FF", "#0B1026"],
  ["#50328C", "#E7C27A", "#070812"],
];

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function plateSvg(i, w, h) {
  const r = rng(i * 7919 + 17);
  const [a, b, bg] = PALETTES[i % PALETTES.length];
  const blobs = Array.from({ length: 7 }, (_, k) => {
    const cx = (r() * 1.1 - 0.05) * w, cy = (r() * 1.1 - 0.05) * h;
    const rad = (0.18 + r() * 0.32) * Math.max(w, h);
    const col = k % 3 === 0 ? b : a;
    const op = 0.18 + r() * 0.35;
    return `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rad.toFixed(0)}" ry="${(rad * (0.45 + r() * 0.5)).toFixed(0)}" fill="${col}" opacity="${op.toFixed(2)}" transform="rotate(${(r() * 180).toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
  }).join("");
  const stars = Array.from({ length: Math.round((w * h) / 2600) }, () => {
    const x = r() * w, y = r() * h, s = r() ** 6 * 2.6 + 0.35;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(2)}" fill="#F4F3FF" opacity="${(0.35 + r() * 0.65).toFixed(2)}"/>`;
  }).join("");
  const bright = Array.from({ length: 4 }, () => {
    const x = r() * w, y = r() * h, s = 2 + r() * 3;
    return `<g opacity="0.9"><circle cx="${x}" cy="${y}" r="${s * 6}" fill="url(#glow)"/><circle cx="${x}" cy="${y}" r="${s}" fill="#fff"/></g>`;
  }).join("");
  // An orbital arc: a recurring motif of the archive's visual language.
  const ox = w * (0.2 + r() * 0.6), oy = h * (0.3 + r() * 0.5), orx = w * (0.5 + r() * 0.4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(Math.max(w, h) / 14)}"/></filter>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  <g filter="url(#blur)">${blobs}</g>
  ${stars}${bright}
  <ellipse cx="${ox}" cy="${oy}" rx="${orx}" ry="${orx * 0.22}" fill="none" stroke="#F4F3FF" stroke-opacity="0.16" stroke-width="1.2" transform="rotate(${(-18 + r() * 36).toFixed(0)} ${ox} ${oy})"/>
  <rect width="100%" height="100%" fill="url(#vig)"/>
</svg>`;
}

await mkdir(OUT, { recursive: true });
const manifest = [];
for (let i = 0; i < SHAPES.length; i++) {
  const [w, h] = SHAPES[i];
  const name = `plate-${String(i + 1).padStart(2, "0")}`;
  const svg = Buffer.from(plateSvg(i + 1, w, h));
  const base = sharp(svg, { density: 72 });
  await base.clone().webp({ quality: 74 }).toFile(path.join(OUT, `${name}.webp`));
  await base.clone().resize({ width: 640 }).webp({ quality: 70 }).toFile(path.join(OUT, `${name}-thumb.webp`));
  const { dominant } = await sharp(svg).stats();
  const tone = `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  manifest.push({ name, width: w, height: h, tone });
  console.log("✓", name, w, "×", h);
}
await writeFile(path.resolve("content/demo-plates.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${manifest.length} plates and content/demo-plates.json`);
