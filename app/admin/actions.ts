"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";
import { adminConfigured, createSessionToken, safeEqual, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { mutate, readDb, DATA_DIR, StoreWriteError } from "@/lib/store";
import { SCHEMAS, isCollection } from "@/lib/admin-schema";
import { applyForm } from "@/lib/admin-form";
import { assetFromUpload, storeUpload, IMAGE_TYPES, validateFile } from "@/lib/uploads";
import { uid } from "@/lib/text";
import type { Album, ArchiveDB, BaseRecord, ImportBatch, ImportItem, MediaAsset } from "@/lib/types";

/* ───────── Auth ───────── */

const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: unknown, form: FormData): Promise<{ error?: string }> {
  if (!adminConfigured()) return { error: "Trang quản trị chưa được cấu hình (thiếu ADMIN_PASSWORD hoặc SESSION_SECRET)." };
  const key = "admin";
  const a = attempts.get(key);
  if (a && a.until > Date.now()) return { error: "Quá nhiều lần thử. Đợi một phút rồi thử lại." };
  const ok = await safeEqual(String(form.get("password") ?? ""), process.env.ADMIN_PASSWORD!);
  if (!ok) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(key, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
    return { error: "Mật khẩu không đúng." };
  }
  attempts.delete(key);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIE,
    path: "/", maxAge: SESSION_MAX_AGE,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ───────── Helpers ───────── */

function revalidatePublic() {
  revalidatePath("/", "layout");
}

/* ───────── Generic CRUD ───────── */

export interface SaveState { errors?: Record<string, string>; message?: string; ok?: boolean }

export async function saveRecord(collection: string, id: string, _: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  if (!isCollection(collection)) return { message: "Bộ sưu tập không tồn tại." };
  const schema = SCHEMAS[collection];
  let newId = id;
  try {
    const result = await mutate(async (db) => {
      const list = db[collection] as unknown as BaseRecord[];
      const now = new Date().toISOString();
      let rec = list.find((r) => r.id === id) as unknown as Record<string, unknown> | undefined;
      const isNew = !rec;
      if (!rec) {
        newId = uid(collection.slice(0, 2) + "-");
        rec = { id: newId, tags: [], people: [], createdAt: now, status: "draft", visibility: "public", consent: "pending", review: "needs_review",
          ...(collection === "albums" ? { assets: [] } : {}),
          ...(collection === "events" ? { albumIds: [], videoIds: [], articleIds: [] } : {}),
          ...(collection === "videos" ? { albumIds: [], articleIds: [], provider: "none" } : {}),
          ...(collection === "profiles" ? { showPortrait: false, showBio: false } : {}),
        };
      }
      const draft = structuredClone(rec);
      const { errors } = applyForm(draft, schema.fields, form);
      if (list.some((r) => r.slug === draft.slug && r.id !== draft.id)) errors.slug = "Đường dẫn đã được dùng";

      // image fields: upload or remove
      for (const f of schema.fields.filter((x) => x.type === "image")) {
        const file = form.get(`${f.name}__file`);
        if (form.get(`${f.name}__remove`) === "on") delete draft[f.name];
        if (file instanceof File && file.size > 0) {
          const err = validateFile(file);
          if (err || !IMAGE_TYPES.includes(file.type)) { errors[f.name] = err ?? "Chỉ nhận ảnh"; continue; }
          const sf = await storeUpload(file, `library/${collection}`);
          draft[f.name] = assetFromUpload(sf, String(form.get(`${f.name}__alt`) || draft.title || ""));
        } else if (draft[f.name] && typeof form.get(`${f.name}__alt`) === "string") {
          (draft[f.name] as MediaAsset).alt = String(form.get(`${f.name}__alt`));
        }
      }

      // album photos
      if (collection === "albums") {
        const assets = (draft.assets as MediaAsset[]) ?? [];
        const kept: MediaAsset[] = [];
        assets.forEach((a, i) => {
          if (form.get(`asset.${i}.remove`) === "on") return;
          a.alt = String(form.get(`asset.${i}.alt`) ?? a.alt).trim() || a.alt;
          a.caption = String(form.get(`asset.${i}.caption`) ?? "").trim() || undefined;
          a.photographer = String(form.get(`asset.${i}.photographer`) ?? "").trim() || undefined;
          kept.push(a);
        });
        for (const file of form.getAll("newAssets")) {
          if (!(file instanceof File) || file.size === 0) continue;
          const err = validateFile(file);
          if (err || !IMAGE_TYPES.includes(file.type)) { errors.newAssets = err ?? "Chỉ nhận ảnh"; continue; }
          const sf = await storeUpload(file, `library/albums`);
          kept.push(assetFromUpload(sf, `Ảnh trong album ${draft.title ?? ""}`.trim()));
        }
        draft.assets = kept;
        const cover = String(form.get("coverId") ?? "");
        draft.coverId = kept.some((a) => a.id === cover) ? cover : kept[0]?.id;
      }

      if (Object.keys(errors).length) return { errors };
      draft.updatedAt = now;
      if (isNew) list.push(draft as unknown as BaseRecord);
      else list.splice(list.findIndex((r) => r.id === id), 1, draft as unknown as BaseRecord);
      return { errors: undefined };
    }, `${collection}.save`, id);
    if (result.errors) return { errors: result.errors, message: "Chưa lưu — kiểm tra các trường được đánh dấu." };
  } catch (e) {
    return { message: e instanceof StoreWriteError ? e.message : `Lỗi: ${(e as Error).message}` };
  }
  revalidatePublic();
  if (newId !== id) redirect(`/admin/${collection}/${newId}?saved=1`);
  return { ok: true, message: "Đã lưu." };
}

/** Archive rather than delete: removal from public view must be quick, permanent deletion deliberate. */
export async function archiveRecord(collection: string, id: string) {
  await requireAdmin();
  if (!isCollection(collection)) return;
  await mutate((db) => {
    const r = (db[collection] as unknown as BaseRecord[]).find((x) => x.id === id);
    if (r) { r.status = "archived"; r.visibility = "hidden"; r.updatedAt = new Date().toISOString(); }
  }, `${collection}.archive`, id);
  revalidatePublic();
  redirect(`/admin/${collection}`);
}

export async function deleteRecord(collection: string, id: string, form: FormData) {
  await requireAdmin();
  if (!isCollection(collection) || form.get("confirm") !== "XOA") redirect(`/admin/${collection}/${id}?delete=confirm`);
  await mutate((db) => {
    const list = db[collection] as unknown as BaseRecord[];
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list.splice(i, 1);
  }, `${collection}.delete`, id);
  revalidatePublic();
  redirect(`/admin/${collection}`);
}

/* ───────── Moderation ───────── */

export async function moderateSubmission(id: string, form: FormData) {
  await requireAdmin();
  const decision = String(form.get("decision"));
  const note = String(form.get("note") ?? "").slice(0, 2000) || undefined;
  let target = `/admin/submissions/${id}`;
  await mutate((db) => {
    const s = db.submissions.find((x) => x.id === id);
    if (!s) return;
    s.moderatorNote = note;
    s.updatedAt = new Date().toISOString();
    if (decision === "reject") s.status = "rejected";
    if (decision === "pending") s.status = "pending";
    if (decision === "approve-draft") {
      s.status = "approved";
      // Approval never publishes: it creates a DRAFT that still needs consent + review.
      const now = new Date().toISOString();
      const consent = s.consent.peopleAgreed && s.consent.allowPublication ? "granted" : "pending";
      const common = {
        slug: `${uid("").slice(0, 6)}-${s.title}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").slice(0, 70),
        title: s.title, description: s.body.slice(0, 600), tags: [], people: [],
        source: { kind: "contribution" as const, note: `Bài gửi ${s.id} của ${s.name}`, url: s.relatedUrl },
        eventDate: s.eventDate ? { value: s.eventDate, precision: (s.eventDate.length === 4 ? "year" : s.eventDate.length === 7 ? "month" : "day") as "year" | "month" | "day" } : undefined,
        status: "draft" as const, visibility: "public" as const, consent: consent as "granted" | "pending", review: "needs_review" as const,
        uncertain: ["eventDate", "description"], createdAt: now, updatedAt: now,
        rights: { holder: s.name, license: "unknown" as const },
      };
      const images = s.files.filter((f) => f.preview);
      if (images.length) {
        const album: Album = { ...common, id: uid("al-"), topic: "event", assets: images.map((f) => assetFromUpload(f, `Ảnh do ${s.name} gửi`, { photographer: s.name, source: { kind: "contribution", ref: s.id } })) };
        album.coverId = album.assets[0]?.id;
        db.albums.push(album);
        target = `/admin/albums/${album.id}`;
      } else if (s.type === "article" || s.type === "memory") {
        const id2 = uid("ar-");
        db.articles.push({ ...common, id: id2, author: s.name, category: s.type === "article" ? "contribution" : "memory", body: s.body, publishedAt: now });
        target = `/admin/articles/${id2}`;
      } else if (s.type === "event") {
        const id2 = uid("ev-");
        db.events.push({ ...common, id: id2, category: "class", schoolYear: "2022-2023", albumIds: [], videoIds: [], articleIds: [], body: s.body });
        target = `/admin/events/${id2}`;
      }
    }
  }, `submission.${decision}`, id);
  revalidatePublic();
  redirect(target);
}

/* ───────── Imports (from scripts/ingest.ts inbox) ───────── */

const INBOX = path.join(DATA_DIR, "inbox");

export async function loadInboxBatch(file: string) {
  await requireAdmin();
  const safe = path.basename(file);
  const full = path.join(INBOX, safe);
  const data = JSON.parse(await fs.readFile(full, "utf8")) as { batch: ImportBatch; items: ImportItem[] };
  await mutate((db: ArchiveDB) => {
    if (db.batches.some((b) => b.id === data.batch.id)) return;
    // duplicates against what is already in the archive
    const known = new Set(db.albums.flatMap((a) => a.assets.map((x) => x.sha256)).filter(Boolean));
    for (const it of data.items) if (it.asset?.sha256 && known.has(it.asset.sha256)) { it.duplicateOf = "archive"; it.issues.push("Trùng với ảnh đã có trong kho"); }
    db.batches.unshift(data.batch);
    db.imports.push(...data.items);
  }, "import.load", data.batch.id);
  await fs.mkdir(path.join(INBOX, "processed"), { recursive: true });
  await fs.rename(full, path.join(INBOX, "processed", safe));
  redirect("/admin/imports");
}

export async function decideImports(form: FormData) {
  await requireAdmin();
  const ids = form.getAll("item").map(String);
  const decision = String(form.get("decision"));
  const albumTitle = String(form.get("albumTitle") ?? "").trim() || "Ảnh nhập";
  let albumId = "";
  await mutate((db) => {
    const items = db.imports.filter((i) => ids.includes(i.id) && i.state === "needs_review");
    if (decision === "reject") { items.forEach((i) => { i.state = "rejected"; }); return; }
    const assets = items.filter((i) => i.asset).map((i) => ({ ...i.asset!, source: i.source }));
    if (!assets.length) return;
    const now = new Date().toISOString();
    const dates = items.map((i) => i.eventDate).filter(Boolean);
    albumId = uid("al-");
    db.albums.push({
      id: albumId, slug: `${albumId.slice(3, 9)}-${albumTitle}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-"),
      title: albumTitle, topic: "event", assets, coverId: assets[0].id, tags: [], people: [],
      eventDate: dates[0] ? { ...dates[0]!, approximate: true } : undefined,
      source: items[0].source, status: "draft", visibility: "public", consent: "pending", review: "needs_review",
      uncertain: ["eventDate", "people"], createdAt: now, updatedAt: now,
    });
    items.forEach((i) => { i.state = "accepted"; });
  }, `import.${decision}`, ids.join(","));
  redirect(albumId ? `/admin/albums/${albumId}` : "/admin/imports");
}
