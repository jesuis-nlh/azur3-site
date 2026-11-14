import Link from "next/link";
import Glyph from "@/components/ui/Glyph";

export default function NotFound() {
  return (
    <section className="page-hero not-found">
      <div className="shell">
        <p className="eyebrow">404 · Vùng trời trống</p>
        <h1 className="display display-l">Vì sao này <em>chưa có ở đây.</em></h1>
        <p className="lede">Trang có thể đã bị gỡ theo yêu cầu, chưa được xuất bản, hoặc đường dẫn bị gõ sai.</p>
        <div className="home-hero__ctas">
          <Link href="/" className="btn btn--primary">Về trang chủ <Glyph name="arrow" className="arrow" /></Link>
          <Link href="/tim-kiem" className="btn">Tìm kiếm</Link>
        </div>
      </div>
    </section>
  );
}
