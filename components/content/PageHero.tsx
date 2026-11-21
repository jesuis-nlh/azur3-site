import type { ReactNode } from "react";

export default function PageHero({
  eyebrow, title, lede, aside, children, index,
}: { eyebrow: string; title: ReactNode; lede?: ReactNode; aside?: ReactNode; children?: ReactNode; index?: string }) {
  return (
    <section className="page-hero">
      <svg className="page-hero__orbit" viewBox="0 0 900 500" fill="none" aria-hidden="true">
        <ellipse cx="450" cy="250" rx="440" ry="120" stroke="rgba(169,174,200,.14)" transform="rotate(-12 450 250)" />
        <ellipse cx="450" cy="250" rx="330" ry="86" stroke="rgba(169,174,200,.1)" transform="rotate(-12 450 250)" />
        <circle cx="822" cy="175" r="3" fill="#63D9FF" />
      </svg>
      <div className="shell">
        <div className="page-hero__grid">
          <div>
            <p className="eyebrow fade-in">{index ? <span className="num">{index}</span> : null}{eyebrow}</p>
            <h1 className="display display-l page-hero__title">
              <span className="rise"><span style={{ "--delay": "80ms" } as React.CSSProperties}>{title}</span></span>
            </h1>
          </div>
          {lede || aside ? (
            <div className="page-hero__aside fade-in" style={{ "--delay": "160ms" } as React.CSSProperties}>
              {lede ? <p className="lede">{lede}</p> : null}
              {aside}
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
