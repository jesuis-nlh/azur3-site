import { NextResponse, type NextRequest } from "next/server";
import { mutate, StoreWriteError } from "@/lib/store";
import { safeEqual } from "@/lib/session";
import { MAX_FILES, storeUpload, validateFile } from "@/lib/uploads";
import { uid } from "@/lib/text";
import type { Submission, SubmissionType } from "@/lib/types";

export const runtime = "nodejs";

const TYPES: SubmissionType[] = ["photo", "video", "article", "event", "correction", "caption", "memory", "removal"];
const hits = new Map<string, number[]>();

/** 8 submissions per IP per 10 minutes — enough for people, annoying for bots. */
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 8;
}

function str(v: FormDataEntryValue | null, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "Bạn gửi quá nhanh. Hãy thử lại sau vài phút." }, { status: 429 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 }); }

  // Honeypot: real people never fill this hidden field
  if (str(form.get("website"), 200)) return NextResponse.json({ ok: true });

  const errors: Record<string, string> = {};
  const expected = process.env.CONTRIBUTOR_CODE;
  const type = str(form.get("type"), 20) as SubmissionType;
  const isRemoval = type === "removal" || type === "correction";
  // Removal and correction requests are always accepted: anyone affected must be able to ask.
  if (!isRemoval) {
    if (!expected) return NextResponse.json({ error: "Chức năng đóng góp chưa được bật (thiếu mã đóng góp ở máy chủ)." }, { status: 503 });
    if (!(await safeEqual(str(form.get("code"), 100), expected))) errors.code = "Mã đóng góp không đúng.";
  }
  if (!TYPES.includes(type)) errors.type = "Hãy chọn loại nội dung.";
  const name = str(form.get("name"), 80);
  const title = str(form.get("title"), 160);
  const body = str(form.get("body"), 8000);
  if (!name) errors.name = "Hãy cho biết tên hiển thị của bạn.";
  if (!title) errors.title = "Hãy đặt một tiêu đề ngắn.";
  if (body.length < 10) errors.body = "Hãy viết vài dòng mô tả (ít nhất 10 ký tự).";
  const relatedUrl = str(form.get("relatedUrl"), 500);
  if (relatedUrl && !/^https?:\/\//i.test(relatedUrl)) errors.relatedUrl = "Liên kết phải bắt đầu bằng http:// hoặc https://";
  const eventDate = str(form.get("eventDate"), 10);
  if (eventDate && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(eventDate)) errors.eventDate = "Ngày không hợp lệ.";

  const consent = {
    ownsOrAuthorised: form.get("ownsOrAuthorised") === "on",
    peopleAgreed: form.get("peopleAgreed") === "on",
    allowPublication: form.get("allowPublication") === "on",
  };
  if (!isRemoval && !consent.ownsOrAuthorised) errors.ownsOrAuthorised = "Bạn cần xác nhận mình có quyền chia sẻ nội dung này.";

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_FILES) errors.files = `Tối đa ${MAX_FILES} file mỗi lần gửi.`;
  for (const f of files) {
    const e = validateFile(f);
    if (e) { errors.files = e; break; }
  }
  if ((type === "photo" || type === "video") && !files.length && !relatedUrl) errors.files = "Hãy đính kèm file hoặc dán liên kết.";

  if (Object.keys(errors).length) return NextResponse.json({ error: "Vui lòng kiểm tra lại các trường được đánh dấu.", fields: errors }, { status: 422 });

  const id = uid("sub_");
  try {
    const stored = [];
    for (const f of files) stored.push(await storeUpload(f, `submissions/${id}`));
    const now = new Date().toISOString();
    const submission: Submission = {
      id, type, name, contact: str(form.get("contact"), 120) || undefined, title, body,
      eventDate: eventDate || undefined, relatedUrl: relatedUrl || undefined,
      files: stored, consent, status: "pending", createdAt: now, updatedAt: now,
    };
    await mutate((db) => { db.submissions.unshift(submission); }, "submission.received", id);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const msg = err instanceof StoreWriteError ? err.message : "Máy chủ gặp lỗi khi lưu bài gửi. Hãy thử lại.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
