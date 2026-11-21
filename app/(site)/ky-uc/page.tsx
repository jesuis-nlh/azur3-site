import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/content/PageHero";
import Plate from "@/components/content/Plate";
import Gallery from "@/components/content/Gallery";
import DemoBadge from "@/components/ui/DemoBadge";
import { albumCover, publicAlbums } from "@/lib/queries";
import { toGalleryItem } from "@/lib/gallery";
import { formatFuzzy } from "@/lib/dates";
import { schoolYearLabel, site } from "@/lib/site";
import { ALBUM_TOPICS, type AlbumTopic } from "@/lib/types";

export const metadata: Metadata = { title: "Ký ức", description: "Kho ảnh của lớp 12A3, sắp theo sự kiện, năm học và chủ đề." };
export const dynamic = "force-dynamic";

/** Filters are plain links (?nam=&chu-de=) so they work without JavaScript and can be shared. */
export default async function MemoriesPage({ searchParams }: { searchParams: Promise<{ nam?: string; "chu-de"?: string }> }) {
  const sp = await searchParams;
  const all = await publicAlbums();
  const year = site.schoolYears.find((y) => y === sp.nam);
  const topic = sp["chu-de"] && sp["chu-de"] in ALBUM_TOPICS ? (sp["chu-de"] as AlbumTopic) : undefined;
  const albums = all.filter((a) => (!year || a.schoolYear === year) && (!topic || a.topic === topic));
  const photos = albums.flatMap((a) => a.assets.map((x) => toGalleryItem(x, a)));
  const topics = (Object.keys(ALBUM_TOPICS) as AlbumTopic[]).filter((t) => all.some((a) => a.topic === t));
  const href = (n?: string, t?: string) => {
    const q = new URLSearchParams();
    if (n) q.set("nam", n);
    if (t) q.set("chu-de", t);
    const s = q.toString();
    return s ? `/ky-uc?${s}` : "/ky-uc";
  };

  return (
    <>
      <PageHero
        eyebrow="Thiên hà khoảnh khắc"
        title={<>Ký <em>ức</em></>}
        lede="Mỗi album là một cụm sao quanh một sự kiện. Ảnh gốc luôn là trung tâm — kho lưu trữ chỉ thêm ngày tháng, nguồn và tên người chụp khi biết chắc."
        aside={<ul className="stat-line"><li><span className="num">{all.length}</span><span className="label">Album</span></li><li><span className="num">{all.reduce((n, a) => n + a.assets.length, 0)}</span><span className="label">Ảnh</span></li></ul>}
      />

      <div className="shell">
        <div className="filter-bar" role="navigation" aria-label="Lọc album">
          <div className="chips" aria-label="Năm học">
            <Link className="chip" href={href(undefined, topic)} aria-current={!year ? "page" : undefined}>Mọi năm</Link>
            {site.schoolYears.map((y) => <Link key={y} className="chip" href={href(y, topic)} aria-current={year === y ? "page" : undefined}>{schoolYearLabel(y)}</Link>)}
          </div>
          <div className="chips" aria-label="Chủ đề">
            <Link className="chip" href={href(year)} aria-current={!topic ? "page" : undefined}>Mọi chủ đề</Link>
            {topics.map((t) => <Link key={t} className="chip" href={href(year, t)} aria-current={topic === t ? "page" : undefined}>{ALBUM_TOPICS[t]}</Link>)}
          </div>
        </div>

        {albums.length === 0 ? (
          <div className="empty"><p className="h3">Chưa có album nào ở đây</p><p>Thử chọn năm hoặc chủ đề khác.</p><Link href="/ky-uc" className="btn btn--sm">Xem tất cả</Link></div>
        ) : (
          <section className="section section--tight" aria-labelledby="albums-h" style={{ paddingTop: "var(--s-7)" }}>
            <h2 id="albums-h" className="sr-only">Album</h2>
            <div className="album-grid album-grid--editorial">
              {albums.map((a, i) => {
                const cover = albumCover(a);
                return (
                  <Link key={a.id} href={`/ky-uc/${a.slug}`} className={`album-card card-link album-card--${i % 5}`} data-reveal style={{ "--delay": `${(i % 3) * 80}ms` } as React.CSSProperties} data-cursor="view">
                    {cover ? <Plate asset={cover} caption={false} ratio={i % 5 === 0 ? "4 / 5" : i % 5 === 3 ? "16 / 9" : "4 / 3"} sizes="(min-width: 900px) 40vw, 100vw" /> : null}
                    <span className="card-meta">
                      <span className="coord">{formatFuzzy(a.eventDate)}</span><span className="dot" /><span>{a.assets.length} ảnh</span><span className="dot" /><span>{ALBUM_TOPICS[a.topic]}</span><DemoBadge item={a} />
                    </span>
                    <h3 className="h2 card-title">{a.title}</h3>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {photos.length ? (
          <section className="section section--tight" aria-labelledby="all-photos">
            <div className="section-head">
              <p className="eyebrow eyebrow--memory">Toàn bộ ảnh</p>
              <h2 id="all-photos" className="h2">Mọi khoảnh khắc{year ? `, ${schoolYearLabel(year)}` : ""}</h2>
            </div>
            <Gallery items={photos} />
          </section>
        ) : null}
      </div>
    </>
  );
}
