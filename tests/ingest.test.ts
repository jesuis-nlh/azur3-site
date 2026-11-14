import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFacebookJson, hamming, dhashFromPixels, inferEventDate, suggestSchoolYear, titleFromText } from "../lib/ingest-core.ts";
import { applyForm } from "../lib/admin-form.ts";
import type { FieldDef } from "../lib/admin-schema.ts";

const moji = (s: string) => Buffer.from(s, "utf8").toString("latin1");

test("parses Facebook post exports and repairs encoding", () => {
  const posts = [{
    timestamp: 1700000000,
    data: [{ post: moji("Đêm văn nghệ của lớp") }],
    attachments: [{ data: [{ media: { uri: "posts/media/a.jpg", creation_timestamp: 1700000100, description: moji("Cả lớp trên sân khấu") } }] }],
  }, { timestamp: 1, data: [{ post: "chỉ chữ" }] }];
  const out = parseFacebookJson(posts);
  assert.equal(out.length, 1);
  assert.equal(out[0].uri, "posts/media/a.jpg");
  assert.equal(out[0].text, "Cả lớp trên sân khấu");
  assert.equal(out[0].postText, "Đêm văn nghệ của lớp");
  assert.equal(out[0].timestamp, 1700000100);
});

test("parses Facebook album exports, ignores remote URIs and junk", () => {
  const out = parseFacebookJson({ name: moji("Kỷ yếu"), photos: [{ uri: "album/1.jpg", creation_timestamp: 5 }, { uri: "https://x/y.jpg" }] });
  assert.deepEqual(out.map((m) => [m.uri, m.album]), [["album/1.jpg", "Kỷ yếu"]]);
  assert.deepEqual(parseFacebookJson({ foo: 1 }), []);
  assert.deepEqual(parseFacebookJson(null), []);
});

test("perceptual hash and hamming distance", () => {
  const grad = Array.from({ length: 72 }, (_, i) => (i % 9) * 20);
  const h = dhashFromPixels(grad);
  assert.equal(h, "0000000000000000");
  assert.equal(dhashFromPixels(grad.map((v) => 255 - v)), "ffffffffffffffff");
  assert.equal(hamming("0f", "0f"), 0);
  assert.equal(hamming("00", "ff"), 8);
});

test("date inference never invents certainty", () => {
  const exif = inferEventDate({ exif: new Date("2023-11-20T10:00:00Z") });
  assert.deepEqual(exif.eventDate, { value: "2023-11-20", precision: "day", approximate: true });
  const upload = inferEventDate({ uploadedAt: new Date("2024-03-02T00:00:00Z") });
  assert.deepEqual(upload.eventDate, { value: "2024-03", precision: "month", approximate: true });
  assert.ok(upload.publishedAt?.startsWith("2024-03-02"));
  assert.ok(upload.issues.length > 0);
  const none = inferEventDate({});
  assert.equal(none.eventDate, undefined);
  assert.equal(inferEventDate({ exif: new Date("1970-01-01") }).eventDate, undefined, "zeroed camera clocks are ignored");
  assert.equal(suggestSchoolYear({ value: "2023-10", precision: "month" }, ["2023-2024"]), "2023-2024");
  assert.equal(suggestSchoolYear({ value: "2030-10", precision: "month" }, ["2023-2024"]), undefined);
  assert.equal(titleFromText("", "fallback"), "fallback");
});

test("admin form mapping validates and builds nested records", () => {
  const fields: FieldDef[] = [
    { name: "title", label: "", type: "text", required: true },
    { name: "eventDate", label: "", type: "fuzzydate" },
    { name: "tags", label: "", type: "tags" },
    { name: "people", label: "", type: "refs", collection: "profiles" },
    { name: "milestone", label: "", type: "checkbox" },
    { name: "source.url", label: "", type: "url" },
    { name: "category", label: "", type: "select", options: { a: "A" } },
  ];
  const fd = new FormData();
  fd.set("title", "Đêm Văn Nghệ");
  fd.set("eventDate.value", "2023-11");
  fd.set("eventDate.approximate", "on");
  fd.set("tags", "sân khấu, , văn nghệ");
  fd.append("people", "pr-01"); fd.append("people", "pr-02");
  fd.set("milestone", "on");
  fd.set("source.url", "https://facebook.com/x");
  fd.set("category", "a");
  fd.set("status", "published"); fd.set("visibility", "bogus");
  const rec: Record<string, unknown> = { visibility: "public" };
  const { errors } = applyForm(rec, fields, fd);
  assert.deepEqual(errors, {});
  assert.equal(rec.slug, "dem-van-nghe");
  assert.deepEqual(rec.eventDate, { value: "2023-11", precision: "month", approximate: true });
  assert.deepEqual(rec.tags, ["sân khấu", "văn nghệ"]);
  assert.deepEqual(rec.people, ["pr-01", "pr-02"]);
  assert.equal(rec.milestone, true);
  assert.deepEqual(rec.source, { url: "https://facebook.com/x" });
  assert.equal(rec.status, "published");
  assert.equal(rec.visibility, "public", "invalid governance values are ignored");

  const bad = new FormData();
  bad.set("eventDate.value", "20/11/2023");
  bad.set("source.url", "javascript:x");
  bad.set("category", "zzz");
  const r2 = applyForm({}, fields, bad);
  assert.ok(r2.errors.title && r2.errors.eventDate && r2.errors["source.url"] && r2.errors.category);
});
