"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface OrreryStar {
  slug: string;
  title: string;
  date: string;
  /** 0, 1, 2 — which school year (ring) */
  ring: number;
  /** 0..1 position in the school year (September = 0) */
  t: number;
  milestone?: boolean;
}

const W = 760, CX = W / 2, CY = 380;
const RINGS = [
  { rx: 170, ry: 58 },
  { rx: 262, ry: 90 },
  { rx: 354, ry: 122 },
];
const TILT = (-16 * Math.PI) / 180;
const YEARS = ["2022–23", "2023–24", "2024–25"];
/** inner orbits travel faster, like real ones */
const SPEED = [1.6, 1.15, 0.85];
/** full turns per millisecond at speed 1 (≈ one turn every ~29 s) */
const RATE = 0.000035;

function place(ring: number, theta: number) {
  const { rx, ry } = RINGS[ring];
  const x0 = rx * Math.cos(theta), y0 = ry * Math.sin(theta);
  return {
    x: CX + x0 * Math.cos(TILT) - y0 * Math.sin(TILT),
    y: CY + x0 * Math.sin(TILT) + y0 * Math.cos(TILT),
    depth: Math.sin(theta), // >0 in front, <0 behind
  };
}

function starTransform(s: OrreryStar, phase: number) {
  const theta = s.t * Math.PI * 2 - Math.PI / 2 + phase * (SPEED[s.ring] ?? 1) * Math.PI * 2;
  const p = place(s.ring, theta);
  const near = (p.depth + 1) / 2; // 0 behind … 1 in front
  return {
    transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(0.65 + near * 0.55).toFixed(3)})`,
    opacity: (0.3 + near * 0.7).toFixed(3),
  };
}

/**
 * A dimensional "orrery": three orbits for three school years, each event a
 * star placed by its month. Stars passing behind the core dim and shrink,
 * giving depth without WebGL.
 *
 * Performance: React renders the SVG once. A single rAF loop moves the stars
 * by writing each star group's `transform`/`opacity` attributes directly —
 * no React re-render per frame. The loop starts only once the browser is idle
 * (so it never competes with first render), runs at ~30 fps, and pauses on
 * hover/focus, when off-screen, when the tab is hidden, and entirely under
 * prefers-reduced-motion. Hover/focus visuals are CSS; every star is a link.
 */
export default function Orrery({ stars, center = "12A3" }: { stars: OrreryStar[]; center?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<(SVGGElement | null)[]>([]);
  const paused = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = 0, phase = 0, visible = true, started = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    if (rootRef.current) io.observe(rootRef.current);

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!last) { last = t; return; }
      const dt = t - last;
      if (dt < 33) return;
      last = t;
      if (paused.current || !visible || document.hidden) return;
      phase += Math.min(dt, 100) * RATE;
      stars.forEach((s, i) => {
        const g = nodes.current[i];
        if (!g) return;
        const { transform, opacity } = starTransform(s, phase);
        g.setAttribute("transform", transform);
        g.setAttribute("opacity", opacity);
      });
    };
    const start = () => { if (!started) { started = true; raf = requestAnimationFrame(loop); } };
    // Safari has no requestIdleCallback; fall back to a short timeout there
    const hasIdle = "requestIdleCallback" in window;
    const handle = hasIdle ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 1200);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [stars]);

  const act = active === null ? null : stars[active];

  return (
    <div
      ref={rootRef}
      className="orrery"
      onPointerEnter={() => { paused.current = true; }}
      onPointerLeave={() => { paused.current = false; setActive(null); }}
      onFocus={() => { paused.current = true; }}
      onBlur={() => { paused.current = false; }}
    >
      <svg viewBox={`0 ${CY - 245} ${W} 490`} role="group" aria-label="Quỹ đạo ký ức: các sự kiện theo ba năm học">
        <defs>
          <radialGradient id="orrery-core">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="0.18" stopColor="#F4F3FF" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#8B5CF6" stopOpacity="0.16" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="orrery-glow">
            <stop offset="0" stopColor="#E7C27A" stopOpacity="0.7" />
            <stop offset="1" stopColor="#E7C27A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {RINGS.map((r, i) => (
          <ellipse key={`b${i}`} cx={CX} cy={CY} rx={r.rx} ry={r.ry} transform={`rotate(-16 ${CX} ${CY})`}
            fill="none" stroke="rgba(169,174,200,.18)" strokeDasharray={i === 2 ? "2 6" : undefined} />
        ))}

        <circle cx={CX} cy={CY} r={150} fill="url(#orrery-core)" />

        {/* Stars: positioned by transform; behind-the-core stars are dimmed and shrunk */}
        {stars.map((s, i) => {
          const initial = starTransform(s, 0);
          const r = s.milestone ? 4.6 : 3;
          return (
            <Link
              key={s.slug}
              href={`/dong-thoi-gian/${s.slug}`}
              aria-label={`${s.title}, ${s.date}`}
              className={`orrery__star${s.milestone ? " is-milestone" : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <g ref={(el) => { nodes.current[i] = el; }} transform={initial.transform} opacity={initial.opacity}>
                <circle r={22} fill="transparent" />
                <circle className="orrery__glow" r={r * 5.5} fill="url(#orrery-glow)" />
                <circle className="orrery__dot" r={r} fill={s.milestone ? "#F7E3B5" : "#F4F3FF"} />
                <circle className="orrery__ring" r={r * 3.4} fill="none" stroke="#E7C27A" />
              </g>
            </Link>
          );
        })}

        {/* core label and front arcs sit above the stars for depth */}
        <text x={CX} y={CY + 14} textAnchor="middle" className="orrery__center">{center}</text>
        {RINGS.map((r, i) => (
          <path key={`f${i}`}
            d={`M ${CX - r.rx} ${CY} A ${r.rx} ${r.ry} 0 0 0 ${CX + r.rx} ${CY}`}
            transform={`rotate(-16 ${CX} ${CY})`}
            fill="none" stroke="rgba(244,243,255,.34)" pointerEvents="none" />
        ))}
        {RINGS.map((_, i) => {
          const p = place(i, Math.PI * 0.6);
          return <text key={`y${i}`} x={p.x - 8} y={p.y + 16} textAnchor="end" className="orrery__year">{YEARS[i]}</text>;
        })}
      </svg>

      <div className={`orrery__label${act ? " is-on" : ""}`} aria-live="polite">
        {act ? (<><span className="coord">{act.date}</span><span className="orrery__title">{act.title}</span></>) : null}
      </div>
    </div>
  );
}
