import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/content/PageHero";
import Plate from "@/components/content/Plate";
import DemoBadge from "@/components/ui/DemoBadge";
import Glyph from "@/components/ui/Glyph";
import { publicVideos } from "@/lib/queries";
import { formatFuzzy } from "@/lib/dates";
import { VIDEO_CATEGORIES, type VideoCategory } from "@/lib/types";

export const metadata: Metadata = { title: "Thước phim", description: "Video của lớp 12A3: biểu diễn, hoạt động, phỏng vấn và hồi tưởng." };
export const dynamic = "force-dynamic";

function duration(sec?: number) {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ loai?: string }> }) {
  const { loai } = await searchParams;
  const all = await publicVideos();
  const cat = loai && loai in VIDEO_CATEGORIES ? (loai as VideoCategory) : undefined;
  const videos = all.filter((v) => !cat || v.category === cat);
  const cats = (Object.keys(VIDEO_CATEGORIES) as VideoCategory[]).filter((c) => all.some((v) => v.category === c));
  const [lead, ...rest] = videos;

  return (
    <>
      <PageHero eyebrow="Vũ trụ điện ảnh" title={<>Thước <em>phim</em></>}
        lede="Những khoảnh khắc chuyển động: tiết mục, chuyến đi, lời phỏng vấn. Video được phát từ nơi lưu trữ được phép và chỉ tải khi bạn bấm phát." />
      <div className="shell">
        <div className="filter-bar">
          <div className="chips" aria-label="Loại video">
            <Link href="/thuoc-phim" className="chip" aria-current={!cat ? "page" : undefined}>Tất cả</Link>
            {cats.map((c) => <Link key={c} href={`/thuoc-phim?loai=${c}`} className="chip" aria-current={cat === c ? "page" : undefined}>{VIDEO_CATEGORIES[c]}</Link>)}
          </div>
        </div>
        {!lead ? (
          <div className="empty" style={{ marginTop: "var(--s-7)" }}><p className="h3">Chưa có thước phim nào</p><p>Video sẽ xuất hiện khi được gửi và duyệt.</p></div>
        ) : (
          <>
            <Link href={`/thuoc-phim/${lead.slug}`} className="video-lead card-link" data-reveal data-cursor="view">
              <span className="video-lead__media">
                {lead.poster ? <Plate asset={lead.poster} caption={false} ratio="16 / 9" sizes="100vw" /> : null}
                <span className="video-lead__play" aria-hidden="true"><Glyph name="play" size={28} /></span>
              </span>
              <span className="video-lead__meta">
                <span className="card-meta"><span>{VIDEO_CATEGORIES[lead.category]}</span><span className="dot" /><span className="coord">{formatFuzzy(lead.eventDate)}</span>{duration(lead.durationSec) ? <><span className="dot" /><span>{duration(lead.durationSec)}</span></> : null}<DemoBadge item={lead} /></span>
                <h2 className="h1 card-title">{lead.title}</h2>
                {lead.description ? <span className="muted">{lead.description}</span> : null}
              </span>
            </Link>
            <ul className="video-grid">
              {rest.map((v, i) => (
                <li key={v.id} data-reveal style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}>
                  <Link href={`/thuoc-phim/${v.slug}`} className="video-card card-link" data-cursor="view">
                    <span className="video-card__media">
                      {v.poster ? <Plate asset={v.poster} caption={false} ratio="16 / 9" sizes="(min-width: 900px) 33vw, 100vw" /> : null}
                      <span className="video-card__play" aria-hidden="true"><Glyph name="play" size={18} /></span>
                    </span>
                    <span className="card-meta"><span>{VIDEO_CATEGORIES[v.category]}</span><span className="dot" /><span className="coord">{formatFuzzy(v.eventDate)}</span><DemoBadge item={v} /></span>
                    <h2 className="h3 card-title">{v.title}</h2>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
