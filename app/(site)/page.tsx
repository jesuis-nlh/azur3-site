import Link from "next/link";
import Orrery, { type OrreryStar } from "@/components/cosmic/Orrery";
import Plate from "@/components/content/Plate";
import DemoBadge from "@/components/ui/DemoBadge";
import Glyph from "@/components/ui/Glyph";
import { albumCover, publicAlbums, publicArticles, publicEvents, publicVideos } from "@/lib/queries";
import { formatFuzzy, fuzzyParts } from "@/lib/dates";
import { schoolYearLabel, site } from "@/lib/site";
import { ARTICLE_CATEGORIES, EVENT_CATEGORIES } from "@/lib/types";
import { readingMinutes } from "@/lib/text";

export const dynamic = "force-dynamic";

function yearProgress(value: string): number {
  const [, m = "9", d = "15"] = value.split("-");
  const month = Number(m);
  const idx = (month - 9 + 12) % 12; // September = 0
  return Math.min(0.98, (idx + Number(d) / 31) / 12);
}

export default async function Home() {
  const [events, albums, articles, videos] = await Promise.all([publicEvents(), publicAlbums(), publicArticles(), publicVideos()]);
  const stars: OrreryStar[] = events
    .filter((e) => e.eventDate)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      date: formatFuzzy(e.eventDate),
      ring: Math.max(0, site.schoolYears.indexOf(e.schoolYear as (typeof site.schoolYears)[number])),
      t: yearProgress(e.eventDate!.value),
      milestone: e.milestone,
    }));
  const milestones = events.filter((e) => e.milestone);
  const featuredAlbums = albums.slice(0, 4);
  const lead = articles.find((a) => a.featured) ?? articles[0];
  const more = articles.filter((a) => a.id !== lead?.id).slice(0, 3);
  const photoCount = albums.reduce((n, a) => n + a.assets.length, 0);
  const introPlate = albums[0]?.assets[0];

  return (
    <>
      {/* ───────── I. Opening ───────── */}
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="shell home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow fade-in">{site.school} · {site.city}</p>
            <h1 id="hero-title" className="display display-xl home-hero__title">
              <span className="rise"><span style={{ "--delay": "120ms" } as React.CSSProperties}>Hơn cả</span></span>
              <span className="rise"><span style={{ "--delay": "260ms" } as React.CSSProperties}><em>một lớp học.</em></span></span>
            </h1>
            <p className="lede fade-in" style={{ "--delay": "700ms" } as React.CSSProperties}>
              Ba năm của lớp {site.className}, khoá {site.cohort.start}–{site.cohort.end}, được gìn giữ như một bầu trời:
              mỗi ký ức là một vì sao, mỗi câu chuyện là một chòm sao.
            </p>
            <div className="home-hero__ctas fade-in" style={{ "--delay": "900ms" } as React.CSSProperties}>
              <Link href="/dong-thoi-gian" className="btn btn--primary" data-magnetic>
                Bước vào kho lưu trữ <Glyph name="arrow" className="arrow" />
              </Link>
              <Link href="/ky-uc" className="btn" data-magnetic>Xem ký ức</Link>
            </div>
          </div>
          <div className="home-hero__visual fade-in" style={{ "--delay": "300ms" } as React.CSSProperties}>
            <Orrery stars={stars} center={site.className} />
          </div>
        </div>
        <div className="shell home-hero__foot fade-in" style={{ "--delay": "1100ms" } as React.CSSProperties}>
          <p className="coord">16°03′N 108°12′E</p>
          <p className="coord">{site.cohort.start} → {site.cohort.end}</p>
          <p className="coord home-hero__hint">Di chuột lên một vì sao để đọc tên ký ức</p>
        </div>
      </section>

      {/* ───────── II. Prologue ───────── */}
      <section className="section home-intro" aria-labelledby="intro-title">
        <div className="shell grid-12">
          <div className="home-intro__text">
            <p className="eyebrow eyebrow--memory" data-reveal>Lời mở đầu</p>
            <h2 id="intro-title" className="h1" data-reveal style={{ "--delay": "80ms" } as React.CSSProperties}>
              Những gì chúng ta từng đăng vội, <em>giờ có một nơi để ở lại.</em>
            </h2>
            <div className="home-intro__body" data-reveal style={{ "--delay": "160ms" } as React.CSSProperties}>
              <p>
                Ảnh lớp nằm rải rác trên Facebook, trong điện thoại, trong những thư mục ai đó đã quên tên.
                Kho lưu trữ này gom chúng về một chỗ — có ngày tháng, có nguồn, có sự đồng ý của những người trong ảnh.
              </p>
              <p className="muted">
                Mọi thứ ở đây được sắp theo thời gian, theo sự kiện và theo con người, để mười năm nữa vẫn tìm lại được.
              </p>
              <Link href="/cau-chuyen" className="link-arrow">Đọc câu chuyện của lớp <Glyph name="arrow" size={16} /></Link>
            </div>
          </div>
          {introPlate ? (
            <div className="home-intro__plate" data-reveal="mask">
              <Plate asset={{ ...introPlate, caption: "Vị trí dành cho tấm ảnh cả lớp — hiện là ảnh minh hoạ." }} index="PL. 01" sizes="(min-width: 900px) 40vw, 100vw" />
            </div>
          ) : null}
        </div>
        <div className="shell">
          <ul className="stat-line home-intro__stats" data-reveal>
            <li><span className="num">{String(events.length).padStart(2, "0")}</span><span className="label">Sự kiện</span></li>
            <li><span className="num">{String(albums.length).padStart(2, "0")}</span><span className="label">Album</span></li>
            <li><span className="num">{String(photoCount).padStart(2, "0")}</span><span className="label">Ảnh</span></li>
            <li><span className="num">{String(videos.length).padStart(2, "0")}</span><span className="label">Thước phim</span></li>
            <li><span className="num">{String(articles.length).padStart(2, "0")}</span><span className="label">Bài viết</span></li>
          </ul>
        </div>
      </section>

      {/* ───────── III. Three orbits ───────── */}
      <section className="section section--tight" aria-labelledby="years-title">
        <div className="shell">
          <div className="section-head">
            <p className="eyebrow" data-reveal>Ba quỹ đạo</p>
            <h2 id="years-title" className="h2" data-reveal>Ba năm học, ba vòng quay quanh cùng một lớp.</h2>
          </div>
          <ol className="orbits">
            {site.schoolYears.map((y, i) => {
              const ev = events.filter((e) => e.schoolYear === y);
              return (
                <li key={y} className="orbits__item" data-reveal style={{ "--delay": `${i * 120}ms` } as React.CSSProperties}>
                  <Link href={`/dong-thoi-gian#nam-${y}`} className="orbits__link">
                    <span className="orbits__ring" aria-hidden="true"><span /></span>
                    <span className="coord">Lớp {10 + i}</span>
                    <span className="orbits__year display">{schoolYearLabel(y)}</span>
                    <span className="orbits__list">
                      {ev.slice(0, 3).map((e) => <span key={e.id}>{e.title}</span>)}
                    </span>
                    <span className="orbits__count small faint">{ev.length} sự kiện <Glyph name="arrow" size={14} /></span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ───────── IV. Featured memories ───────── */}
      {featuredAlbums.length ? (
        <section className="section" aria-labelledby="memories-title">
          <div className="shell">
            <div className="section-head">
              <div className="section-head__row">
                <div className="stack">
                  <p className="eyebrow eyebrow--memory" data-reveal>Thiên hà khoảnh khắc</p>
                  <h2 id="memories-title" className="h2" data-reveal>Ký ức nổi bật</h2>
                </div>
                <Link href="/ky-uc" className="link-arrow" data-reveal>Tất cả album <Glyph name="arrow" size={16} /></Link>
              </div>
            </div>
            <div className="feature-albums">
              {featuredAlbums.map((a, i) => {
                const cover = albumCover(a);
                return (
                  <Link key={a.id} href={`/ky-uc/${a.slug}`} className={`feature-albums__item feature-albums__item--${i}`} data-reveal style={{ "--delay": `${i * 90}ms` } as React.CSSProperties} data-cursor="view">
                    {cover ? <Plate asset={cover} caption={false} ratio={i === 0 ? "4 / 5" : i === 3 ? "16 / 10" : "1 / 1"} sizes="(min-width: 900px) 45vw, 100vw" /> : null}
                    <span className="feature-albums__meta">
                      <span className="coord">{formatFuzzy(a.eventDate)} · {a.assets.length} ảnh</span>
                      <span className="h3 card-title">{a.title}</span>
                      <DemoBadge item={a} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ───────── V. Milestones constellation ───────── */}
      {milestones.length ? (
        <section className="section" aria-labelledby="milestones-title">
          <div className="shell">
            <div className="section-head">
              <p className="eyebrow" data-reveal>Chòm sao cột mốc</p>
              <h2 id="milestones-title" className="h2" data-reveal>Những khoảnh khắc nối ba năm thành một đường.</h2>
            </div>
            <div className="milestones" data-reveal="fade">
              <svg className="milestones__line" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
                <path className="line-draw" style={{ "--len": 1300 } as React.CSSProperties}
                  d={milestones.map((_, i) => `${i === 0 ? "M" : "L"} ${(i + 0.5) * (1000 / milestones.length)} ${i % 2 ? 84 : 36}`).join(" ")}
                  fill="none" stroke="rgba(231,194,122,.55)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </svg>
              <ol className="milestones__list">
                {milestones.map((e, i) => {
                  const p = fuzzyParts(e.eventDate);
                  return (
                    <li key={e.id} className={i % 2 ? "is-low" : ""}>
                      <Link href={`/dong-thoi-gian/${e.slug}`} className="milestones__link">
                        <span className="milestones__star" aria-hidden="true" />
                        <span className="coord">{p.month}.{p.year}</span>
                        <span className="milestones__title">{e.title}</span>
                        <span className="small faint">{EVENT_CATEGORIES[e.category]}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>
      ) : null}

      {/* ───────── VI. Journal ───────── */}
      {lead ? (
        <section className="section" aria-labelledby="journal-title">
          <div className="shell">
            <div className="section-head">
              <div className="section-head__row">
                <div className="stack">
                  <p className="eyebrow" data-reveal>Câu chuyện từ vũ trụ</p>
                  <h2 id="journal-title" className="h2" data-reveal>Nhật ký lớp</h2>
                </div>
                <Link href="/nhat-ky" className="link-arrow" data-reveal>Mọi bài viết <Glyph name="arrow" size={16} /></Link>
              </div>
            </div>
            <div className="journal-lead">
              <Link href={`/nhat-ky/${lead.slug}`} className="journal-lead__main card-link" data-reveal>
                {lead.cover ? <Plate asset={lead.cover} caption={false} ratio="16 / 10" sizes="(min-width: 900px) 58vw, 100vw" /> : null}
                <span className="card-meta"><span>{ARTICLE_CATEGORIES[lead.category]}</span><span className="dot" /><span>{readingMinutes(lead.body)} phút đọc</span><DemoBadge item={lead} /></span>
                <span className="h2 card-title">{lead.title}</span>
                {lead.subtitle ? <span className="muted journal-lead__sub">{lead.subtitle}</span> : null}
              </Link>
              <ol className="journal-lead__list">
                {more.map((a, i) => (
                  <li key={a.id} data-reveal style={{ "--delay": `${i * 90}ms` } as React.CSSProperties}>
                    <Link href={`/nhat-ky/${a.slug}`} className="card-link journal-row">
                      <span className="coord">{String(i + 2).padStart(2, "0")}</span>
                      <span>
                        <span className="card-meta"><span>{ARTICLE_CATEGORIES[a.category]}</span><DemoBadge item={a} /></span>
                        <span className="h3 card-title">{a.title}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ) : null}

      {/* ───────── VII. Add a star ───────── */}
      <section className="section home-cta" aria-labelledby="cta-title">
        <div className="shell home-cta__inner" data-reveal>
          <span className="home-cta__star" aria-hidden="true" />
          <p className="eyebrow eyebrow--memory">Đóng góp</p>
          <h2 id="cta-title" className="display display-l">Thêm <em>một vì sao.</em></h2>
          <p className="lede">Bạn còn giữ một tấm ảnh, một đoạn video, hay một câu chuyện chưa ai kể? Gửi vào kho — ban biên tập sẽ xem trước khi xuất bản.</p>
          <div className="home-hero__ctas">
            <Link href="/dong-gop" className="btn btn--primary" data-magnetic>Gửi ký ức <Glyph name="arrow" className="arrow" /></Link>
            <Link href="/ky-yeu" className="btn" data-magnetic>Mở kỷ yếu số</Link>
          </div>
        </div>
      </section>
    </>
  );
}
