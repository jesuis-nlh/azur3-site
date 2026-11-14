import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Plate from "@/components/content/Plate";
import DemoBadge from "@/components/ui/DemoBadge";
import { personBySlug, publicAlbums, publicEvents } from "@/lib/queries";
import { formatFuzzy } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await personBySlug((await params).slug);
  return p ? { title: p.title, robots: { index: false } } : { title: "Không tìm thấy" };
}

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await personBySlug((await params).slug);
  if (!p) notFound();
  const [events, albums] = await Promise.all([publicEvents(), publicAlbums()]);
  // Only records where this person explicitly agreed to be tagged
  const myEvents = events.filter((e) => e.people.includes(p.id));
  const myAlbums = albums.filter((a) => a.people.includes(p.id));

  return (
    <article className="person-page">
      <header className="page-hero">
        <div className="shell">
          <ol className="crumbs"><li><Link href="/chung-ta">Chúng ta</Link></li><li>{p.role === "teacher" ? "Thầy cô" : p.group}</li></ol>
          <div className="person-page__head">
            <div className="person-page__portrait">
              {p.portrait ? <Plate asset={p.portrait} caption={false} ratio="4 / 5" /> : <span className="person-page__star" aria-hidden="true" />}
            </div>
            <div>
              <p className="eyebrow">{p.role === "teacher" ? p.subject ?? "Thầy cô" : p.group}</p>
              <h1 className="display display-l"><span className="rise"><span>{p.title}</span></span></h1>
              <div className="page-hero__meta"><DemoBadge item={p} /></div>
            </div>
          </div>
        </div>
      </header>
      <div className="shell person-page__body">
        {p.bio ? <p className="lede">{p.bio}</p> : <p className="muted">Người này chưa viết lời giới thiệu.</p>}
        {p.memory ? (<blockquote className="pull-quote"><p>{p.memory}</p><footer className="small faint">— Ký ức do chính {p.title} viết</footer></blockquote>) : null}
        {myEvents.length || myAlbums.length ? (
          <section>
            <h2 className="h3">Xuất hiện trong</h2>
            <ul className="link-list">
              {myEvents.map((e) => <li key={e.id}><Link href={`/dong-thoi-gian/${e.slug}`}>{e.title} <span className="faint small">· {formatFuzzy(e.eventDate)}</span></Link></li>)}
              {myAlbums.map((a) => <li key={a.id}><Link href={`/ky-uc/${a.slug}`}>Album: {a.title}</Link></li>)}
            </ul>
          </section>
        ) : null}
        <p className="notice">Đây là hồ sơ của bạn? Bạn có thể yêu cầu sửa, thu gọn hoặc ẩn hồ sơ bất kỳ lúc nào qua <Link href={`/dong-gop?loai=removal&ref=${p.slug}`}>mục Đóng góp</Link>.</p>
      </div>
    </article>
  );
}
