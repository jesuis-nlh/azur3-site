import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/content/PageHero";
import { ArticleCard, CategoryChips } from "@/components/content/ArticleList";
import { publicArticles } from "@/lib/queries";
import { ARTICLE_CATEGORIES, type ArticleCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const c = (await params).category as ArticleCategory;
  return { title: ARTICLE_CATEGORIES[c] ?? "Chuyên mục" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const c = (await params).category;
  if (!(c in ARTICLE_CATEGORIES)) notFound();
  const all = await publicArticles();
  const counts = all.reduce<Record<string, number>>((m, a) => ({ ...m, [a.category]: (m[a.category] ?? 0) + 1 }), {});
  const list = all.filter((a) => a.category === c);
  return (
    <>
      <PageHero eyebrow="Nhật ký lớp · Chuyên mục" title={ARTICLE_CATEGORIES[c as ArticleCategory]} />
      <div className="shell">
        <div className="filter-bar"><CategoryChips current={c} counts={counts} /></div>
        {list.length ? <div className="article-grid">{list.map((a, i) => <ArticleCard key={a.id} a={a} i={i} />)}</div>
          : <div className="empty"><p className="h3">Chuyên mục này chưa có bài</p><p>Bạn có thể là người viết bài đầu tiên.</p></div>}
      </div>
    </>
  );
}
