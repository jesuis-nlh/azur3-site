import { promises as fs } from "node:fs";
import path from "node:path";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { readDb, DATA_DIR } from "@/lib/store";
import { decideImports, loadInboxBatch } from "@/app/admin/actions";
import { formatFuzzy, formatIso } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Imports() {
  await requireAdmin();
  const db = await readDb();
  const inbox = await fs.readdir(path.join(DATA_DIR, "inbox")).then((f) => f.filter((x) => x.endsWith(".json"))).catch(() => [] as string[]);
  const queue = db.imports.filter((i) => i.state === "needs_review");
  return (
    <AdminShell current="imports" pending={db.submissions.filter((s) => s.status === "pending").length}>
      <header className="admin-head"><h1>Nhập dữ liệu</h1></header>
      <section className="admin-section">
        <h2>Lô chờ nạp</h2>
        <p className="admin-hint">Tạo lô bằng <code>npm run ingest -- --source &lt;thư mục&gt; --kind folder|facebook --label "…"</code>. Xem docs/INGESTION.md.</p>
        {inbox.length ? (
          <ul className="admin-list">
            {inbox.map((f) => <li key={f}><code>{f}</code><form action={loadInboxBatch.bind(null, f)}><button className="admin-btn">Nạp vào hàng duyệt</button></form></li>)}
          </ul>
        ) : <p className="admin-muted">Không có lô mới.</p>}
      </section>
      <section className="admin-section">
        <h2>Lô đã nạp</h2>
        {db.batches.length ? (
          <table className="admin-table">
            <thead><tr><th>Lô</th><th>Nguồn</th><th>Tổng</th><th>Nhập</th><th>Trùng</th><th>Lỗi</th></tr></thead>
            <tbody>{db.batches.map((b) => (
              <tr key={b.id}><td>{b.label}<br /><span className="admin-muted">{formatIso(b.createdAt)}</span></td><td>{b.sourceKind}</td><td>{b.stats.total}</td><td>{b.stats.imported}</td><td>{b.stats.duplicates}</td><td title={b.errors.map((e) => `${e.file}: ${e.reason}`).join("\n")}>{b.stats.errors}</td></tr>
            ))}</tbody>
          </table>
        ) : <p className="admin-muted">Chưa có lô nào.</p>}
      </section>
      <section className="admin-section">
        <h2>Hàng duyệt ({queue.length})</h2>
        {queue.length ? (
          <form action={decideImports}>
            <div className="admin-filters">
              <input name="albumTitle" placeholder="Tên album nháp sẽ tạo" className="admin-input" aria-label="Tên album" />
              <button name="decision" value="accept" className="admin-btn">Chấp nhận mục đã chọn → album nháp</button>
              <button name="decision" value="reject" className="admin-btn admin-btn--ghost">Bỏ mục đã chọn</button>
            </div>
            <ul className="admin-imports">
              {queue.map((i) => (
                <li key={i.id} className={i.duplicateOf ? "is-dup" : ""}>
                  <label>
                    <input type="checkbox" name="item" value={i.id} defaultChecked={!i.duplicateOf} />
                    {i.asset ? <img src={i.asset.thumb ?? i.asset.src} alt="" /> : <span className="admin-file-ph">{i.kind}</span>}
                    <span>
                      <b>{i.title}</b>
                      <span className="admin-muted">{formatFuzzy(i.eventDate)} · {i.source.ref ?? i.source.kind}</span>
                      {i.issues.map((x, n) => <span key={n} className="admin-error">{x}</span>)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </form>
        ) : <p className="admin-muted">Hàng duyệt trống.</p>}
      </section>
    </AdminShell>
  );
}
