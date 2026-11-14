"use client";
import { useEffect, useState } from "react";

/** Thin starlight bar under the header that tracks how far through the article you are. */
export default function ReadingProgress({ target }: { target: string }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) return;
    const on = () => {
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setP(Math.max(0, Math.min(1, -r.top / Math.max(1, total))));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, [target]);
  return <div className="reading-progress" role="progressbar" aria-label="Tiến độ đọc" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)} style={{ "--p": p } as React.CSSProperties} />;
}
