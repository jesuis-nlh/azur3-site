import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";
const TYPE_LABELS: Record<string, string> = { photo: "Ảnh", video: "Video", article: "Bài viết", event: "Sự kiện", correction: "Đính chính", caption: "Chú thích", memory: "Ký ức", removal: "Yêu cầu gỡ" };
const STATUS: Record<string, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };

export default async function Submissions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status = "pending" } = await searchParams;
  const db = await readDb();
  const list = db.submissions
    .filter((s) => status === "all" || s.status === status)
    .sort((a, b) => (a.type === "removal" ? -1 : 0) - (b.type === "removal" ? -1 : 0) || b.createdAt.localeCompare(a.createdAt));
  return (
    <AdminShell current="submissions" pending={db.submissions.filter((s) => s.status === "pending").length}>
      <header className="admin-head"><h1>Bài gửi</h1></header>
      <nav className="admin-filters">
        {["pending", "approved", "rejected", "all"].map((s) => <Link key={s} href={`/admin/submissions?status=${s}`} className={`admin-btn ${status === s ? "" : "admin-btn--ghost"}`}>{STATUS[s] ?? "Tất cả"}</Link>)}
      </nav>
      {list.length ? (
        <table className="admin-table">
          <thead><tr><th>Tiêu đề</th><th>Loại</th><th>Người gửi</th><th>File</th><th>Đồng ý</th><th>Ngày</th></tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className={s.type === "removal" ? "is-urgent" : ""}>
                <td><Link href={`/admin/submissions/${s.id}`}>{s.title}</Link></td>
                <td>{TYPE_LABELS[s.type]}</td>
                <td>{s.name}</td>
                <td>{s.files.length}</td>
                <td>{s.consent.peopleAgreed && s.consent.allowPublication ? "Đủ" : "Thiếu"}</td>
                <td className="admin-muted">{s.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="admin-muted">Không có bài gửi nào ở trạng thái này.</p>}
    </AdminShell>
  );
}
