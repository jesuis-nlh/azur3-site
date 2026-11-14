import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VideoPlayer from "@/components/content/VideoPlayer";
import Provenance from "@/components/content/Provenance";
import DemoBadge from "@/components/ui/DemoBadge";
import Glyph from "@/components/ui/Glyph";
import { publicAlbums, publicArticles, publicEvents, publicVideos, videoBySlug } from "@/lib/queries";
import { formatFuzzy } from "@/lib/dates";
import { VIDEO_CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await videoBySlug((await params).slug);
  return v ? { title: v.title, description: v.description } : { title: "Không tìm thấy" };
}

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const v = await videoBySlug((await params).slug);
  if (!v) notFound();
  const [events, albums, articles, videos] = await Promise.all([publicEvents(), publicAlbums(), publicArticles(), publicVideos()]);
  const event = events.find((e) => e.id === v.eventId);
  const relAlbums = albums.filter((a) => v.albumIds.includes(a.id));
  const relArticles = articles.filter((a) => v.articleIds.includes(a.id));
  const others = videos.filter((x) => x.id !== v.id).slice(0, 3);

  return (
    <article className="video-page">
      <header className="page-hero" style={{ paddingBottom: "var(--s-6)" }}>
        <div className="shell">
          <ol className="crumbs"><li><Link href="/thuoc-phim">Thước phim</Link></li><li>{VIDEO_CATEGORIES[v.category]}</li></ol>
          <h1 className="display display-l" style={{ marginTop: "var(--s-5)" }}><span className="rise"><span>{v.title}</span></span></h1>
          <div className="page-hero__meta"><p className="coord">{formatFuzzy(v.eventDate)}</p><DemoBadge item={v} /></div>
        </div>
      </header>
      <div className="shell">
        <div className="video-page__stage"><VideoPlayer url={v.url} title={v.title} poster={v.poster} captionsUrl={v.captionsUrl} /></div>
        <div className="event-page__grid">
          <div>
            {v.description ? <p className="lede">{v.description}</p> : null}
            <ul className="link-list">
              {event ? <li><Link href={`/dong-thoi-gian/${event.slug}`}><Glyph name="star" size={14} /> Sự kiện: {event.title}</Link></li> : null}
              {relAlbums.map((a) => <li key={a.id}><Link href={`/ky-uc/${a.slug}`}><Glyph name="photo" size={16} /> Album: {a.title}</Link></li>)}
              {relArticles.map((a) => <li key={a.id}><Link href={`/nhat-ky/${a.slug}`}><Glyph name="article" size={16} /> {a.title}</Link></li>)}
            </ul>
          </div>
          <Provenance item={v} />
        </div>
        {others.length ? (
          <section className="section section--tight">
            <h2 className="h3" style={{ marginBottom: "var(--s-5)" }}>Thước phim khác</h2>
            <ul className="video-grid">
              {others.map((o) => (
                <li key={o.id}><Link href={`/thuoc-phim/${o.slug}`} className="video-card card-link"><span className="h3 card-title">{o.title}</span><span className="card-meta"><span className="coord">{formatFuzzy(o.eventDate)}</span></span></Link></li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
