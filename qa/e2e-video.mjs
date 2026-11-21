// Video player with real URLs: privacy (no third-party request before play), embed, file playback.
// Needs a server with admin enabled and a writable DATA_DIR (qa/serve.sh). Mutates that data dir.
// Usage: PW_PATH=<playwright> node qa/e2e-video.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH ?? "playwright");
const B = process.env.BASE ?? "http://localhost:3000";
const ok = (c, m) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) process.exitCode = 1; };
const browser = await chromium.launch();

// 1. as admin: give two videos real URLs and publish them
const admin = await (await browser.newContext()).newPage();
await admin.goto(`${B}/admin/login`);
await admin.fill("#pw", process.env.ADMIN_PASSWORD ?? "qa-admin-pass");
await Promise.all([admin.waitForURL(`${B}/admin`), admin.click("button[type=submit]")]);
async function setVideo(id, provider, url) {
  await admin.goto(`${B}/admin/videos/${id}`);
  await admin.selectOption("#f-provider", provider);
  await admin.fill("#f-url", url);
  await admin.click(".admin-editor__side button[type=submit]");
  await admin.waitForSelector(".admin-ok");
}
await setVideo("vi-01", "youtube", "https://www.youtube.com/watch?v=aqz-KE-bpKQ");
await setVideo("vi-02", "file", "https://media.w3.org/2010/05/sintel/trailer.mp4");
ok(true, "admin set a YouTube URL and a file URL");

// 2. as a visitor
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const thirdParty = [];
p.on("request", (r) => { const h = new URL(r.url()).hostname; if (!/localhost$/.test(h)) thirdParty.push(h); });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));

await p.goto(`${B}/thuoc-phim/nhin-lai-ba-nam`);
await p.waitForTimeout(800);
ok(await p.isVisible(".player__poster"), "YouTube video shows a poster button, not an iframe");
ok(!(await p.$(".player iframe")), "no iframe before the visitor presses play");
ok(thirdParty.filter((h) => /youtube|ytimg|google/.test(h)).length === 0, `no request to YouTube/Google before play (${[...new Set(thirdParty)].join(",") || "none"})`);
const name = await p.getAttribute(".player__poster", "aria-label") ?? (await p.textContent(".player__poster .sr-only"));
ok(/Phát video/.test(name ?? ""), "play button has an accessible name");
await p.focus(".player__poster");
await p.keyboard.press("Enter");
await p.waitForSelector(".player iframe");
const src = await p.getAttribute(".player iframe", "src");
ok(src?.startsWith("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"), `keyboard Enter loads the privacy-enhanced embed (${src})`);
ok(await p.getAttribute(".player iframe", "title") !== null, "iframe has a title for screen readers");
ok((await p.getAttribute(".player iframe", "allow"))?.includes("fullscreen") && (await p.$(".player iframe[allowfullscreen]")) !== null, "fullscreen is allowed");

await p.goto(`${B}/thuoc-phim/tiet-muc-van-nghe`);
const v = await p.$(".player video");
ok(v !== null, "file URL renders a native <video>");
ok(await v.getAttribute("controls") !== null && (await v.getAttribute("preload")) === "none", "native controls, preload=none (nothing downloads until play)");

await p.goto(`${B}/thuoc-phim/tren-duong-di`);
ok(await p.isVisible("text=Thước phim đang chờ tư liệu"), "video without a URL shows the waiting state");

ok(errors.length === 0, `no page errors ${errors.join(" | ")}`);
await browser.close();
