"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Glyph from "@/components/ui/Glyph";
import { foldVietnamese } from "@/lib/text";

export interface TimelineEntry {
  id: string;
  slug: string;
  title: string;
  description: string;
  schoolYear: string;
  category: string;
  categoryLabel: string;
  dateLabel: string;
  day: string;
  month: string;
  year: string;
  milestone: boolean;
  demo: boolean;
  counts: { photos: number; videos: number; articles: number };
  tags: string[];
}

export default function TimelineView({
  entries, years, categories,
}: {
  entries: TimelineEntry[];
  years: { id: string; label: string; grade: string }[];
  categories: { id: string; label: string; count: number }[];
}) {
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const terms = foldVietnamese(q).split(/\s+/).filter(Boolean);
    return entries.filter((e) => {
      if (cat && e.category !== cat) return false;
      if (!terms.length) return true;
      const hay = foldVietnamese(`${e.title} ${e.description} ${e.categoryLabel} ${e.tags.join(" ")} ${e.dateLabel}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [entries, cat, q]);

  return (
    <div className="timeline">
      <div className="timeline__controls" role="search">
        <nav className="timeline__years" aria-label="Chuyển đến năm học">
          {years.map((y) => (
            <a key={y.id} href={`#nam-${y.id}`} className="chip"><span className="count">{y.grade}</span>{y.label}</a>
          ))}
        </nav>
        <div className="timeline__filters">
          <label className="timeline__search">
            <Glyph name="search" size={16} />
            <span className="sr-only">Tìm trong dòng thời gian</span>
            <input className="input" type="search" placeholder="Tìm sự kiện, ví dụ: văn nghệ" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="chips" role="group" aria-label="Lọc theo loại sự kiện">
            <button type="button" className="chip" aria-pressed={cat === null} onClick={() => setCat(null)}>Tất cả</button>
            {categories.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>
                {c.label} <span className="count">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="small faint timeline__count" aria-live="polite">
          {filtered.length === entries.length ? `${entries.length} sự kiện` : `${filtered.length} / ${entries.length} sự kiện phù hợp`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p className="h3">Không có sự kiện nào khớp</p>
          <p>Thử bỏ bộ lọc hoặc dùng từ khoá khác.</p>
          <button type="button" className="btn btn--sm" onClick={() => { setCat(null); setQ(""); }}>Xoá bộ lọc</button>
        </div>
      ) : (
        <div className="timeline__track">
          <div className="timeline__axis" aria-hidden="true" />
          {years.map((y) => {
            const list = filtered.filter((e) => e.schoolYear === y.id);
            if (!list.length) return null;
            return (
              <section key={y.id} id={`nam-${y.id}`} className="timeline__year" aria-labelledby={`yh-${y.id}`}>
                <header className="timeline__planet" data-reveal>
                  <span className="timeline__planet-body" aria-hidden="true"><span /></span>
                  <span className="coord">{y.grade}</span>
                  <h2 id={`yh-${y.id}`} className="display">{y.label}</h2>
                </header>
                <ol className="timeline__events">
                  {list.map((e, i) => (
                    <li key={e.id} className={`tl-event${e.milestone ? " tl-event--milestone" : ""}${i % 2 ? " tl-event--right" : ""}`} data-reveal>
                      <span className="tl-event__star" aria-hidden="true" />
                      <Link href={`/dong-thoi-gian/${e.slug}`} className="tl-event__card card-link">
                        <span className="tl-event__date">
                          <span className="num tl-event__month">{e.month}</span>
                          <span className="coord">{e.year}</span>
                        </span>
                        <span className="tl-event__main">
                          <span className="card-meta">
                            <span>{e.categoryLabel}</span>
                            {e.milestone ? <><span className="dot" /><span className="tl-event__flag">Cột mốc</span></> : null}
                            {e.demo ? <span className="badge badge--demo">Mẫu</span> : null}
                          </span>
                          <span className="h3 card-title">{e.title}</span>
                          <span className="tl-event__desc">{e.description}</span>
                          <span className="tl-event__counts">
                            {e.counts.photos ? <span><Glyph name="photo" size={14} /> {e.counts.photos} ảnh</span> : null}
                            {e.counts.videos ? <span><Glyph name="video" size={14} /> {e.counts.videos} video</span> : null}
                            {e.counts.articles ? <span><Glyph name="article" size={14} /> {e.counts.articles} bài</span> : null}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
