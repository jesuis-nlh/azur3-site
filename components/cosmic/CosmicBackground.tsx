"use client";

import { useEffect, useRef } from "react";

/**
 * The universe behind every page.
 *
 * Layers (back → front):
 *  1. CSS deep-space gradient + slow nebula clouds (cheap, GPU-composited)
 *  2. Canvas: three parallax star layers with gentle twinkle
 *  3. Canvas: an occasional shooting star (every ~9–20 s)
 *
 * Performance: DPR capped at 1.5, star count scales with viewport area and
 * device capability, rendering pauses while the tab is hidden, and the
 * animation loop is skipped entirely for prefers-reduced-motion (one static
 * frame is drawn instead).
 */
type Star = { x: number; y: number; r: number; a: number; tw: number; ph: number; layer: number; hue: number };

export default function CosmicBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4 || window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let w = 0, h = 0, raf = 0, last = 0;
    let stars: Star[] = [];
    let scrollY = window.scrollY;
    let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    let nextShoot = performance.now() + 6000 + Math.random() * 8000;

    const seedStars = () => {
      const density = lowPower ? 5200 : 3400;
      const n = Math.min(520, Math.round((w * h) / density));
      stars = Array.from({ length: n }, () => {
        const layer = Math.random() < 0.62 ? 0 : Math.random() < 0.75 ? 1 : 2;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: layer === 0 ? 0.35 + Math.random() * 0.5 : layer === 1 ? 0.6 + Math.random() * 0.7 : 1 + Math.random() * 0.9,
          a: layer === 0 ? 0.25 + Math.random() * 0.35 : 0.45 + Math.random() * 0.5,
          tw: 0.4 + Math.random() * 1.6,
          ph: Math.random() * Math.PI * 2,
          layer,
          // mostly white; a few cool and a few warm stars
          hue: Math.random() < 0.12 ? 1 : Math.random() < 0.08 ? 2 : 0,
        };
      });
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
      if (reduce.matches) draw(0);
    };

    const COLORS = ["244,243,255", "160,225,255", "255,224,170"];
    const PARALLAX = [0.015, 0.04, 0.08];

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const still = reduce.matches;
      for (const s of stars) {
        const py = still ? s.y : (((s.y - scrollY * PARALLAX[s.layer]) % h) + h) % h;
        const twinkle = still ? 1 : 0.72 + 0.28 * Math.sin(t * 0.001 * s.tw + s.ph);
        const alpha = s.a * twinkle;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${COLORS[s.hue]},${alpha.toFixed(3)})`;
        ctx.arc(s.x, py, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.layer === 2 && s.r > 1.5) {
          // soft halo on the nearest, brightest stars
          const g = ctx.createRadialGradient(s.x, py, 0, s.x, py, s.r * 7);
          g.addColorStop(0, `rgba(${COLORS[s.hue]},${(alpha * 0.25).toFixed(3)})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect(s.x - s.r * 7, py - s.r * 7, s.r * 14, s.r * 14);
        }
      }
      if (shoot) {
        const tail = 110;
        const len = Math.hypot(shoot.vx, shoot.vy);
        const tx = shoot.x - (shoot.vx / len) * tail, ty = shoot.y - (shoot.vy / len) * tail;
        const g = ctx.createLinearGradient(shoot.x, shoot.y, tx, ty);
        const fade = Math.min(1, shoot.life / 0.35);
        g.addColorStop(0, `rgba(244,243,255,${0.85 * fade})`);
        g.addColorStop(1, "rgba(99,217,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(shoot.x, shoot.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      // ~40 fps is plenty for a background and halves the GPU cost on 120 Hz screens
      if (t - last < 24) return;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!shoot && t > nextShoot) {
        const fromLeft = Math.random() < 0.5;
        shoot = {
          x: fromLeft ? Math.random() * w * 0.5 : w * 0.5 + Math.random() * w * 0.5,
          y: Math.random() * h * 0.35,
          vx: (fromLeft ? 1 : -1) * (520 + Math.random() * 260),
          vy: 180 + Math.random() * 140,
          life: 1.1,
        };
      }
      if (shoot) {
        shoot.x += shoot.vx * dt;
        shoot.y += shoot.vy * dt;
        shoot.life -= dt;
        if (shoot.life <= 0) {
          shoot = null;
          nextShoot = t + 9000 + Math.random() * 11000;
        }
      }
      draw(t);
    };

    const onScroll = () => { scrollY = window.scrollY; };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce.matches) raf = requestAnimationFrame(loop);
    };
    const onMotionChange = () => { onVisibility(); if (reduce.matches) draw(0); };

    resize();
    if (!reduce.matches) raf = requestAnimationFrame(loop);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onMotionChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div className="cosmos" aria-hidden="true">
      <div className="cosmos__nebula cosmos__nebula--a" />
      <div className="cosmos__nebula cosmos__nebula--b" />
      <div className="cosmos__nebula cosmos__nebula--c" />
      <canvas ref={ref} className="cosmos__stars" />
      <div className="cosmos__veil" />
    </div>
  );
}
