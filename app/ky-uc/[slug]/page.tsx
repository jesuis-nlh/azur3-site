import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/content/Gallery";
import Provenance from "@/components/content/Provenance";
import DemoBadge from "@/components/ui/DemoBadge";
import { albumBySlug, publicEvents } from "@/lib/queries";
import { toGalleryItem } from "@/lib/gallery";
import { formatFuzzy } from "@/lib/dates";
import { ALBUM_TOPICS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await albumBySlug((await params).slug);
  return a ? { title: a.title, description: a.description } : { title: "Không tìm thấy" };
}

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await albumBySlug((await params).slug);
  if (!a) notFound();
  const event = a.eventId ? (await publicEvents()).find((e) => e.id === a.eventId) : undefined;
  const credits = [...new Set(a.assets.map((x) => x.photographer).filter(Boolean))];

  return (
    <>
      <header className="page-hero">
        <div className="shell">
          <ol className="crumbs fade-in"><li><Link href="/ky-uc">Ký ức</Link></li><li>{ALBUM_TOPICS[a.topic]}</li></ol>
          <div className="page-hero__grid" style={{ marginTop: "var(--s-6)" }}>
            <div>
              <p className="eyebrow eyebrow--memory fade-in">{formatFuzzy(a.eventDate)} · {a.assets.length} ảnh</p>
              <h1 className="display display-l page-hero__title"><span className="rise"><span>{a.title}</span></span></h1>
            </div>
            <div className="page-hero__aside fade-in" style={{ "--delay": "300ms" } as React.CSSProperties}>
              {a.description ? <p className="lede">{a.description}</p> : null}
              <div className="page-hero__meta">
                <DemoBadge item={a} />
                {event ? <Link className="link-arrow" href={`/dong-thoi-gian/${event.slug}`}>Sự kiện: {event.title}</Link> : null}
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="shell">
        <Gallery items={a.assets.map((x) => toGalleryItem(x, a))} />
        <div className="album-foot">
          <div>
            <p className="eyebrow">Ghi công</p>
            <p className="muted">{credits.length ? credits.join(", ") : "Chưa rõ người chụp — nếu bạn biết, hãy gửi đính chính."}</p>
          </div>
          <Provenance item={a} />
        </div>
      </div>
    </>
  );
}
