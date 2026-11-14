import Link from "next/link";
import StarMark from "@/components/ui/StarMark";
import { logout } from "@/app/admin/actions";
import { SCHEMAS, COLLECTIONS } from "@/lib/admin-schema";

export default function AdminShell({ children, current, pending = 0 }: { children: React.ReactNode; current?: string; pending?: number }) {
  return (
    <div className="admin">
      <aside className="admin__side">
        <Link href="/admin" className="admin__brand"><StarMark size={26} /> <span>Quản trị 12A3</span></Link>
        <nav aria-label="Quản trị">
          <p className="admin__navlabel">Kiểm duyệt</p>
          <Link href="/admin/submissions" aria-current={current === "submissions" ? "page" : undefined}>Bài gửi {pending ? <span className="admin__pill">{pending}</span> : null}</Link>
          <Link href="/admin/imports" aria-current={current === "imports" ? "page" : undefined}>Nhập dữ liệu</Link>
          <p className="admin__navlabel">Nội dung</p>
          {COLLECTIONS.map((c) => <Link key={c} href={`/admin/${c}`} aria-current={current === c ? "page" : undefined}>{SCHEMAS[c].label}</Link>)}
        </nav>
        <div className="admin__sidefoot">
          <Link href="/" target="_blank">Xem trang công khai ↗</Link>
          <form action={logout}><button type="submit" className="admin-btn admin-btn--ghost">Đăng xuất</button></form>
        </div>
      </aside>
      <main id="noi-dung" className="admin__main">{children}</main>
    </div>
  );
}
