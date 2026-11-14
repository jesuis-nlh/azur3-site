/**
 * Ingestion core — pure functions, no framework imports (unit-tested).
 *
 * Pipeline: source files → metadata extraction → duplicate detection →
 * classification → human review (admin) → permission check → archive.
 */
import { fixFacebookMojibake } from "./text.ts";
import type { FuzzyDate } from "./types.ts";

export const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];
export const VIDEO_EXT = [".mp4", ".mov", ".m4v", ".webm"];

export interface FbMedia {
  /** path relative to the export root, as written by Facebook */
  uri: string;
  text?: string;
  /** unix seconds the media was created/uploaded on Facebook — a PUBLICATION time */
  timestamp?: number;
  album?: string;
  postText?: string;
}

type Json = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? fixFacebookMojibake(v) : undefined);
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/**
 * Parses Facebook "Download your information" JSON. Supports both post files
 * (`your_posts_1.json`: array of posts with attachments) and album files
 * (`album/0.json`: { name, photos: [...] }). Unknown shapes return [].
 */
export function parseFacebookJson(input: unknown): FbMedia[] {
  const out: FbMedia[] = [];
  const pushMedia = (m: Json, ctx: { album?: string; postText?: string; ts?: number }) => {
    const uri = s(m.uri);
    if (!uri || /^https?:/i.test(uri)) return;
    out.push({
      uri,
      text: s(m.description) ?? s(m.title),
      timestamp: n(m.creation_timestamp) ?? ctx.ts,
      album: ctx.album,
      postText: ctx.postText,
    });
  };

  if (input && typeof input === "object" && !Array.isArray(input) && Array.isArray((input as Json).photos)) {
    const album = s((input as Json).name);
    for (const p of (input as Json).photos as Json[]) pushMedia(p, { album });
    return out;
  }
  const posts = Array.isArray(input) ? input : Array.isArray((input as Json)?.status_updates_v2) ? ((input as Json).status_updates_v2 as unknown[]) : [];
  for (const post of posts as Json[]) {
    const ts = n(post.timestamp);
    const postText = (Array.isArray(post.data) ? (post.data as Json[]) : []).map((d) => s(d.post)).filter(Boolean).join("\n") || undefined;
    for (const att of Array.isArray(post.attachments) ? (post.attachments as Json[]) : []) {
      for (const d of Array.isArray(att.data) ? (att.data as Json[]) : []) {
        if (d.media && typeof d.media === "object") pushMedia(d.media as Json, { postText, ts });
      }
    }
  }
  return out;
}

/** Hamming distance between two equal-length hex hashes. */
export function hamming(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d + Math.abs(a.length - b.length) * 4;
}

/** dHash from a 9×8 greyscale raster (72 bytes, row-major) → 16 hex chars. */
export function dhashFromPixels(px: Uint8Array | number[]): string {
  if (px.length < 72) throw new Error("need 9x8 pixels");
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] > px[y * 9 + x + 1] ? "1" : "0";
  let hex = "";
  for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

export const NEAR_DUPLICATE_THRESHOLD = 6;

/**
 * Event date inference, honest about certainty:
 *  - EXIF DateTimeOriginal → day precision, still marked approximate (camera clocks drift)
 *  - Facebook upload time → it is a PUBLICATION date; the event is assumed to be
 *    in the same month at best → month precision, approximate
 *  - nothing → undefined (never invent)
 */
export function inferEventDate(opts: { exif?: Date | null; uploadedAt?: Date | null }): { eventDate?: FuzzyDate; publishedAt?: string; issues: string[] } {
  const issues: string[] = [];
  const valid = (d?: Date | null) => d instanceof Date && !Number.isNaN(d.getTime()) && d.getUTCFullYear() > 1990;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const publishedAt = valid(opts.uploadedAt) ? opts.uploadedAt!.toISOString() : undefined;
  if (valid(opts.exif)) {
    return { eventDate: { value: iso(opts.exif!), precision: "day", approximate: true }, publishedAt, issues };
  }
  if (publishedAt) {
    issues.push("Ngày sự kiện suy từ thời điểm đăng — cần xác nhận");
    return { eventDate: { value: publishedAt.slice(0, 7), precision: "month", approximate: true }, publishedAt, issues };
  }
  issues.push("Không có thông tin ngày tháng");
  return { issues };
}

/** Which configured school year a date falls in, if any. */
export function suggestSchoolYear(d: FuzzyDate | undefined, years: readonly string[]): string | undefined {
  if (!d || d.precision === "year") return undefined;
  const [y, m] = d.value.split("-").map(Number);
  const start = m >= 8 ? y : y - 1;
  const key = `${start}-${start + 1}`;
  return years.includes(key) ? key : undefined;
}

export function titleFromText(text: string | undefined, fallback: string): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return fallback;
  return t.length > 80 ? t.slice(0, 80).replace(/\s+\S*$/, "") + "…" : t;
}
