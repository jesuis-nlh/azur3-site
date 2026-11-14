import "server-only";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR } from "./store";
import { uid } from "./text";
import type { MediaAsset, SubmissionFile } from "./types";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_FILES = 20;

export function validateFile(f: { type: string; size: number; name: string }): string | null {
  const isImg = IMAGE_TYPES.includes(f.type), isVid = VIDEO_TYPES.includes(f.type);
  if (!isImg && !isVid) return `“${f.name}”: định dạng không được hỗ trợ (chỉ nhận JPG, PNG, WebP, HEIC, MP4, MOV, WebM).`;
  if (isImg && f.size > MAX_IMAGE_BYTES) return `“${f.name}”: ảnh vượt quá 25 MB.`;
  if (isVid && f.size > MAX_VIDEO_BYTES) return `“${f.name}”: video vượt quá 200 MB — hãy gửi liên kết thay vì tải file.`;
  if (f.size === 0) return `“${f.name}”: file rỗng.`;
  return null;
}

/**
 * Stores an original privately and, for images, generates web previews.
 * sharp drops EXIF (incl. GPS) from outputs by default; only the private
 * original keeps it, for archival metadata extraction by admins.
 */
export async function storeUpload(file: File, folder: string): Promise<SubmissionFile> {
  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const id = uid("f_");
  const ext = (path.extname(file.name) || "").toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 6);
  const dir = path.join(UPLOAD_DIR, folder, id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `original${ext}`), buf);
  const out: SubmissionFile = {
    id, originalName: file.name.slice(0, 200), mime: file.type, size: file.size,
    path: path.posix.join(folder, id, `original${ext}`), sha256,
  };
  if (IMAGE_TYPES.includes(file.type)) {
    try {
      const img = sharp(buf, { failOn: "none" }).rotate();
      const meta = await img.metadata();
      await img.clone().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, "preview.webp"));
      await img.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(dir, "thumb.webp"));
      out.preview = path.posix.join(folder, id, "preview.webp");
      const swap = (meta.orientation ?? 1) >= 5;
      out.width = swap ? meta.height : meta.width;
      out.height = swap ? meta.width : meta.height;
    } catch {
      // HEIC without decoder support, corrupt files: keep original, moderators can still download it
    }
  }
  return out;
}

/** Public asset URLs always point at EXIF-stripped variants, never the original. */
export function assetFromUpload(sf: SubmissionFile, alt: string, extra: Partial<MediaAsset> = {}): MediaAsset {
  const base = `/media/u/${sf.path.replace(/\/original[^/]*$/, "")}`;
  return {
    id: sf.id,
    src: `${base}/preview.webp`,
    preview: `${base}/preview.webp`,
    thumb: `${base}/thumb.webp`,
    width: sf.width ?? 1600,
    height: sf.height ?? 1200,
    alt,
    sha256: sf.sha256,
    ...extra,
  };
}

