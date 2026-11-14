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

const W = 760, H = 760, CX = W / 2, CY = H / 2;
const RINGS = [
  { rx: 170, ry: 58 },
  { rx: 262, ry: 90 },
  { rx: 354, ry: 122 },
];
const TILT = (-16 * Math.PI) / 180;
const YEARS = ["2022–23", "2023–24", "2024–25"];

function place(ring: number, theta: number) {
  const { rx, ry } = RINGS[ring];
  const x0 = rx * Math.cos(theta), y0 = ry * Math.sin(theta);
  return {
    x: CX + x0 * Math.cos(TILT) - y0 * Math.sin(TILT),
    y: CY + x0 * Math.sin(TILT) + y0 * Math.cos(TILT),
    depth: Math.sin(theta), // >0 in front, <0 behind
  };
}

/**
 * A dimensional "orrery": three orbits for three school years, each event a
 * star placed by its month. Stars travel slowly; those passing behind the
 * centre dim and shrink, giving depth without WebGL. Pauses on hover/focus,
 * static under prefers-reduced-motion. Every star is a real link.
 */
export default function Orrery({ stars, center = "12A3" }: { stars: OrreryStar[]; center?: string }) {
  const [phase, setPhase] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = performance.now(), visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    const el = document.querySelector(".orrery");
    if (el) io.observe(el);
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = t - last;
      if (dt < 33) return; // ~30fps is plenty for a slow orbit
      last = t;
      if (!paused.current && visible && !document.hidden) setPhase((p) => p + dt * 0.000035);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const positioned = stars.map((s, i) => {
    // inner rings move faster, like real orbits
    const speed = [1.6, 1.15, 0.85][s.ring] ?? 1;
    const theta = s.t * Math.PI * 2 - Math.PI / 2 + phase * speed * Math.PI * 2;
    return { ...s, i, ...place(s.ring, theta) };
  });
  const sorted = [...positioned].sort((a, b) => a.depth - b.depth);
  const act = active === null ? null : positioned[active];

  return (
    <div
      className="orrery"
      onPointerEnter={() => { paused.current = true; }}
      onPointerLeave={() => { paused.current = false; setActive(null); }}
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

        {/* back halves of the rings */}
        {RINGS.map((r, i) => (
          <ellipse key={`b${i}`} cx={CX} cy={CY} rx={r.rx} ry={r.ry} transform={`rotate(-16 ${CX} ${CY})`}
            fill="none" stroke="rgba(169,174,200,.18)" strokeDasharray={i === 2 ? "2 6" : undefined} />
        ))}

        {/* stars behind the core */}
        {sorted.filter((s) => s.depth < 0).map((s) => <StarNode key={s.slug} s={s} activeIdx={active} setActive={setActive} />)}

        <circle cx={CX} cy={CY} r={150} fill="url(#orrery-core)" />
        <text x={CX} y={CY + 14} textAnchor="middle" className="orrery__center">{center}</text>

        {/* front arcs drawn over the core for depth */}
        {RINGS.map((r, i) => (
          <path key={`f${i}`}
            d={`M ${CX - r.rx} ${CY} A ${r.rx} ${r.ry} 0 0 0 ${CX + r.rx} ${CY}`}
            transform={`rotate(-16 ${CX} ${CY})`}
            fill="none" stroke="rgba(244,243,255,.34)" />
        ))}

        {RINGS.map((r, i) => {
          const p = place(i, Math.PI * 0.6);
          return <text key={`y${i}`} x={p.x - 8} y={p.y + 16} textAnchor="end" className="orrery__year">{YEARS[i]}</text>;
        })}

        {sorted.filter((s) => s.depth >= 0).map((s) => <StarNode key={s.slug} s={s} activeIdx={active} setActive={setActive} />)}
      </svg>

      <div className={`orrery__label${act ? " is-on" : ""}`} aria-live="polite">
        {act ? (<><span className="coord">{act.date}</span><span className="orrery__title">{act.title}</span></>) : null}
      </div>
    </div>
  );
}

function StarNode({ s, activeIdx, setActive }: {
  s: OrreryStar & { i: number; x: number; y: number; depth: number };
  activeIdx: number | null;
  setActive: (i: number | null) => void;
}) {
  const near = (s.depth + 1) / 2; // 0 behind … 1 in front
  const r = (s.milestone ? 4.6 : 3) * (0.65 + near * 0.55);
  const on = activeIdx === s.i;
  return (
    <Link
      href={`/dong-thoi-gian/${s.slug}`}
      aria-label={`${s.title}, ${s.date}`}
      onMouseEnter={() => setActive(s.i)}
      onFocus={() => setActive(s.i)}
      onBlur={() => setActive(null)}
      className="orrery__star"
    >
      <circle cx={s.x} cy={s.y} r={22} fill="transparent" />
      {s.milestone || on ? <circle cx={s.x} cy={s.y} r={r * 5.5} fill="url(#orrery-glow)" opacity={on ? 1 : 0.55} /> : null}
      <circle cx={s.x} cy={s.y} r={on ? r * 1.6 : r} fill={s.milestone ? "#F7E3B5" : "#F4F3FF"} opacity={0.35 + near * 0.65} />
      {on ? <circle cx={s.x} cy={s.y} r={r * 3.4} fill="none" stroke="#E7C27A" strokeOpacity=".8" /> : null}
    </Link>
  );
}
