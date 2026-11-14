"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Glyph from "@/components/ui/Glyph";

export interface GalleryItem {
  id: string;
  src: string;
  preview?: string;
  thumb?: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  credit?: string;
  date?: string;
  album?: string;
  tone?: string;
  demo?: boolean;
}

const SLIDE_MS = 4500;

/**
 * Editorial masonry + full-screen lightbox.
 * Keyboard: ← → navigate · Space play/pause slideshow · I info · Esc close.
 * Touch: swipe left/right. Uses <dialog> so focus is trapped natively.
 */
export default function Gallery({ items, label = "Ảnh", startSlideshowLabel = true }: { items: GalleryItem[]; label?: string; startSlideshowLabel?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [info, setInfo] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const open = useCallback((i: number, play = false, opener?: HTMLElement | null) => {
    openerRef.current = opener ?? (document.activeElement as HTMLElement);
    setIndex(i);
    setPlaying(play);
    setLoaded(false);
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const go = useCallback((delta: number) => {
    setLoaded(false);
    setIndex((i) => (i === null ? i : (i + delta + items.length) % items.length));
  }, [items.length]);

  // Slideshow timer
  useEffect(() => {
    if (!playing || index === null) return;
    const t = window.setTimeout(() => go(1), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [playing, index, go]);

  // Preload neighbours
  useEffect(() => {
    if (index === null) return;
    [1, -1].forEach((d) => {
      const it = items[(index + d + items.length) % items.length];
      const img = new Image();
      img.src = it.preview ?? it.src;
    });
  }, [index, items]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      setIndex(null);
      setPlaying(false);
      openerRef.current?.focus();
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); setPlaying((p) => !p); }
    else if (e.key.toLowerCase() === "i") setInfo((v) => !v);
  };

  const current = index === null ? null : items[index];

  if (!items.length) {
    return (
      <div className="empty">
        <p className="h3">Chưa có ảnh nào ở đây</p>
        <p>Ảnh sẽ xuất hiện khi được gửi lên và được những người trong ảnh đồng ý.</p>
      </div>
    );
  }

  return (
    <>
      {startSlideshowLabel ? (
        <div className="gallery-toolbar">
          <p className="small faint" style={{ margin: 0 }}><span className="num">{String(items.length).padStart(2, "0")}</span> {label.toLowerCase()}</p>
          <button type="button" className="btn btn--sm" onClick={(e) => open(0, true, e.currentTarget)}>
            <Glyph name="play" size={14} /> Trình chiếu
          </button>
        </div>
      ) : null}

      <ul className="masonry" role="list">
        {items.map((it, i) => (
          <li key={it.id + i} className="masonry__item" data-reveal style={{ "--delay": `${(i % 6) * 60}ms` } as React.CSSProperties}>
            <button
              type="button"
              className="masonry__btn"
              onClick={(e) => open(i, false, e.currentTarget)}
              data-cursor="view"
              aria-label={`Mở ảnh ${i + 1}/${items.length}: ${it.alt}`}
            >
              <span className="plate__frame" style={{ aspectRatio: `${it.width} / ${it.height}`, background: it.tone }}>
                <img src={it.thumb ?? it.preview ?? it.src} width={it.width} height={it.height} alt="" loading="lazy" decoding="async" />
              </span>
              <span className="masonry__meta">
                <span className="coord">{String(i + 1).padStart(2, "0")}</span>
                {it.caption ? <span className="masonry__caption">{it.caption}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} className="lightbox" aria-label="Trình xem ảnh" onKeyDown={onKey}
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}>
        {current ? (
          <div
            className={`lightbox__stage${info ? " has-info" : ""}`}
            onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            onTouchEnd={(e) => {
              if (!touch.current) return;
              const dx = e.changedTouches[0].clientX - touch.current.x;
              const dy = e.changedTouches[0].clientY - touch.current.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
              touch.current = null;
            }}
          >
            <div className="lightbox__bar">
              <p className="coord" aria-live="polite">{String((index ?? 0) + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</p>
              <div className="lightbox__tools">
                <button type="button" className="icon-btn" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} aria-label={playing ? "Dừng trình chiếu" : "Bắt đầu trình chiếu"}>
                  <Glyph name={playing ? "pause" : "play"} />
                </button>
                <button type="button" className="icon-btn" onClick={() => setInfo((v) => !v)} aria-pressed={info} aria-label="Thông tin ảnh">
                  <Glyph name="info" />
                </button>
                <button type="button" className="icon-btn" onClick={close} aria-label="Đóng trình xem ảnh" autoFocus>
                  <Glyph name="close" />
                </button>
              </div>
            </div>

            <div className="lightbox__figure">
              <img
                key={current.id + index}
                src={current.preview ?? current.src}
                alt={current.alt}
                className={loaded ? "is-loaded" : ""}
                onLoad={() => setLoaded(true)}
                style={{ aspectRatio: `${current.width} / ${current.height}` }}
              />
              {playing ? <span className="lightbox__progress" key={`p${index}`} style={{ animationDuration: `${SLIDE_MS}ms` }} /> : null}
            </div>

            <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Ảnh trước">
              <Glyph name="arrow-left" size={22} />
            </button>
            <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Ảnh sau">
              <Glyph name="arrow" size={22} />
            </button>

            {info ? (
              <aside className="lightbox__info">
                {current.album ? <p className="eyebrow">{current.album}</p> : null}
                <p className="lightbox__caption">{current.caption ?? current.alt}</p>
                <dl>
                  {current.date ? (<><dt>Thời điểm</dt><dd>{current.date}</dd></>) : null}
                  {current.credit ? (<><dt>Ảnh</dt><dd>{current.credit}</dd></>) : null}
                </dl>
                {current.demo ? <p className="badge badge--demo">Ảnh minh hoạ</p> : null}
                <p className="small faint lightbox__keys">← → chuyển ảnh · Space trình chiếu · I thông tin · Esc đóng</p>
              </aside>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
