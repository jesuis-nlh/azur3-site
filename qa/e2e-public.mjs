// Interaction QA for the public site. Usage: PW_PATH=<playwright> node qa/e2e-public.mjs <shot-dir>
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW_PATH ?? "playwright");
const B = process.env.BASE ?? "http://localhost:3000";
const out = process.argv[2];
const ok = (c, m) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) process.exitCode = 1; };
const browser = await chromium.launch();
const errors = [];

// ── Desktop ───────────────────────────────────────────
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await desk.newPage();
p.on("pageerror", (e) => errors.push(e.message));

// skip link
await p.goto(B + "/");
await p.keyboard.press("Tab");
await p.waitForTimeout(350); // let the slide-in transition finish
const skip = await p.evaluate(() => ({ cls: document.activeElement?.className, top: document.activeElement?.getBoundingClientRect().top }));
ok(skip.cls === "skip-link" && skip.top >= 0, "first Tab focuses a visible skip link");

// cursor halo states
await p.mouse.move(700, 450);
await p.waitForTimeout(200);
ok(await p.evaluate(() => document.querySelector(".halo")?.classList.contains("is-visible")), "cursor halo follows the mouse on desktop");
const cta = await p.$(".home-hero__ctas .btn--primary");
const box = await cta.boundingBox();
await p.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.8, { steps: 4 });
await p.waitForTimeout(150);
ok(await p.$eval(".halo", (h) => h.dataset.state) === "link", "halo grows over links");
const bx = await p.$eval(".home-hero__ctas .btn--primary", (b) => getComputedStyle(b).getPropertyValue("--bx"));
ok(Math.abs(parseFloat(bx)) > 1, `primary button is magnetic (--bx=${bx.trim()})`);
ok(await p.evaluate(() => getComputedStyle(document.body).cursor) !== "none", "native cursor is never hidden");

// orrery moves (after idle start), then hover pauses and labels
const tf = () => p.$eval(".orrery__star g", (g) => g.getAttribute("transform"));
const t0 = await tf();
await p.mouse.move(5, 880); // keep the pointer off the orrery so it is not paused
await p.waitForTimeout(3500);
ok(t0 !== (await tf()), "orrery stars travel along their orbits");
const star = await p.$(".orrery__star");
await star.hover({ force: true });
await p.waitForTimeout(200);
ok((await p.textContent(".orrery__label")).trim().length > 0, "hovering an orrery star names the memory");
await p.screenshot({ path: `${out}/p2-home-hover.png` });

// timeline filtering + search
await p.goto(B + "/dong-thoi-gian");
const total = await p.$$eval(".tl-event", (l) => l.length);
await p.fill(".timeline__search input", "van nghe");
await p.waitForTimeout(100);
ok(await p.$$eval(".tl-event", (l) => l.length) === 1, `diacritic-free search "van nghe" finds "Đêm văn nghệ" (of ${total})`);
await p.fill(".timeline__search input", "");
await p.click(".timeline__filters .chip:has-text('Tốt nghiệp')");
const grad = await p.$$eval(".tl-event", (l) => l.length);
ok(grad > 0 && grad < total, `category filter narrows the list (${grad})`);
ok(await p.$eval(".timeline__filters .chip:has-text('Tốt nghiệp')", (c) => c.getAttribute("aria-pressed")) === "true", "active filter exposes aria-pressed");
await p.fill(".timeline__search input", "zzzz");
ok(await p.isVisible("text=Không có sự kiện nào khớp"), "empty state appears for no matches");
await p.click("text=Xoá bộ lọc");
ok(await p.$$eval(".tl-event", (l) => l.length) === total, "clear filters restores all events");
await p.click(".timeline__years a >> nth=2");
await p.waitForTimeout(900);
const yearTop = await p.$eval("#nam-2024-2025", (e) => e.getBoundingClientRect().top);
ok(yearTop < 400, `year jump lands on 2024–2025 (top=${Math.round(yearTop)})`);

// lightbox
await p.goto(B + "/ky-uc/buoi-dau");
await p.click(".masonry__btn >> nth=0");
await p.waitForSelector(".lightbox[open] img.is-loaded");
ok((await p.textContent(".lightbox__bar .coord")).startsWith("01"), "lightbox opens on the clicked photo");
await p.keyboard.press("ArrowRight");
await p.waitForTimeout(100);
ok((await p.textContent(".lightbox__bar .coord")).startsWith("02"), "→ goes to next photo");
await p.keyboard.press("ArrowLeft");
await p.keyboard.press("ArrowLeft");
ok((await p.textContent(".lightbox__bar .coord")).startsWith("06"), "← wraps around to the last photo");
await p.waitForSelector(".lightbox[open] img.is-loaded");
await p.screenshot({ path: `${out}/p2-lightbox.png` });
await p.keyboard.press("i");
ok(!(await p.$(".lightbox__info")), "I toggles the info panel");
await p.keyboard.press("i");
await p.keyboard.press("Escape");
await p.waitForTimeout(150);
ok(!(await p.$(".lightbox[open]")), "Esc closes the lightbox");
ok(await p.evaluate(() => document.activeElement?.classList.contains("masonry__btn")), "focus returns to the photo that opened it");
await p.click(".gallery-toolbar .btn");
await p.waitForSelector(".lightbox__progress");
ok(true, "slideshow starts with a visible progress bar");
await p.keyboard.press("Escape");

// yearbook
await p.goto(B + "/ky-yeu");
const pg = () => p.textContent(".yearbook__bar .coord");
ok((await pg()).includes("01"), "yearbook opens on the cover");
await p.keyboard.press("ArrowRight");
await p.keyboard.press("ArrowRight");
await p.waitForTimeout(100);
ok((await pg()).includes("03") && p.url().endsWith("#trang-3"), "→ turns pages and updates a shareable #trang-N");
await p.keyboard.press("End");
await p.waitForTimeout(100);
ok((await pg()).includes("08"), "End jumps to the last page");
ok(await p.$eval(".yearbook__nav .btn--primary", (b) => b.disabled), "next is disabled on the last page");
await p.click("text=Mục lục");
await p.click(".yearbook__index button >> nth=3");
ok((await pg()).includes("04"), "chapter index jumps to a chapter");
await p.goto(B + "/ky-yeu#trang-5");
await p.waitForFunction(() => document.querySelector(".yearbook__bar .coord")?.textContent?.includes("05"), null, { timeout: 3000 }).catch(() => {});
ok((await pg()).includes("05"), "deep link #trang-5 opens that page");

// contribute: client validation
await p.goto(B + "/dong-gop");
await p.click("button[type=submit]");
await p.waitForSelector(".form-alert");
ok(await p.evaluate(() => document.activeElement?.getAttribute("name")) === "name", "invalid submit focuses the first invalid field");
ok(await p.$$eval("[aria-invalid=true]", (l) => l.length) >= 3, "invalid fields are marked aria-invalid");
await p.click("text=Yêu cầu gỡ");
ok(!(await p.$("#c-code")), "removal requests need no contributor code");

// search
await p.goto(B + "/tim-kiem?q=ky+yeu");
ok((await p.$$eval(".search-hit", (l) => l.length)) > 0, "search without diacritics returns results");
await desk.close();

// ── Mobile / touch ────────────────────────────────────
const mob = await browser.newContext({ ...devices["iPhone 13"] });
const m = await mob.newPage();
m.on("pageerror", (e) => errors.push(e.message));
await m.goto(B + "/");
ok(!(await m.evaluate(() => document.documentElement.classList.contains("has-halo"))), "no cursor effects on touch devices");
await m.click(".menu-toggle");
ok(await m.isVisible("#site-menu"), "mobile menu opens");
ok(await m.evaluate(() => document.body.style.overflow) === "hidden", "page scroll is locked while menu is open");
await m.screenshot({ path: `${out}/p2-mobile-menu.png` });
await m.keyboard.press("Escape");
ok(!(await m.isVisible("#site-menu")), "Esc closes the menu");
ok(await m.evaluate(() => document.activeElement?.classList.contains("menu-toggle")), "focus returns to the menu button");
await m.goto(B + "/ky-uc/buoi-dau");
await m.tap(".masonry__btn >> nth=0");
await m.waitForSelector(".lightbox[open] img.is-loaded");
const lb = await m.$(".lightbox__figure");
const bb = await lb.boundingBox();
await m.touchscreen.tap(bb.x + 5, bb.y + 5);
await m.dispatchEvent(".lightbox__stage", "touchstart", { touches: [{ identifier: 1, clientX: 300, clientY: 400 }] }).catch(() => {});
await mob.close();

// ── Reduced motion ────────────────────────────────────
const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const r = await rm.newPage();
await r.goto(B + "/");
await r.mouse.move(600, 400);
ok(!(await r.evaluate(() => document.documentElement.classList.contains("has-halo"))), "reduced motion: cursor effects off");
const hiddenReveal = await r.$$eval("[data-reveal]", (l) => l.filter((e) => getComputedStyle(e).opacity === "0").length);
ok(hiddenReveal === 0, "reduced motion: all content visible without scrolling");
const before = await r.$eval(".orrery__star g", (g) => g.getAttribute("transform"));
await r.waitForTimeout(1200);
await r.waitForTimeout(2500);
ok(before === (await r.$eval(".orrery__star g", (g) => g.getAttribute("transform"))), "reduced motion: orrery is static");
await r.screenshot({ path: `${out}/p2-reduced-motion.png` });
await rm.close();

ok(errors.length === 0, `no page errors ${errors.join(" | ")}`);
await browser.close();
