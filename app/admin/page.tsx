import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { readDb, DATA_DIR, storeWritable } from "@/lib/store";
import { isPublic } from "@/lib/governance";
import { SCHEMAS, COLLECTIONS } from "@/lib/admin-schema";
import type { BaseRecord } from "@/lib/types";
import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireAdmin();
  const db = await readDb();
  const pending = db.submissions.filter((s) => s.status === "pending");
  const removals = pending.filter((s) => s.type === "removal");
  const inbox = await fs.readdir(path.join(DATA_DIR, "inbox")).then((f) => f.filter((x) => x.endsWith(".json"))).catch(() => [] as string[]);
  const reviewQueue = COLLECTIONS.flatMap((c) => (db[c] as unknown as BaseRecord[]).filter((r) => r.review !== "verified" && r.status !== "archived" && !r.demo).map((r) => ({ c, r })));
  const demoCount = COLLECTIONS.reduce((n, c) => n + (db[c] as unknown as BaseRecord[]).filter((r) => r.demo).length, 0);
  const writable = await storeWritable();

  return (
    <AdminShell pending={pending.length}>
      <header className="admin-head"><h1>Tổng quan</h1></header>
      {!writable ? <p className="admin-alert">Kho dữ liệu đang ở chế độ chỉ đọc ({DATA_DIR}). Thay đổi sẽ không được lưu.</p> : null}
      {removals.length ? <p className="admin-alert">{removals.length} yêu cầu gỡ đang chờ — ưu tiên xử lý. <Link href="/admin/submissions">Xem</Link></p> : null}
      <div className="admin-cards">
        <Link href="/admin/submissions" className="admin-card"><span className="admin-card__n">{pending.length}</span><span>Bài gửi chờ duyệt</span></Link>
        <Link href="/admin/imports" className="admin-card"><span className="admin-card__n">{db.imports.filter((i) => i.state === "needs_review").length + inbox.length}</span><span>Mục nhập chờ xử lý</span></Link>
        <div className="admin-card"><span className="admin-card__n">{reviewQueue.length}</span><span>Bản ghi thật cần xác minh</span></div>
        <div className="admin-card"><span className="admin-card__n">{demoCount}</span><span>Bản ghi mẫu cần thay</span></div>
      </div>
      <section className="admin-section">
        <h2>Nội dung</h2>
        <table className="admin-table">
          <thead><tr><th>Bộ sưu tập</th><th>Tổng</th><th>Công khai</th><th>Nháp</th><th>Mẫu</th></tr></thead>
          <tbody>
            {COLLECTIONS.map((c) => {
              const list = db[c] as unknown as BaseRecord[];
              return (
                <tr key={c}>
                  <td><Link href={`/admin/${c}`}>{SCHEMAS[c].label}</Link></td>
                  <td>{list.length}</td><td>{list.filter(isPublic).length}</td><td>{list.filter((r) => r.status === "draft").length}</td><td>{list.filter((r) => r.demo).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="admin-section">
        <h2>Nhật ký thao tác</h2>
        {db.audit.length ? (
          <ol className="admin-audit">{db.audit.slice(0, 15).map((a, i) => <li key={i}><time>{a.at.replace("T", " ").slice(0, 16)}</time> <code>{a.action}</code> {a.target}</li>)}</ol>
        ) : <p className="admin-muted">Chưa có thao tác nào.</p>}
      </section>
    </AdminShell>
  );
}
