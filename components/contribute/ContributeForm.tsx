"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Glyph from "@/components/ui/Glyph";

const TYPES = [
  { id: "photo", label: "Ảnh", hint: "Một hoặc nhiều tấm ảnh của lớp" },
  { id: "video", label: "Video", hint: "File ngắn, hoặc liên kết YouTube/Drive" },
  { id: "memory", label: "Ký ức", hint: "Một câu chuyện, vài dòng hồi tưởng" },
  { id: "article", label: "Bài viết", hint: "Bài dài cho Nhật ký lớp" },
  { id: "event", label: "Sự kiện", hint: "Bổ sung một sự kiện vào dòng thời gian" },
  { id: "caption", label: "Chú thích", hint: "Ai, ở đâu, khi nào trong một tấm ảnh" },
  { id: "correction", label: "Đính chính", hint: "Sửa thông tin sai" },
  { id: "removal", label: "Yêu cầu gỡ", hint: "Gỡ ảnh, ẩn hồ sơ — xử lý ưu tiên" },
] as const;

type Status = { kind: "idle" } | { kind: "uploading"; pct: number } | { kind: "done"; id: string } | { kind: "error"; message: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm";
const fmt = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.ceil(b / 1e3)} KB`);

export default function ContributeForm({ initialType, refSlug }: { initialType?: string; refSlug?: string }) {
  const [type, setType] = useState<string>(TYPES.some((t) => t.id === initialType) ? initialType! : "photo");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const isRemoval = type === "removal" || type === "correction";
  const wantsFiles = type === "photo" || type === "video" || type === "caption" || type === "event" || type === "memory";

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 20);
    setFiles(next);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current!;
    // client-side checks mirror the server; the server remains the authority
    const errs: Record<string, string> = {};
    const fd = new FormData(form);
    if (!String(fd.get("name") ?? "").trim()) errs.name = "Hãy cho biết tên hiển thị của bạn.";
    if (!String(fd.get("title") ?? "").trim()) errs.title = "Hãy đặt một tiêu đề ngắn.";
    if (String(fd.get("body") ?? "").trim().length < 10) errs.body = "Hãy viết vài dòng mô tả (ít nhất 10 ký tự).";
    if (!isRemoval && !String(fd.get("code") ?? "").trim()) errs.code = "Hãy nhập mã đóng góp.";
    if (!isRemoval && !fd.get("ownsOrAuthorised")) errs.ownsOrAuthorised = "Bạn cần xác nhận mình có quyền chia sẻ nội dung này.";
    setFields(errs);
    if (Object.keys(errs).length) {
      setStatus({ kind: "error", message: "Vui lòng kiểm tra lại các trường được đánh dấu." });
      form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    fd.delete("files");
    files.forEach((f) => fd.append("files", f));

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/contribute");
    xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setStatus({ kind: "uploading", pct: Math.round((ev.loaded / ev.total) * 100) }); };
    xhr.onload = () => {
      let data: { ok?: boolean; id?: string; error?: string; fields?: Record<string, string> } = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
        setStatus({ kind: "done", id: data.id ?? "" });
        setFiles([]);
        form.reset();
        window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 120 });
      } else {
        setFields(data.fields ?? {});
        setStatus({ kind: "error", message: data.error ?? `Gửi không thành công (mã ${xhr.status}).` });
      }
    };
    xhr.onerror = () => setStatus({ kind: "error", message: "Mất kết nối khi tải lên. Kiểm tra mạng và thử lại." });
    xhr.onabort = () => setStatus({ kind: "idle" });
    setStatus({ kind: "uploading", pct: 0 });
    xhr.send(fd);
  };

  if (status.kind === "done") {
    return (
      <div className="contribute-done" role="status">
        <span className="home-cta__star" aria-hidden="true" />
        <h2 className="h1">Một vì sao <em>đã được gửi.</em></h2>
        <p className="lede">Bài gửi đang chờ ban biên tập xem xét. Nó sẽ không xuất hiện công khai cho đến khi được duyệt và những người liên quan đồng ý.</p>
        <p className="coord">Mã tham chiếu: {status.id}</p>
        <div className="home-hero__ctas">
          <button type="button" className="btn btn--primary" onClick={() => setStatus({ kind: "idle" })}>Gửi thêm</button>
          <Link href="/" className="btn">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const err = (k: string) => fields[k] ? <p id={`${k}-err`} className="error-text">{fields[k]}</p> : null;
  const busy = status.kind === "uploading";

  return (
    <form ref={formRef} className="contribute-form" onSubmit={submit} noValidate aria-busy={busy}>
      <fieldset className="field">
        <legend className="h3">1. Bạn muốn gửi gì?</legend>
        <div className="type-grid" role="radiogroup">
          {TYPES.map((t) => (
            <label key={t.id} className={`type-option${type === t.id ? " is-on" : ""}`}>
              <input type="radio" name="type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} />
              <span className="type-option__label">{t.label}</span>
              <span className="type-option__hint">{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field contribute-form__group">
        <legend className="h3">2. Nội dung</legend>
        <div className="form-row">
          <div className="field">
            <label htmlFor="c-name">Tên hiển thị *</label>
            <input id="c-name" name="name" className="input" autoComplete="nickname" maxLength={80} aria-invalid={!!fields.name} aria-describedby={fields.name ? "name-err" : undefined} />
            {err("name")}
          </div>
          <div className="field">
            <label htmlFor="c-contact">Cách liên hệ (không bắt buộc)</label>
            <input id="c-contact" name="contact" className="input" maxLength={120} placeholder="Email hoặc Zalo" />
            <p className="hint">Chỉ ban biên tập thấy, để hỏi lại khi cần. Không bao giờ công khai.</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="c-title">Tiêu đề *</label>
          <input id="c-title" name="title" className="input" maxLength={160} defaultValue={refSlug ? `Về: ${refSlug}` : ""} aria-invalid={!!fields.title} aria-describedby={fields.title ? "title-err" : undefined} />
          {err("title")}
        </div>
        <div className="field">
          <label htmlFor="c-body">{isRemoval ? "Bạn muốn gỡ hoặc sửa gì, và vì sao? *" : "Kể lại hoặc mô tả *"}</label>
          <textarea id="c-body" name="body" className="textarea" maxLength={8000} aria-invalid={!!fields.body} aria-describedby={fields.body ? "body-err" : "body-hint"}
            placeholder={isRemoval ? "Dán đường dẫn trang và mô tả nội dung cần gỡ/sửa." : "Chuyện gì đã xảy ra? Ai có mặt (nếu họ đồng ý được nhắc tên)?"} />
          <p id="body-hint" className="hint">Nếu không chắc chi tiết nào, hãy ghi rõ là “không chắc” — ban biên tập sẽ đánh dấu cần xác minh.</p>
          {err("body")}
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="c-date">Thời điểm sự kiện</label>
            <input id="c-date" name="eventDate" className="input" placeholder="2023, 2023-11 hoặc 2023-11-20" pattern="\d{4}(-\d{2}(-\d{2})?)?" aria-invalid={!!fields.eventDate} />
            <p className="hint">Ngày sự kiện xảy ra, không phải ngày đăng ảnh.</p>
            {err("eventDate")}
          </div>
          <div className="field">
            <label htmlFor="c-url">Liên kết (không bắt buộc)</label>
            <input id="c-url" name="relatedUrl" className="input" type="url" inputMode="url" placeholder="https://" aria-invalid={!!fields.relatedUrl} />
            {err("relatedUrl")}
          </div>
        </div>

        {wantsFiles ? (
          <div className="field">
            <span className="field-label">Ảnh / video</span>
            <label className={`dropzone${drag ? " is-drag" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
              <input type="file" name="files" multiple accept={ACCEPT} className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <Glyph name="upload" size={26} />
              <span><strong>Chọn file</strong> hoặc kéo thả vào đây</span>
              <span className="hint">JPG, PNG, WebP, HEIC tới 25 MB · MP4, MOV, WebM tới 200 MB · tối đa 20 file</span>
            </label>
            {files.length ? (
              <ul className="file-list">
                {files.map((f, n) => (
                  <li key={n}>
                    <span>{f.name}</span><span className="coord">{fmt(f.size)}</span>
                    <button type="button" className="icon-btn" aria-label={`Bỏ ${f.name}`} onClick={() => setFiles(files.filter((_, k) => k !== n))}><Glyph name="close" size={14} /></button>
                  </li>
                ))}
              </ul>
            ) : null}
            {err("files")}
          </div>
        ) : null}
      </fieldset>

      <fieldset className="field contribute-form__group">
        <legend className="h3">3. Quyền và sự đồng ý</legend>
        {!isRemoval ? (
          <>
            <label className="check"><input type="checkbox" name="ownsOrAuthorised" aria-invalid={!!fields.ownsOrAuthorised} /> <span>Tôi là người chụp/quay/viết, hoặc được tác giả cho phép chia sẻ. *</span></label>
            {err("ownsOrAuthorised")}
            <label className="check"><input type="checkbox" name="peopleAgreed" /> <span>Những người thấy rõ mặt trong ảnh/video đã đồng ý (nếu chưa, ban biên tập sẽ hỏi trước khi đăng).</span></label>
            <label className="check"><input type="checkbox" name="allowPublication" /> <span>Tôi đồng ý cho đăng công khai trên trang sau khi được duyệt. Nếu bỏ trống, nội dung chỉ được lưu trữ nội bộ.</span></label>
          </>
        ) : (
          <p className="notice">Yêu cầu gỡ và đính chính không cần mã đóng góp. Nội dung liên quan sẽ được ẩn trong lúc ban biên tập xem xét nếu yêu cầu ảnh hưởng đến quyền riêng tư.</p>
        )}
        <p className="small faint">Xem <Link href="/quyen-rieng-tu">chính sách quyền riêng tư</Link> để biết dữ liệu của bạn được xử lý thế nào.</p>
      </fieldset>

      <div className="contribute-form__submit">
        {!isRemoval ? (
          <div className="field">
            <label htmlFor="c-code">Mã đóng góp *</label>
            <input id="c-code" name="code" className="input" autoComplete="off" aria-invalid={!!fields.code} aria-describedby="code-hint" />
            <p id="code-hint" className="hint">Mã được chia sẻ riêng trong nhóm lớp, để chỉ thành viên mới gửi được.</p>
            {err("code")}
          </div>
        ) : null}
        {/* honeypot */}
        <div aria-hidden="true" className="sr-only"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

        {status.kind === "uploading" ? (
          <div className="upload-progress" role="progressbar" aria-label="Tiến độ tải lên" aria-valuenow={status.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="upload-progress__bar" style={{ width: `${status.pct}%` }} />
            <span className="coord">{status.pct < 100 ? `Đang tải lên ${status.pct}%` : "Đang xử lý…"}</span>
          </div>
        ) : null}
        {status.kind === "error" ? <p className="form-alert" role="alert">{status.message}</p> : null}

        <div className="home-hero__ctas">
          <button type="submit" className="btn btn--primary" disabled={busy} data-magnetic>
            {busy ? "Đang gửi…" : <>Gửi vào kho <Glyph name="arrow" className="arrow" /></>}
          </button>
          {busy ? <button type="button" className="btn" onClick={() => xhrRef.current?.abort()}>Huỷ</button> : null}
        </div>
      </div>
    </form>
  );
}
