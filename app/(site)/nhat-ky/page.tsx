import type { Metadata } from "next";
import PageHero from "@/components/content/PageHero";
import { ArticleCard, CategoryChips } from "@/components/content/ArticleList";
import { publicArticles } from "@/lib/queries";

export const metadata: Metadata = { title: "Nhật ký lớp", description: "Bài viết, phỏng vấn, tri ân và suy ngẫm của lớp 12A3." };
export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const articles = await publicArticles();
  const counts = articles.reduce<Record<string, number>>((m, a) => ({ ...m, [a.category]: (m[a.category] ?? 0) + 1 }), {});
  const lead = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a.id !== lead?.id);
  return (
    <>
      <PageHero eyebrow="Câu chuyện từ vũ trụ" title={<>Nhật ký <em>lớp</em></>}
        lede="Những bài viết dài hơn một dòng trạng thái: chuyện lớp, lời tri ân, phỏng vấn, và những lần nhìn lại." />
      <div className="shell">
        <div className="filter-bar"><CategoryChips counts={counts} /></div>
        {lead ? <div className="journal-top"><ArticleCard a={lead} large /></div> : <div className="empty"><p className="h3">Chưa có bài viết</p></div>}
        <div className="article-grid">{rest.map((a, i) => <ArticleCard key={a.id} a={a} i={i} />)}</div>
      </div>
    </>
  );
}
