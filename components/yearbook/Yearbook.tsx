"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Glyph from "@/components/ui/Glyph";

export interface Spread {
  id: string;
  chapter: string;
  kicker: string;
  title: string;
  accent?: string;
  text: string[];
  image?: { src: string; thumb?: string; width?: number; alt: string; caption?: string; tone?: string };
  list?: { label: string; href: string; meta?: string }[];
  thumbs?: { src: string; alt: string; href: string }[];
  cta?: { label: string; href: string };
}

/**
 * Digital yearbook: one spread at a time, like turning pages of a printed book.
 * - ← / → keys, buttons, chapter index and swipe all navigate
 * - URL hash (#trang-3) keeps the page shareable and survives reloads
 * - page turn is a short 3D rotation; reduced motion falls back to a fade
 * - every spread is ordinary HTML, so screen readers read it normally
 */
export default function Yearbook({ spreads }: { spreads: Spread[] }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [indexOpen, setIndexOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);

  // Read #trang-N on load and on history navigation. `popstate` is used rather
  // than `hashchange`: it fires before the App Router restores its own URL, so
  // it still sees the hash the visitor navigated to.
  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/trang-(\d+)/);
      if (!m) return;
      const n = Math.min(spreads.length - 1, Math.max(0, Number(m[1]) - 1));
      setI((cur) => { if (n !== cur) setDir(n > cur ? 1 : -1); return n; });
    };
    fromHash();
    window.addEventListener("popstate", fromHash);
    return () => window.removeEventListener("popstate", fromHash);
  }, [spreads.length]);

  // The URL is derived from the page (keeps it shareable). Running as an effect
  // means it lands after any router URL restoration in the same tick.
  useEffect(() => {
    const want = `#trang-${i + 1}`;
    if (window.location.hash !== want) window.history.replaceState(window.history.state, "", want);
  }, [i]);

  const go = useCallback((n: number, focus = false) => {
    const next = Math.min(spreads.length - 1, Math.max(0, n));
    setI((cur) => {
      if (next === cur) return cur;
      setDir(next > cur ? 1 : -1);
      return next;
    });
    setIndexOpen(false);
    if (focus) requestAnimationFrame(() => pageRef.current?.focus());
  }, [spreads.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(i + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(i - 1); }
      if (e.key === "Home") go(0);
      if (e.key === "End") go(spreads.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, spreads.length]);

  const s = spreads[i];

  return (
    <div className="yearbook">
      <div className="yearbook__bar">
        <button type="button" className="btn btn--sm" aria-expanded={indexOpen} aria-controls="yb-index" onClick={() => setIndexOpen((v) => !v)}>
          <Glyph name="menu" size={14} /> Mục lục
        </button>
        <p className="coord" aria-live="polite">Trang {String(i + 1).padStart(2, "0")} / {String(spreads.length).padStart(2, "0")} — {s.chapter}</p>
      </div>

      <nav id="yb-index" className="yearbook__index" hidden={!indexOpen} aria-label="Mục lục kỷ yếu">
        <ol>
          {spreads.map((sp, n) => (
            <li key={sp.id}>
              <button type="button" onClick={() => go(n, true)} aria-current={n === i ? "page" : undefined}>
                <span className="coord">{String(n + 1).padStart(2, "0")}</span> {sp.chapter}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div
        className="yearbook__book"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1));
          touch.current = null;
        }}
      >
        <div key={s.id} ref={pageRef} tabIndex={-1} className={`yearbook__spread turn-${dir > 0 ? "next" : "prev"}`} role="group" aria-roledescription="trang" aria-label={`${s.chapter}: ${s.title}`}>
          <div className="yearbook__page yearbook__page--left">
            {s.image ? (
              <figure className="plate yearbook__figure">
                <div className="plate__frame" style={{ background: s.image.tone }}>
                  <img
                    src={s.image.src}
                    srcSet={s.image.thumb ? `${s.image.thumb} 640w, ${s.image.src} ${s.image.width ?? 1600}w` : undefined}
                    sizes="(min-width: 900px) 40vw, 100vw"
                    alt={s.image.alt}
                    loading="eager" // only the visible spread is rendered, so its image is always needed now
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
                {s.image.caption ? <figcaption>{s.image.caption}</figcaption> : null}
              </figure>
            ) : s.thumbs?.length ? (
              <ul className="yearbook__thumbs">
                {s.thumbs.map((t, n) => <li key={n}><Link href={t.href} className="plate__frame"><img src={t.src} alt={t.alt} loading="lazy" /></Link></li>)}
              </ul>
            ) : (
              <div className="yearbook__emblem" aria-hidden="true"><span>{s.chapter.match(/^[IVX]+/)?.[0] ?? "✦"}</span></div>
            )}
            <span className="yearbook__folio coord" aria-hidden="true">{String(i * 2 + 1).padStart(3, "0")}</span>
          </div>
          <div className="yearbook__page yearbook__page--right">
            <p className="eyebrow eyebrow--memory">{s.kicker}</p>
            <h2 className="h1">{s.title}{s.accent ? <> <em>{s.accent}</em></> : null}</h2>
            {s.text.map((t, n) => <p key={n} className={n ? "muted" : "yearbook__lede"}>{t}</p>)}
            {s.list?.length ? (
              <ul className="yearbook__list">
                {s.list.map((l) => <li key={l.href + l.label}><Link href={l.href}><span>{l.label}</span>{l.meta ? <span className="coord">{l.meta}</span> : null}</Link></li>)}
              </ul>
            ) : null}
            {s.cta ? <Link className="link-arrow" href={s.cta.href}>{s.cta.label} <Glyph name="arrow" size={16} /></Link> : null}
            <span className="yearbook__folio coord" aria-hidden="true">{String(i * 2 + 2).padStart(3, "0")}</span>
          </div>
        </div>
      </div>

      <div className="yearbook__nav">
        <button type="button" className="btn" onClick={() => go(i - 1, true)} disabled={i === 0}><Glyph name="arrow-left" size={16} /> Trang trước</button>
        <div className="yearbook__dots" aria-hidden="true">
          {spreads.map((sp, n) => <span key={sp.id} className={n === i ? "is-on" : ""} />)}
        </div>
        <button type="button" className="btn btn--primary" onClick={() => go(i + 1, true)} disabled={i === spreads.length - 1}>Trang sau <Glyph name="arrow" size={16} /></button>
      </div>
      <p className="small faint yearbook__hint">Dùng phím ← → hoặc vuốt để lật trang.</p>
    </div>
  );
}
