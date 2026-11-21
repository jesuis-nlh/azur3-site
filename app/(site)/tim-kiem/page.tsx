import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/content/PageHero";
import Glyph from "@/components/ui/Glyph";
import { search } from "@/lib/queries";

export const metadata: Metadata = { title: "Tìm kiếm", robots: { index: false } };
export const dynamic = "force-dynamic";

const TYPES = [
  ["", "Tất cả"], ["event", "Sự kiện"], ["album", "Album"], ["video", "Video"], ["article", "Bài viết"], ["person", "Thành viên"], ["legacy", "Di sản"],
] as const;

/** Server-rendered search: works without JavaScript, results are shareable URLs. Diacritics optional. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; loai?: string }> }) {
  const { q = "", loai = "" } = await searchParams;
  const query = q.slice(0, 120);
  const hits = query.trim() ? await search(query, loai || undefined) : [];
  return (
    <>
      <PageHero eyebrow="Tìm trong kho lưu trữ" title={<>Tìm <em>kiếm</em></>} lede="Gõ có dấu hay không dấu đều được: “van nghe” sẽ tìm thấy “văn nghệ”." />
      <div className="shell search-page">
        <form action="/tim-kiem" method="get" role="search" className="search-form">
          <label htmlFor="q" className="sr-only">Từ khoá</label>
          <Glyph name="search" size={22} />
          <input id="q" name="q" type="search" className="search-form__input" defaultValue={query} placeholder="Sự kiện, album, bài viết, tên…" autoFocus={!query} />
          {loai ? <input type="hidden" name="loai" value={loai} /> : null}
          <button type="submit" className="btn btn--primary">Tìm</button>
        </form>
        {query ? (
          <>
            <nav className="chips search-page__types" aria-label="Lọc kết quả">
              {TYPES.map(([id, label]) => (
                <Link key={id} className="chip" href={`/tim-kiem?q=${encodeURIComponent(query)}${id ? `&loai=${id}` : ""}`} aria-current={loai === id ? "page" : undefined}>{label}</Link>
              ))}
            </nav>
            <p className="small faint" aria-live="polite">{hits.length} kết quả cho “{query}”</p>
            {hits.length ? (
              <ol className="search-results">
                {hits.map((h) => (
                  <li key={h.href}>
                    <Link href={h.href} className="search-hit card-link">
                      {h.thumb ? <img src={h.thumb} alt="" loading="lazy" className="search-hit__thumb" /> : <span className="search-hit__thumb search-hit__thumb--star" aria-hidden="true" />}
                      <div className="search-hit__body">
                        <span className="card-meta"><span>{h.typeLabel}</span>{h.meta ? <><span className="dot" /><span>{h.meta}</span></> : null}</span>
                        <h2 className="h3 card-title">{h.title}</h2>
                        {h.snippet ? <span className="small muted search-hit__snippet">{h.snippet}</span> : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty"><p className="h3">Không tìm thấy gì</p><p>Thử từ khoá ngắn hơn, hoặc duyệt theo <Link href="/dong-thoi-gian">dòng thời gian</Link>.</p></div>
            )}
          </>
        ) : (
          <div className="search-page__suggest">
            <p className="eyebrow">Gợi ý</p>
            <div className="chips">
              {["văn nghệ", "kỷ yếu", "thầy cô", "chuyến đi", "tốt nghiệp"].map((s) => <Link key={s} className="chip" href={`/tim-kiem?q=${encodeURIComponent(s)}`}>{s}</Link>)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
