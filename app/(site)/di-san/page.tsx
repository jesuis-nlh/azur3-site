import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/content/PageHero";
import DemoBadge from "@/components/ui/DemoBadge";
import { publicEvents, publicLegacy } from "@/lib/queries";
import { formatFuzzy } from "@/lib/dates";

export const metadata: Metadata = { title: "Di sản", description: "Thành tích, truyền thống và cột mốc của lớp 12A3 — chỉ ghi là sự thật khi đã xác minh." };
export const dynamic = "force-dynamic";

const KIND = { achievement: "Thành tích", tradition: "Truyền thống", milestone: "Cột mốc", project: "Dự án", contribution: "Đóng góp" } as const;

export default async function LegacyPage() {
  const [items, events] = await Promise.all([publicLegacy(), publicEvents()]);
  return (
    <>
      <PageHero eyebrow="Chòm sao thành tựu" title={<>Di <em>sản</em></>}
        lede="Những gì lớp để lại: thành tích, truyền thống, dự án. Mỗi mục ghi rõ đã được xác minh hay còn chờ nguồn — kho lưu trữ không phóng đại ký ức." />
      <div className="shell">
        <ol className="legacy">
          <svg className="legacy__spine" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 10 100"><line x1="5" y1="0" x2="5" y2="100" stroke="rgba(231,194,122,.35)" strokeDasharray="1 2" vectorEffect="non-scaling-stroke" /></svg>
          {items.map((l, i) => {
            const ev = events.find((e) => e.id === l.eventId);
            return (
              <li key={l.id} id={l.slug} className={`legacy__item${l.verified ? " is-verified" : ""}`} data-reveal style={{ "--delay": `${i * 60}ms` } as React.CSSProperties}>
                <span className="legacy__mark" aria-hidden="true" />
                <div className="legacy__meta">
                  <span className="coord">{formatFuzzy(l.eventDate)}</span>
                  <span className="eyebrow">{KIND[l.kind]}</span>
                </div>
                <div className="legacy__body">
                  <h2 className="h2">{l.title}</h2>
                  {l.description ? <p className="muted">{l.description}</p> : null}
                  <div className="card-meta">
                    {l.verified ? <span className="badge badge--ok">Đã xác minh</span> : <span className="badge badge--warn">Chờ xác minh</span>}
                    <DemoBadge item={{ demo: l.demo }} />
                    {l.evidence ? <span>Nguồn: {l.evidence}</span> : null}
                    {ev ? <Link href={`/dong-thoi-gian/${ev.slug}`}>Sự kiện liên quan</Link> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="notice" style={{ marginBlock: "var(--s-8)" }}>Biết một thành tích của lớp và có nguồn xác minh (giấy khen, thông báo của trường, bài báo)? <Link href="/dong-gop?loai=event">Gửi cho ban biên tập</Link>.</p>
      </div>
    </>
  );
}
