import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import RecordEditor from "@/components/admin/RecordEditor";
import GovBadges from "@/components/admin/GovBadges";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { SCHEMAS, isCollection } from "@/lib/admin-schema";
import { archiveRecord, deleteRecord, saveRecord } from "@/app/admin/actions";
import { isPublic } from "@/lib/governance";
import type { BaseRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditPage({ params, searchParams }: { params: Promise<{ collection: string; id: string }>; searchParams: Promise<{ saved?: string; delete?: string }> }) {
  await requireAdmin();
  const { collection, id } = await params;
  if (!isCollection(collection)) notFound();
  const sp = await searchParams;
  const db = await readDb();
  const schema = SCHEMAS[collection];
  const existing = (db[collection] as unknown as BaseRecord[]).find((r) => r.id === id);
  if (!existing && id !== "new") notFound();
  const record = (existing ?? { status: "draft", visibility: "public", consent: "pending", review: "needs_review" }) as unknown as Record<string, unknown>;
  const opt = (c: "events" | "albums" | "videos" | "articles" | "profiles" | "legacy") => (db[c] as unknown as BaseRecord[]).filter((r) => r.id !== id).map((r) => ({ id: r.id, title: r.title }));
  const options = { events: opt("events"), albums: opt("albums"), videos: opt("videos"), articles: opt("articles"), profiles: opt("profiles"), legacy: opt("legacy") };

  return (
    <AdminShell current={collection} pending={db.submissions.filter((s) => s.status === "pending").length}>
      <header className="admin-head">
        <div>
          <p className="admin-crumb"><Link href={`/admin/${collection}`}>{schema.label}</Link></p>
          <h1>{existing ? existing.title : `Thêm ${schema.singular}`}</h1>
          {existing ? <GovBadges r={existing} /> : null}
        </div>
        {existing && isPublic(existing) ? <Link className="admin-btn admin-btn--ghost" href={`${schema.publicPath}${existing.slug}`} target="_blank">Xem công khai ↗</Link> : null}
      </header>
      {sp.saved ? <p className="admin-ok" role="status">Đã tạo.</p> : null}
      <RecordEditor action={saveRecord.bind(null, collection, id)} record={record} fields={schema.fields} options={options} isAlbum={collection === "albums"} />
      {existing ? (
        <section className="admin-danger">
          <h2>Gỡ khỏi trang</h2>
          <p className="admin-hint">Lưu trữ sẽ ẩn bản ghi ngay lập tức nhưng vẫn giữ dữ liệu. Dùng khi có yêu cầu gỡ.</p>
          <form action={archiveRecord.bind(null, collection, id)}><button className="admin-btn admin-btn--ghost">Lưu trữ & ẩn</button></form>
          <form action={deleteRecord.bind(null, collection, id)} className="admin-filters">
            <label htmlFor="confirm" className="admin-hint">Xoá vĩnh viễn — gõ <code>XOA</code> để xác nhận:</label>
            <input id="confirm" name="confirm" className="admin-input" autoComplete="off" />
            <button className="admin-btn admin-btn--danger">Xoá vĩnh viễn</button>
          </form>
          {sp.delete ? <p className="admin-error">Chưa xoá: cần gõ đúng XOA.</p> : null}
        </section>
      ) : null}
    </AdminShell>
  );
}
