import type { Metadata } from "next";
import PageHero from "@/components/content/PageHero";
import TimelineView, { type TimelineEntry } from "@/components/timeline/TimelineView";
import { eventRelations, publicEvents } from "@/lib/queries";
import { formatFuzzy, fuzzyParts } from "@/lib/dates";
import { schoolYearLabel, site } from "@/lib/site";
import { EVENT_CATEGORIES } from "@/lib/types";
import { excerpt } from "@/lib/text";

export const metadata: Metadata = { title: "Dòng thời gian", description: "Hành trình ba năm của 12A3, theo năm học, tháng và sự kiện." };
export const dynamic = "force-dynamic";

const MONTH_NAMES = ["", "Th.1", "Th.2", "Th.3", "Th.4", "Th.5", "Th.6", "Th.7", "Th.8", "Th.9", "Th.10", "Th.11", "Th.12"];

export default async function TimelinePage() {
  const events = await publicEvents();
  const entries: TimelineEntry[] = await Promise.all(events.map(async (e) => {
    const rel = await eventRelations(e);
    const p = fuzzyParts(e.eventDate);
    return {
      id: e.id, slug: e.slug, title: e.title,
      description: excerpt(e.description ?? "", 170),
      schoolYear: e.schoolYear, category: e.category, categoryLabel: EVENT_CATEGORIES[e.category],
      dateLabel: formatFuzzy(e.eventDate),
      day: p.day, month: p.month === "··" ? "—" : MONTH_NAMES[Number(p.month)], year: p.year,
      milestone: !!e.milestone, demo: !!e.demo, tags: e.tags,
      counts: { photos: rel.albums.reduce((n, a) => n + a.assets.length, 0), videos: rel.videos.length, articles: rel.articles.length },
    };
  }));
  const categories = Object.entries(EVENT_CATEGORIES)
    .map(([id, label]) => ({ id, label, count: events.filter((e) => e.category === id).length }))
    .filter((c) => c.count > 0);
  const years = site.schoolYears.map((y, i) => ({ id: y, label: schoolYearLabel(y), grade: `Lớp ${10 + i}` }));

  return (
    <>
      <PageHero
        eyebrow="Hành trình xuyên thời gian"
        title={<>Dòng <em>thời gian</em></>}
        lede="Mỗi năm học là một hành tinh, mỗi sự kiện là một vì sao trên quỹ đạo của nó. Chọn một năm, lọc theo loại, hoặc tìm theo từ khoá."
      />
      <div className="shell">
        <TimelineView entries={entries} years={years} categories={categories} />
      </div>
    </>
  );
}
