import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Plate from "@/components/content/Plate";
import Prose, { tableOfContents } from "@/components/content/Prose";
import ReadingProgress from "@/components/content/ReadingProgress";
import { ArticleCard } from "@/components/content/ArticleList";
import DemoBadge from "@/components/ui/DemoBadge";
import { articleBySlug, eventsForArticle, relatedArticles } from "@/lib/queries";
import { formatIso } from "@/lib/dates";
import { readingMinutes } from "@/lib/text";
import { ARTICLE_CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await articleBySlug((await params).slug);
  return a ? { title: a.title, description: a.subtitle, openGraph: { type: "article", title: a.title, description: a.subtitle } } : { title: "Không tìm thấy" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await articleBySlug((await params).slug);
  if (!a) notFound();
  const [related, events] = await Promise.all([relatedArticles(a), eventsForArticle(a)]);
  const toc = tableOfContents(a.body);

  return (
    <>
      <ReadingProgress target="#article-body" />
      <article className="article">
        <header className="article__head shell">
          <ol className="crumbs"><li><Link href="/nhat-ky">Nhật ký lớp</Link></li><li><Link href={`/nhat-ky/chuyen-muc/${a.category}`}>{ARTICLE_CATEGORIES[a.category]}</Link></li></ol>
          <h1 className="display display-l article__title"><span className="rise"><span>{a.title}</span></span></h1>
          {a.subtitle ? <p className="lede article__sub fade-in" style={{ "--delay": "250ms" } as React.CSSProperties}>{a.subtitle}</p> : null}
          <div className="article__byline fade-in" style={{ "--delay": "400ms" } as React.CSSProperties}>
            <span>{a.author}</span><span className="dot" /><time dateTime={a.publishedAt}>{formatIso(a.publishedAt)}</time><span className="dot" /><span>{readingMinutes(a.body)} phút đọc</span><DemoBadge item={a} />
          </div>
        </header>
        {a.cover ? <div className="shell article__cover" data-reveal="mask"><Plate asset={a.cover} ratio="21 / 9" sizes="100vw" priority /></div> : null}
        <div className="shell article__layout">
          {toc.length > 1 ? (
            <nav className="article__toc" aria-label="Mục lục bài viết">
              <p className="eyebrow">Mục lục</p>
              <ol>{toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}</ol>
            </nav>
          ) : <span />}
          <div id="article-body"><Prose body={a.body} />
            {a.tags.length ? <p className="article__tags">{a.tags.map((t) => <span key={t} className="badge">#{t}</span>)}</p> : null}
            {events.length ? <p className="small muted">Liên quan đến sự kiện: {events.map((e, i) => <span key={e.id}>{i ? ", " : ""}<Link href={`/dong-thoi-gian/${e.slug}`}>{e.title}</Link></span>)}</p> : null}
          </div>
        </div>
      </article>
      {related.length ? (
        <section className="section shell" aria-labelledby="related-h">
          <h2 id="related-h" className="h2" style={{ marginBottom: "var(--s-6)" }}>Đọc tiếp</h2>
          <div className="article-grid">{related.map((r, i) => <ArticleCard key={r.id} a={r} i={i} />)}</div>
        </section>
      ) : null}
    </>
  );
}
