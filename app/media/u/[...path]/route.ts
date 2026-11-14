import { promises as fs } from "node:fs";
import { isAdmin } from "@/lib/auth";
import { readDb, uploadPath } from "@/lib/store";
import { isPublic } from "@/lib/governance";
import type { ArchiveDB } from "@/lib/types";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", heif: "image/heif",
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
};

const cache = new WeakMap<ArchiveDB, Set<string>>();
/** URLs referenced by records that are currently public. */
function publicUrls(db: ArchiveDB): Set<string> {
  const hit = cache.get(db);
  if (hit) return hit;
  const set = new Set<string>();
  const add = (a?: { src: string; preview?: string; thumb?: string }) => { if (a) [a.src, a.preview, a.thumb].forEach((u) => u && set.add(u)); };
  db.albums.filter(isPublic).forEach((al) => al.assets.forEach(add));
  db.articles.filter(isPublic).forEach((a) => add(a.cover));
  db.videos.filter(isPublic).forEach((v) => add(v.poster));
  db.profiles.filter((p) => isPublic(p) && p.showPortrait).forEach((p) => add(p.portrait));
  cache.set(db, set);
  return set;
}

/**
 * Serves uploaded media. Visitors only get files referenced by a public
 * record (EXIF-stripped previews); originals and unreviewed submissions are
 * admin-only. Everything else is a 404 — we don't reveal what exists.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const rel = parts.join("/");
  const url = `/media/u/${rel}`;
  const admin = await isAdmin();
  if (!admin && !publicUrls(await readDb()).has(url)) return new Response("Not found", { status: 404 });
  let file: Buffer;
  try {
    file = await fs.readFile(uploadPath(rel));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const ext = rel.split(".").pop()?.toLowerCase() ?? "";
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": admin ? "private, no-store" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      ...(ext in TYPES ? {} : { "Content-Disposition": "attachment" }),
    },
  });
}
