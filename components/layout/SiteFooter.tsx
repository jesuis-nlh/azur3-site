import Link from "next/link";
import { nav, site } from "@/lib/site";
import StarMark from "@/components/ui/StarMark";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <StarMark size={44} />
            <p className="h3">
              Một kho lưu trữ <em>được giữ gìn</em> bởi chính những người đã ở đó.
            </p>
          </div>
          <nav aria-label="Liên kết chân trang" className="site-footer__nav">
            <div>
              <p className="eyebrow">Khám phá</p>
              <ul>
                {nav.map((n) => (
                  <li key={n.href}><Link href={n.href}>{n.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">Tham gia</p>
              <ul>
                <li><Link href="/dong-gop">Gửi ký ức</Link></li>
                <li><Link href="/dong-gop?loai=removal">Yêu cầu gỡ / chỉnh sửa</Link></li>
                <li><Link href="/tim-kiem">Tìm kiếm</Link></li>
                <li><Link href="/quyen-rieng-tu">Quyền riêng tư</Link></li>
              </ul>
            </div>
          </nav>
        </div>
        <hr className="rule" />
        <div className="site-footer__bottom">
          <p className="small faint">
            {site.className} · {site.school} · {site.city} · {site.cohort.start}–{site.cohort.end}
          </p>
          <p className="coord">16°03′N 108°12′E — {site.city.toUpperCase()}</p>
        </div>
      </div>
    </footer>
  );
}
