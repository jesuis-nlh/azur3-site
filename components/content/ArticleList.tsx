import Link from "next/link";
import Plate from "./Plate";
import DemoBadge from "@/components/ui/DemoBadge";
import { ARTICLE_CATEGORIES, type Article } from "@/lib/types";
import { formatIso } from "@/lib/dates";
import { readingMinutes } from "@/lib/text";

export function ArticleCard({ a, i = 0, large = false, level = 2 }: { a: Article; i?: number; large?: boolean; level?: 2 | 3 }) {
  const H = `h${level}` as "h2" | "h3";
  return (
    <Link href={`/nhat-ky/${a.slug}`} className={`article-card card-link${large ? " article-card--large" : ""}`} data-reveal style={{ "--delay": `${(i % 3) * 80}ms` } as React.CSSProperties}>
      {a.cover ? <Plate asset={a.cover} caption={false} ratio={large ? "16 / 9" : "3 / 2"} sizes={large ? "(min-width: 900px) 66vw, 100vw" : "(min-width: 900px) 33vw, 100vw"} /> : null}
      <span className="card-meta">
        <span>{ARTICLE_CATEGORIES[a.category]}</span><span className="dot" /><span>{formatIso(a.publishedAt)}</span><span className="dot" /><span>{readingMinutes(a.body)} phút đọc</span><DemoBadge item={a} />
      </span>
      <H className={`${large ? "h1" : "h3"} card-title`}>{a.title}</H>
      {a.subtitle ? <span className="muted article-card__sub">{a.subtitle}</span> : null}
      <span className="small faint">{a.author}</span>
    </Link>
  );
}

export function CategoryChips({ current, counts }: { current?: string; counts: Record<string, number> }) {
  return (
    <nav className="chips" aria-label="Chuyên mục">
      <Link href="/nhat-ky" className="chip" aria-current={!current ? "page" : undefined}>Tất cả</Link>
      {Object.entries(ARTICLE_CATEGORIES).filter(([k]) => counts[k]).map(([k, label]) => (
        <Link key={k} href={`/nhat-ky/chuyen-muc/${k}`} className="chip" aria-current={current === k ? "page" : undefined}>{label} <span className="count">{counts[k]}</span></Link>
      ))}
    </nav>
  );
}
