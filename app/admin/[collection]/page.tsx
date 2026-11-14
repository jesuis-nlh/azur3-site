import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import GovBadges from "@/components/admin/GovBadges";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { SCHEMAS, isCollection } from "@/lib/admin-schema";
import { formatFuzzy } from "@/lib/dates";
import { foldVietnamese } from "@/lib/text";
import type { BaseRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CollectionList({ params, searchParams }: { params: Promise<{ collection: string }>; searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const { collection } = await params;
  if (!isCollection(collection)) notFound();
  const { q = "", status = "" } = await searchParams;
  const db = await readDb();
  const schema = SCHEMAS[collection];
  const all = db[collection] as unknown as BaseRecord[];
  const list = all.filter((r) => (!status || r.status === status || (status === "demo" && r.demo)) && (!q || foldVietnamese(r.title).includes(foldVietnamese(q))));
  return (
    <AdminShell current={collection} pending={db.submissions.filter((s) => s.status === "pending").length}>
      <header className="admin-head">
        <h1>{schema.label} <span className="admin-muted">({all.length})</span></h1>
        <Link href={`/admin/${collection}/new`} className="admin-btn">+ Thêm {schema.singular}</Link>
      </header>
      <form className="admin-filters" method="get">
        <input name="q" defaultValue={q} placeholder="Tìm theo tiêu đề" className="admin-input" aria-label="Tìm theo tiêu đề" />
        <select name="status" defaultValue={status} className="admin-input" aria-label="Lọc trạng thái">
          <option value="">Mọi trạng thái</option><option value="published">Đã xuất bản</option><option value="draft">Bản nháp</option><option value="archived">Lưu trữ</option><option value="demo">Nội dung mẫu</option>
        </select>
        <button className="admin-btn admin-btn--ghost">Lọc</button>
      </form>
      <table className="admin-table">
        <thead><tr><th>Tiêu đề</th><th>Thời điểm</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id}>
              <td><Link href={`/admin/${collection}/${r.id}`}>{r.title}</Link></td>
              <td>{formatFuzzy(r.eventDate)}</td>
              <td><GovBadges r={r} /></td>
              <td className="admin-muted">{r.updatedAt?.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!list.length ? <p className="admin-muted">Không có bản ghi nào khớp.</p> : null}
    </AdminShell>
  );
}
