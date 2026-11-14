import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { moderateSubmission } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
const TYPE_LABELS: Record<string, string> = { photo: "Ảnh", video: "Video", article: "Bài viết", event: "Sự kiện", correction: "Đính chính", caption: "Chú thích", memory: "Ký ức", removal: "Yêu cầu gỡ" };

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = await readDb();
  const s = db.submissions.find((x) => x.id === id);
  if (!s) notFound();
  // exact duplicates of files already in the archive or in other submissions
  const known = new Map<string, string>();
  db.albums.forEach((a) => a.assets.forEach((x) => x.sha256 && known.set(x.sha256, `album “${a.title}”`)));
  db.submissions.filter((o) => o.id !== s.id).forEach((o) => o.files.forEach((f) => known.set(f.sha256, `bài gửi ${o.id}`)));

  return (
    <AdminShell current="submissions" pending={db.submissions.filter((x) => x.status === "pending").length}>
      <header className="admin-head">
        <div>
          <p className="admin-crumb"><Link href="/admin/submissions">Bài gửi</Link> · {TYPE_LABELS[s.type]}</p>
          <h1>{s.title}</h1>
          <p className="admin-muted">Gửi bởi <b>{s.name}</b>{s.contact ? <> · liên hệ: {s.contact}</> : null} · {s.createdAt.replace("T", " ").slice(0, 16)} · {s.id}</p>
        </div>
      </header>
      {s.type === "removal" ? <p className="admin-alert">Yêu cầu gỡ: ẩn nội dung liên quan trước (Lưu trữ & ẩn trong trang sửa), rồi xác minh sau.</p> : null}
      <div className="admin-editor">
        <div className="admin-editor__main">
          <section className="admin-section">
            <h2>Nội dung</h2>
            <p className="admin-pre">{s.body}</p>
            <dl className="admin-dl">
              <dt>Thời điểm (theo người gửi)</dt><dd>{s.eventDate ?? "—"}</dd>
              <dt>Liên kết</dt><dd>{s.relatedUrl ? <a href={s.relatedUrl} target="_blank" rel="noopener noreferrer">{s.relatedUrl}</a> : "—"}</dd>
            </dl>
          </section>
          {s.files.length ? (
            <section className="admin-section">
              <h2>File ({s.files.length})</h2>
              <ul className="admin-files">
                {s.files.map((f) => (
                  <li key={f.id}>
                    {f.preview ? <img src={`/media/u/${f.preview}`} alt={f.originalName} /> : <span className="admin-file-ph">{f.mime}</span>}
                    <div>
                      <p><b>{f.originalName}</b></p>
                      <p className="admin-muted">{(f.size / 1e6).toFixed(2)} MB · {f.width ? `${f.width}×${f.height}` : f.mime}</p>
                      {known.has(f.sha256) ? <p className="admin-error">Trùng với {known.get(f.sha256)}</p> : null}
                      <a href={`/media/u/${f.path}`} download>Tải bản gốc</a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <aside className="admin-editor__side">
          <section className="admin-gov">
            <h2>Sự đồng ý (người gửi khai)</h2>
            <ul className="admin-consent">
              <li className={s.consent.ownsOrAuthorised ? "ok" : "no"}>Có quyền chia sẻ</li>
              <li className={s.consent.peopleAgreed ? "ok" : "no"}>Người trong ảnh đã đồng ý</li>
              <li className={s.consent.allowPublication ? "ok" : "no"}>Cho phép đăng công khai</li>
            </ul>
          </section>
          <form action={moderateSubmission.bind(null, s.id)} className="admin-gov">
            <h2>Quyết định <span className="admin-muted">— hiện: {s.status}</span></h2>
            <label htmlFor="note">Ghi chú nội bộ</label>
            <textarea id="note" name="note" rows={4} defaultValue={s.moderatorNote ?? ""} className="admin-input" />
            <button name="decision" value="approve-draft" className="admin-btn admin-btn--block">Duyệt → tạo bản nháp</button>
            <p className="admin-hint">Không xuất bản ngay: tạo album/bài viết/sự kiện ở trạng thái nháp, sự đồng ý “{s.consent.peopleAgreed && s.consent.allowPublication ? "Đã đồng ý" : "Chờ đồng ý"}”.</p>
            <button name="decision" value="reject" className="admin-btn admin-btn--ghost admin-btn--block">Từ chối</button>
            <button name="decision" value="pending" className="admin-btn admin-btn--ghost admin-btn--block">Để lại chờ</button>
          </form>
        </aside>
      </div>
    </AdminShell>
  );
}
