#!/usr/bin/env node
/**
 * Batch importer. Produces a review batch in DATA_DIR/inbox — it never
 * publishes anything. Load the batch in /admin/imports to review it.
 *
 *   npm run ingest -- --source ./exports/photos --kind folder --label "Ảnh của Lan"
 *   npm run ingest -- --source ./facebook-export --kind facebook --label "Trang lớp"
 *
 * Only import material you or the contributor are authorised to use.
 */
import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import {
  IMAGE_EXT, VIDEO_EXT, NEAR_DUPLICATE_THRESHOLD, dhashFromPixels, hamming, inferEventDate, parseFacebookJson, titleFromText, type FbMedia,
} from "../lib/ingest-core.ts";
import type { ImportBatch, ImportItem, SourceKind } from "../lib/types.ts";

const args = Object.fromEntries(
  process.argv.slice(2).reduce<[string, string][]>((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : acc), []),
);
const source = args.source ? path.resolve(args.source) : "";
const kind = (args.kind ?? "folder") as "folder" | "facebook";
const label = args.label ?? path.basename(source);
const DATA_DIR = process.env.DATA_DIR || path.resolve(".data");
if (!source) {
  console.error("Thiếu --source <thư mục>. Xem docs/INGESTION.md");
  process.exit(1);
}

const id = (p: string) => p + randomBytes(6).toString("hex");
const batchId = id("batch_");
const outDir = path.join(DATA_DIR, "uploads", "imports", batchId);

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((e) => {
    const p = path.join(dir, e.name);
    if (e.name.startsWith(".")) return [];
    return e.isDirectory() ? walk(p) : [p];
  }));
  return files.flat();
}

async function collect(): Promise<{ file: string; fb?: FbMedia }[]> {
  if (kind === "folder") {
    return (await walk(source)).filter((f) => [...IMAGE_EXT, ...VIDEO_EXT].includes(path.extname(f).toLowerCase())).map((file) => ({ file }));
  }
  const jsons = (await walk(source)).filter((f) => f.endsWith(".json"));
  const media: { file: string; fb: FbMedia }[] = [];
  for (const j of jsons) {
    try {
      for (const m of parseFacebookJson(JSON.parse(await fs.readFile(j, "utf8")))) media.push({ file: path.join(source, m.uri), fb: m });
    } catch { /* not a media JSON */ }
  }
  return media;
}

const items: ImportItem[] = [];
const errors: ImportBatch["errors"] = [];
const seen = new Map<string, string>();
const hashes: { dhash: string; id: string }[] = [];
let duplicates = 0;

const list = await collect();
console.log(`Tìm thấy ${list.length} file media trong ${source}`);

for (const { file, fb } of list) {
  const rel = path.relative(source, file);
  const ext = path.extname(file).toLowerCase();
  try {
    const buf = await fs.readFile(file);
    const sha256 = createHash("sha256").update(buf).digest("hex");
    if (seen.has(sha256)) { duplicates++; continue; }
    const itemId = id("imp_");
    seen.set(sha256, itemId);
    const sourceKind: SourceKind = kind === "facebook" ? "facebook_export" : "personal";
    const src = { kind: sourceKind, ref: rel, note: fb?.album ? `Album Facebook: ${fb.album}` : undefined };

    if (VIDEO_EXT.includes(ext)) {
      items.push({ id: itemId, batchId, kind: "video", title: titleFromText(fb?.text ?? fb?.postText, path.basename(file)), source: src, state: "needs_review",
        issues: ["Video: tải lên nơi lưu trữ video được phép (YouTube/Vimeo) rồi dán liên kết — không lưu trong repo"],
        ...inferEventDate({ uploadedAt: fb?.timestamp ? new Date(fb.timestamp * 1000) : null }) });
      continue;
    }

    const img = sharp(buf, { failOn: "none" }).rotate();
    const meta = await img.metadata();
    const raw = await sharp(buf, { failOn: "none" }).rotate().greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
    const dhash = dhashFromPixels(raw);
    let exifDate: Date | null = null;
    try { exifDate = (await exifr.parse(buf, ["DateTimeOriginal", "CreateDate"]))?.DateTimeOriginal ?? null; } catch { /* no exif */ }
    const dates = inferEventDate({ exif: exifDate, uploadedAt: fb?.timestamp ? new Date(fb.timestamp * 1000) : null });
    const issues = [...dates.issues];
    const near = hashes.find((h) => hamming(h.dhash, dhash) <= NEAR_DUPLICATE_THRESHOLD);
    if (near) issues.push(`Có thể trùng (gần giống) với ${near.id}`);
    hashes.push({ dhash, id: itemId });
    if (!fb?.text) issues.push("Chưa có chú thích");
    issues.push("Chưa xác nhận người trong ảnh đồng ý");

    const dir = path.join(outDir, itemId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `original${ext}`), buf);
    await img.clone().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, "preview.webp"));
    await img.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(dir, "thumb.webp"));
    const { dominant } = await sharp(buf, { failOn: "none" }).stats();
    const base = `/media/u/imports/${batchId}/${itemId}`;
    const swap = (meta.orientation ?? 1) >= 5;
    items.push({
      id: itemId, batchId, kind: "photo", title: titleFromText(fb?.text ?? fb?.postText, path.basename(file, ext)),
      description: fb?.postText, source: src, state: "needs_review", issues, publishedAt: dates.publishedAt, eventDate: dates.eventDate,
      suggestedAlbum: fb?.album,
      asset: {
        id: itemId, src: `${base}/preview.webp`, preview: `${base}/preview.webp`, thumb: `${base}/thumb.webp`,
        width: (swap ? meta.height : meta.width) ?? 1600, height: (swap ? meta.width : meta.height) ?? 1200,
        alt: fb?.text ? titleFromText(fb.text, "Ảnh nhập") : "Ảnh nhập — cần viết mô tả",
        caption: fb?.text, takenAt: dates.eventDate, sha256, dhash, source: src,
        tone: `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`,
      },
    });
    process.stdout.write(".");
  } catch (e) {
    errors.push({ file: rel, reason: (e as Error).message.slice(0, 200) });
  }
}

const batch: ImportBatch = {
  id: batchId, label, createdAt: new Date().toISOString(), sourceKind: kind === "facebook" ? "facebook_export" : "personal",
  stats: { total: list.length, imported: items.length, duplicates, errors: errors.length }, errors,
};
await fs.mkdir(path.join(DATA_DIR, "inbox"), { recursive: true });
const out = path.join(DATA_DIR, "inbox", `${batchId}.json`);
await fs.writeFile(out, JSON.stringify({ batch, items }, null, 2));
console.log(`\n✓ ${items.length} mục · ${duplicates} trùng · ${errors.length} lỗi`);
errors.forEach((e) => console.log(`  ✕ ${e.file}: ${e.reason}`));
console.log(`Lô chờ duyệt: ${out}\nMở /admin/imports để nạp và duyệt.`);
