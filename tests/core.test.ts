import { test } from "node:test";
import assert from "node:assert/strict";
import { isPublic, profileExposure } from "../lib/governance.ts";
import { foldVietnamese, slugify, fixFacebookMojibake, excerpt } from "../lib/text.ts";
import { formatFuzzy, schoolYearOf, fuzzySortKey } from "../lib/dates.ts";
import { parseMarkdown, parseInline, safeHref } from "../lib/markdown.ts";
import { resolveVideo } from "../lib/video.ts";
import { createSessionToken, verifySessionToken, safeEqual } from "../lib/session.ts";

const gov = { status: "published", visibility: "public", consent: "granted", review: "needs_review" } as const;

test("public gate requires published + public + consent", () => {
  assert.equal(isPublic(gov), true);
  assert.equal(isPublic({ ...gov, status: "draft" }), false);
  assert.equal(isPublic({ ...gov, visibility: "restricted" }), false);
  assert.equal(isPublic({ ...gov, consent: "pending" }), false);
  assert.equal(isPublic({ ...gov, consent: "declined" }), false);
  assert.equal(isPublic({ ...gov, consent: "not_required" }), true);
});

test("profile exposure honours visibility and consent", () => {
  const p = { ...gov, id: "x", slug: "x", title: "x", tags: [], people: [], createdAt: "", updatedAt: "", role: "student", showPortrait: false, showBio: false } as const;
  assert.equal(profileExposure(p), "full");
  assert.equal(profileExposure({ ...p, visibility: "restricted" }), "limited");
  assert.equal(profileExposure({ ...p, consent: "pending" }), "limited");
  assert.equal(profileExposure({ ...p, visibility: "hidden" }), "none");
  assert.equal(profileExposure({ ...p, consent: "declined" }), "none");
  assert.equal(profileExposure({ ...p, status: "draft" }), "none");
});

test("Vietnamese folding and slugs", () => {
  assert.equal(foldVietnamese("Đêm Văn Nghệ"), "dem van nghe");
  assert.equal(slugify("Lễ tri ân & trưởng thành!"), "le-tri-an-truong-thanh");
});

test("Facebook mojibake is repaired, clean text untouched", () => {
  const broken = Buffer.from("Văn nghệ 20/11", "utf8").toString("latin1");
  assert.equal(fixFacebookMojibake(broken), "Văn nghệ 20/11");
  assert.equal(fixFacebookMojibake("Văn nghệ"), "Văn nghệ");
});

test("fuzzy dates are formatted at their real precision", () => {
  assert.equal(formatFuzzy({ value: "2023", precision: "year" }), "Năm 2023");
  assert.equal(formatFuzzy({ value: "2023-11", precision: "month" }), "Tháng 11, 2023");
  assert.equal(formatFuzzy({ value: "2023-11-20", precision: "day" }), "20 tháng 11, 2023");
  assert.match(formatFuzzy({ value: "2023-11", precision: "month", approximate: true }), /^Khoảng/);
  assert.equal(formatFuzzy(undefined), "Chưa rõ thời gian");
  assert.equal(schoolYearOf({ value: "2023-09", precision: "month" }), "2023-2024");
  assert.equal(schoolYearOf({ value: "2024-05", precision: "month" }), "2023-2024");
  assert.ok(fuzzySortKey({ value: "2023", precision: "year" }) < fuzzySortKey({ value: "2023-01", precision: "month" }));
});

test("markdown never lets unsafe links or raw HTML through", () => {
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("//evil.com"), null);
  assert.equal(safeHref("/ky-uc"), "/ky-uc");
  const inl = parseInline("[x](javascript:alert(1)) <script>");
  assert.deepEqual(inl[0], { t: "text", v: "x" });
  assert.ok(inl.every((n) => n.t === "text"));
  const blocks = parseMarkdown("## Tiêu đề\n\nĐoạn **đậm**\n\n- a\n- b\n\n> trích\n\n![alt](/a.webp \"cap\")\n\n@video(https://youtu.be/abcdefghijk)");
  assert.deepEqual(blocks.map((b) => b.t), ["h2", "p", "ul", "quote", "img", "video"]);
  assert.equal((blocks[0] as { id: string }).id, "tieu-de");
});

test("video URLs resolve to privacy-friendly embeds", () => {
  const yt = resolveVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(yt.kind, "youtube");
  assert.match((yt as { embed: string }).embed, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.equal(resolveVideo("https://youtu.be/dQw4w9WgXcQ").kind, "youtube");
  assert.equal(resolveVideo("https://vimeo.com/123456789").kind, "vimeo");
  assert.equal(resolveVideo("https://cdn.example.org/v.mp4").kind, "file");
  assert.equal(resolveVideo("http://cdn.example.org/v.mp4").kind, "invalid");
  assert.equal(resolveVideo(undefined).kind, "invalid");
});

test("admin sessions are signed, expire and reject tampering", async () => {
  process.env.ADMIN_PASSWORD = "pw";
  process.env.SESSION_SECRET = "x".repeat(40);
  const t = await createSessionToken();
  assert.equal(await verifySessionToken(t), true);
  const [p, s] = t.split(".");
  assert.equal(await verifySessionToken(`${p}x.${s}`), false);
  assert.equal(await verifySessionToken(`${p}.${s.slice(0, -2)}AA`), false);
  assert.equal(await verifySessionToken(t, Date.now() + 9 * 3600_000), false);
  process.env.SESSION_SECRET = "y".repeat(40);
  assert.equal(await verifySessionToken(t), false, "rotating the secret invalidates sessions");
  assert.equal(await safeEqual("abc", "abc"), true);
  assert.equal(await safeEqual("abc", "abd"), false);
});

test("excerpt strips markdown syntax", () => {
  assert.equal(excerpt("## Hi\n\n**bold** text ![a](/b.webp)"), "Hi bold text");
});
