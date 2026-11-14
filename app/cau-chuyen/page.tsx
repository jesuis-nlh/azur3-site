import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/content/PageHero";
import Plate from "@/components/content/Plate";
import DemoBadge from "@/components/ui/DemoBadge";
import Glyph from "@/components/ui/Glyph";
import { chapters } from "@/content/story";
import { publicEvents } from "@/lib/queries";
import { formatFuzzy } from "@/lib/dates";
import plates from "@/content/demo-plates.json";

export const metadata: Metadata = { title: "Câu chuyện", description: "Hành trình của lớp 12A3 từ ngày đầu đến sau tốt nghiệp." };
export const dynamic = "force-dynamic";

export default async function StoryPage() {
  const events = await publicEvents();
  return (
    <>
      <PageHero
        eyebrow="Câu chuyện của lớp"
        title={<>Bảy chương <em>của một bầu trời.</em></>}
        lede="Từ ngày đầu tiên đến những năm sau tốt nghiệp — kể theo thứ tự, nối với những gì kho lưu trữ đã ghi lại."
        aside={<p className="demo-strip"><span><strong>Bản khung.</strong> Lời kể ở đây mô tả hình dáng chung của hành trình, không khẳng định sự kiện cụ thể. Các sự kiện bên dưới đến từ dòng thời gian và được đánh dấu nếu là mẫu.</span></p>}
      />

      <div className="shell story">
        <nav className="story__toc" aria-label="Các chương">
          <ol>
            {chapters.map((c) => (
              <li key={c.id}><a href={`#${c.id}`}><span className="num">{c.numeral}</span> {c.title}</a></li>
            ))}
          </ol>
        </nav>

        <div className="story__chapters">
          {chapters.map((c, idx) => {
            const linked = events.filter((e) =>
              (c.schoolYear && e.schoolYear === c.schoolYear && (!c.categories || c.categories.includes(e.category))) ||
              (!c.schoolYear && c.categories?.includes(e.category)));
            const p = c.plate ? plates[c.plate - 1] : null;
            return (
              <article key={c.id} id={c.id} className={`chapter${idx % 2 ? " chapter--alt" : ""}`} aria-labelledby={`${c.id}-t`}>
                <header className="chapter__head" data-reveal>
                  <span className="chapter__numeral display" aria-hidden="true">{c.numeral}</span>
                  <p className="eyebrow">{c.kicker}</p>
                  <h2 id={`${c.id}-t`} className="h1">{c.title}{c.accent ? <> <em>{c.accent}</em></> : null}</h2>
                </header>
                <div className="chapter__body" data-reveal style={{ "--delay": "100ms" } as React.CSSProperties}>
                  {c.body.map((para, i) => <p key={i} className={i === 0 ? "chapter__first" : "muted"}>{para}</p>)}
                </div>
                {p ? (
                  <div className="chapter__plate" data-reveal="mask">
                    <Plate asset={{ id: p.name, src: `/media/demo/${p.name}.webp`, preview: `/media/demo/${p.name}.webp`, thumb: `/media/demo/${p.name}-thumb.webp`, width: p.width, height: p.height, tone: p.tone, alt: "Ảnh minh hoạ trừu tượng", caption: "Ảnh minh hoạ — vị trí cho một tấm ảnh của chương này.", demo: true }} index={`PL. ${c.numeral}`} />
                  </div>
                ) : null}
                {linked.length ? (
                  <ul className="chapter__events" aria-label={`Sự kiện của chương ${c.numeral}`}>
                    {linked.map((e) => (
                      <li key={e.id} data-reveal>
                        <Link href={`/dong-thoi-gian/${e.slug}`} className="chapter__event">
                          <span className="coord">{formatFuzzy(e.eventDate)}</span>
                          <span className="chapter__event-title">{e.title}</span>
                          <DemoBadge item={e} />
                          <Glyph name="arrow" size={16} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : c.id === "sau-tot-nghiep" ? (
                  <p className="notice">Chưa có cập nhật nào. <Link href="/dong-gop?loai=memory">Gửi cập nhật của bạn</Link> — chỉ đăng khi bạn đồng ý.</p>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
