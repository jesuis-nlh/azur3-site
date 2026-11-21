"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * One small client island that powers site-wide interaction:
 *  - scroll reveals ([data-reveal] → .is-in) via a single IntersectionObserver
 *  - a starlight cursor halo that follows the native pointer (never replaces it)
 *  - context-aware halo states for links, buttons and photographs
 *  - magnetic pull for elements marked [data-magnetic]
 *  - pointer-position glow for .btn (CSS vars --mx/--my)
 *
 * All pointer effects are limited to fine pointers (mouse/trackpad) and are
 * disabled for prefers-reduced-motion. Keyboard and touch use native behaviour.
 */
export default function Interactions() {
  const pathname = usePathname();
  const haloRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // Scroll reveals — re-scan on every route change.
  // Elements already in the viewport are marked visible *before* hiding is enabled
  // (html.reveal-ready), so above-the-fold content never disappears or waits for JS.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const vh = window.innerHeight;
    const below: HTMLElement[] = [];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add("is-in");
      else below.push(el);
    }
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    below.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  // Cursor halo + magnetic
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const halo = haloRef.current, dot = dotRef.current;
    if (!halo || !dot || !fine.matches || reduce.matches) return;

    document.documentElement.classList.add("has-halo");
    let x = -100, y = -100, hx = -100, hy = -100, raf = 0, visible = false;
    let magnet: HTMLElement | null = null;

    const tick = () => {
      hx += (x - hx) * 0.18;
      hy += (y - hy) * 0.18;
      halo.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(x - hx) > 0.1 || Math.abs(y - hy) > 0.1) raf = requestAnimationFrame(tick);
      else raf = 0;
    };

    const setState = (target: Element | null) => {
      const photo = target?.closest("[data-cursor='view']");
      const interactive = target?.closest("a, button, [role='button'], label, summary, select");
      const text = target?.closest("input, textarea, [contenteditable='true']");
      halo.dataset.state = text ? "text" : photo ? "view" : interactive ? "link" : "idle";
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        hx = x; hy = y;
        halo.classList.add("is-visible");
        dot.classList.add("is-visible");
      }
      setState(e.target as Element);

      // button glow position
      const btn = (e.target as Element).closest<HTMLElement>(".btn");
      if (btn) {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", `${e.clientX - r.left}px`);
        btn.style.setProperty("--my", `${e.clientY - r.top}px`);
      }

      // magnetic pull (max ~8px) on opted-in elements
      const m = (e.target as Element).closest<HTMLElement>("[data-magnetic]");
      if (magnet && magnet !== m) {
        magnet.style.setProperty("--bx", "0px");
        magnet.style.setProperty("--by", "0px");
      }
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        m.style.setProperty("--bx", `${(dx * 10).toFixed(1)}px`);
        m.style.setProperty("--by", `${(dy * 8).toFixed(1)}px`);
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      visible = false;
      halo.classList.remove("is-visible");
      dot.classList.remove("is-visible");
    };
    const onDown = () => halo.classList.add("is-pressed");
    const onUp = () => halo.classList.remove("is-pressed");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-halo");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div ref={haloRef} className="halo" data-state="idle" aria-hidden="true">
        <span className="halo__label">Xem</span>
      </div>
      <div ref={dotRef} className="halo-dot" aria-hidden="true" />
    </>
  );
}
