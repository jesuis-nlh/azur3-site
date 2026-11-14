import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Plate from "@/components/content/Plate";
import Provenance from "@/components/content/Provenance";
import Prose from "@/components/content/Prose";
import DemoBadge from "@/components/ui/DemoBadge";
import Glyph from "@/components/ui/Glyph";
import { albumCover, eventBySlug, eventRelations, publicEvents } from "@/lib/queries";
import { formatFuzzy } from "@/lib/dates";
import { schoolYearLabel } from "@/lib/site";
import { EVENT_CATEGORIES, VIDEO_CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await eventBySlug((await params).slug);
  return e ? { title: e.title, description: e.description } : { title: "Không tìm thấy" };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await eventBySlug(slug);
  if (!e) notFound();
  const [rel, all] = await Promise.all([eventRelations(e), publicEvents()]);
  const idx = all.findIndex((x) => x.id === e.id);
  const prev = all[idx - 1], next = all[idx + 1];

  return (
    <article className="event-page">
      <header className="page-hero">
        <div className="shell">
          <ol className="crumbs fade-in">
            <li><Link href="/dong-thoi-gian">Dòng thời gian</Link></li>
            <li><Link href={`/dong-thoi-gian#nam-${e.schoolYear}`}>{schoolYearLabel(e.schoolYear)}</Link></li>
          </ol>
          <div className="event-page__head">
            <p className="eyebrow fade-in" style={{ marginTop: "var(--s-6)" }}>{EVENT_CATEGORIES[e.category]}{e.milestone ? " · Cột mốc" : ""}</p>
            <h1 className="display display-l"><span className="rise"><span>{e.title}</span></span></h1>
            <div className="page-hero__meta fade-in" style={{ "--delay": "300ms" } as React.CSSProperties}>
              <p className="coord">{formatFuzzy(e.eventDate)}</p>
              {e.location ? <p className="coord">{e.location}</p> : null}
              <DemoBadge item={e} />
            </div>
          </div>
        </div>
      </header>

      <div className="shell event-page__grid">
        <div className="event-page__body">
          {e.description ? <p className="lede event-page__lede">{e.description}</p> : null}
          {e.body ? <Prose body={e.body} /> : null}
        </div>
        <Provenance item={e} />
      </div>

      {rel.albums.length ? (
        <section className="section section--tight shell" aria-labelledby="ev-albums">
          <h2 id="ev-albums" className="h2" style={{ marginBottom: "var(--s-6)" }}>Album liên quan</h2>
          <div className="album-grid">
            {rel.albums.map((a) => {
              const cover = albumCover(a);
              return (
                <Link key={a.id} href={`/ky-uc/${a.slug}`} className="album-card card-link" data-reveal data-cursor="view">
                  {cover ? <Plate asset={cover} caption={false} ratio="4 / 3" sizes="(min-width: 900px) 33vw, 100vw" /> : null}
                  <span className="card-meta"><span>{a.assets.length} ảnh</span><DemoBadge item={a} /></span>
                  <span className="h3 card-title">{a.title}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {rel.videos.length || rel.articles.length ? (
        <section className="section section--tight shell event-page__more">
          {rel.videos.length ? (
            <div>
              <h2 className="h3">Thước phim</h2>
              <ul className="link-list">
                {rel.videos.map((v) => <li key={v.id}><Link href={`/thuoc-phim/${v.slug}`}><Glyph name="video" size={16} /> {v.title} <span className="faint small">· {VIDEO_CATEGORIES[v.category]}</span></Link></li>)}
              </ul>
            </div>
          ) : null}
          {rel.articles.length ? (
            <div>
              <h2 className="h3">Bài viết</h2>
              <ul className="link-list">
                {rel.articles.map((a) => <li key={a.id}><Link href={`/nhat-ky/${a.slug}`}><Glyph name="article" size={16} /> {a.title}</Link></li>)}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <nav className="shell pager" aria-label="Sự kiện trước và sau">
        {prev ? <Link href={`/dong-thoi-gian/${prev.slug}`} className="pager__link"><span className="coord"><Glyph name="arrow-left" size={14} /> Trước · {formatFuzzy(prev.eventDate)}</span><span className="h3">{prev.title}</span></Link> : <span />}
        {next ? <Link href={`/dong-thoi-gian/${next.slug}`} className="pager__link pager__link--next"><span className="coord">Sau · {formatFuzzy(next.eventDate)} <Glyph name="arrow" size={14} /></span><span className="h3">{next.title}</span></Link> : <span />}
      </nav>
    </article>
  );
}
