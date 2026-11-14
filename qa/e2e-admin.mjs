// End-to-end: admin auth → moderation → publish → public visibility → archive → imports → logout.
// Usage: PW_PATH=<playwright> node qa/e2e-admin.mjs <screenshot-dir>   (server from qa/serve.sh)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_PATH ?? "playwright");
const B = process.env.BASE ?? "http://localhost:3000";
const out = process.argv[2];
const ok = (c, m) => { console.log(`${c ? "✓" : "✗"} ${m}`); if (!c) process.exitCode = 1; };

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${B}/admin/submissions`);
ok(page.url().endsWith("/admin/login"), "unauthenticated admin request redirects to login");
await page.fill("#pw", "wrong");
await page.click("button[type=submit]");
await page.waitForSelector(".admin-error[role=alert]");
ok((await page.textContent(".admin-error[role=alert]")).includes("không đúng"), "wrong password shows an error");
await page.fill("#pw", "qa-admin-pass");
await Promise.all([page.waitForURL(`${B}/admin`), page.click("button[type=submit]")]);
ok(true, "correct password reaches dashboard");
await page.screenshot({ path: `${out}/admin-dashboard.png` });

await page.goto(`${B}/admin/submissions`);
await page.click("table a >> nth=0");
await page.waitForSelector(".admin-files img");
const imgW = await page.$eval(".admin-files img", (i) => i.naturalWidth);
ok(imgW > 0, "admin can see the private submission preview");
await page.screenshot({ path: `${out}/admin-submission.png` });
await Promise.all([page.waitForURL(/\/admin\/albums\//), page.click("button[value=approve-draft]")]);
ok(true, "approval creates a draft album and opens it");
const albumUrl = page.url();
const status = await page.$eval("#g-status", (s) => s.value);
ok(status === "draft", `new album is a draft (got ${status})`);

const slug = await page.$eval("#f-slug", (i) => i.value);
const pub = (await fetch(`${B}/ky-uc/${slug}`)).status;
ok(pub === 404, `draft album is not public (${pub})`);

await page.fill("#f-title", "Ảnh sân trường (đã duyệt)");
await page.fill("#f-slug", "anh-san-truong");
await page.fill("input[name='asset.0.alt']", "Sân trường buổi chiều");
await page.selectOption("#g-status", "published");
await page.selectOption("#g-consent", "granted");
await page.click(".admin-editor__side button[type=submit]");
await page.waitForSelector(".admin-ok");
ok(true, "album saved as published");
await page.screenshot({ path: `${out}/admin-editor.png` });

const anon = await browser.newPage();
const r = await anon.goto(`${B}/ky-uc/anh-san-truong`);
ok(r.status() === 200, "published album is public");
const src = await anon.$eval(".masonry img", (i) => i.getAttribute("src"));
ok((await fetch(B + src)).status === 200, "its EXIF-free preview is now publicly served");
ok((await fetch(B + src.replace("thumb.webp", "original.webp"))).status === 404, "the original stays private");

await page.goto(albumUrl);
await Promise.all([page.waitForURL(`${B}/admin/albums`), page.click("text=Lưu trữ & ẩn")]);
ok((await fetch(`${B}/ky-uc/anh-san-truong`)).status === 404, "archiving removes it from the public site immediately");
ok((await fetch(B + src)).status === 404, "and its image is no longer served");

await page.goto(`${B}/admin/imports`);
const loadBtns = await page.$$("text=Nạp vào hàng duyệt");
if (loadBtns.length) {
  await loadBtns[0].click();
  await page.waitForSelector(".admin-imports li", { timeout: 15000 }).catch(() => null);
  const n = await page.$$eval(".admin-imports li", (l) => l.length);
  ok(n > 0, `import batch loaded into review queue (${n} items)`);
  await page.screenshot({ path: `${out}/admin-imports.png`, fullPage: true });
  await page.fill("input[name=albumTitle]", "Ảnh nhập thử");
  await Promise.all([page.waitForURL(/\/admin\/albums\//), page.click("button[value=accept]")]);
  ok(true, "accepted imports become a draft album");
} else ok(false, "no import batch found in inbox");

await page.goto(`${B}/admin`);
const audit = await page.$$eval(".admin-audit li", (l) => l.length);
ok(audit >= 4, `actions are recorded in the audit log (${audit})`);
await Promise.all([page.waitForURL(`${B}/admin/login`), page.click("text=Đăng xuất")]);
await page.goto(`${B}/admin`);
ok(page.url().endsWith("/admin/login"), "logout ends the session");
ok((await fetch(`${B}/api/admin/anything`)).status === 401, "admin API without session → 401");
ok(errors.length === 0, `no page errors ${errors.join(" | ")}`);
await browser.close();
