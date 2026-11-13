import "server-only";
import { readDb } from "./store";
import { isPublic, profileExposure } from "./governance";
import { fuzzySortKey } from "./dates";
import { excerpt, foldVietnamese } from "./text";
import type { Album, Article, LegacyItem, MediaAsset, Profile, TimelineEvent, VideoItem } from "./types";
import { ARTICLE_CATEGORIES, EVENT_CATEGORIES, VIDEO_CATEGORIES } from "./types";

const byDateAsc = <T extends { eventDate?: { value: string; precision: "year" | "month" | "day" } }>(a: T, b: T) =>
  fuzzySortKey(a.eventDate).localeCompare(fuzzySortKey(b.eventDate));
const byPublishedDesc = (a: Article, b: Article) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

export async function publicEvents(): Promise<TimelineEvent[]> {
  return (await readDb()).events.filter(isPublic).sort(byDateAsc);
}
export async function publicAlbums(): Promise<Album[]> {
  return (await readDb()).albums.filter(isPublic).sort(byDateAsc);
}
export async function publicVideos(): Promise<VideoItem[]> {
  return (await readDb()).videos.filter(isPublic).sort(byDateAsc);
}
export async function publicArticles(): Promise<Article[]> {
  return (await readDb()).articles.filter(isPublic).sort(byPublishedDesc);
}
export async function publicLegacy(): Promise<LegacyItem[]> {
  return (await readDb()).legacy.filter(isPublic).sort(byDateAsc);
}

export type PublicProfile = Profile & { exposure: "full" | "limited" };

/** Strips everything a person did not opt to show. */
export function redactProfile(p: Profile): PublicProfile | null {
  const exposure = profileExposure(p);
  if (exposure === "none") return null;
  if (exposure === "limited") {
    return {
      ...p,
      exposure,
      fullName: undefined,
      bio: undefined,
      memory: undefined,
      portrait: undefined,
      description: undefined,
      people: [],
      title: p.role === "teacher" ? "Thầy cô" : "Một thành viên",
    };
  }
  return {
    ...p,
    exposure,
    portrait: p.showPortrait ? p.portrait : undefined,
    bio: p.showBio ? p.bio : undefined,
    fullName: undefined, // full legal names are never shown publicly; the display name is the title
  };
}

export async function publicPeople(): Promise<{ people: PublicProfile[]; withheld: number }> {
  const all = (await readDb()).profiles;
  const people = all.map(redactProfile).filter((p): p is PublicProfile => p !== null);
  return { people, withheld: all.length - people.length };
}

export async function eventBySlug(slug: string) {
  return (await publicEvents()).find((e) => e.slug === slug) ?? null;
}
export async function albumBySlug(slug: string) {
  return (await publicAlbums()).find((a) => a.slug === slug) ?? null;
}
export async function videoBySlug(slug: string) {
  return (await publicVideos()).find((v) => v.slug === slug) ?? null;
}
export async function articleBySlug(slug: string) {
  return (await publicArticles()).find((a) => a.slug === slug) ?? null;
}
export async function personBySlug(slug: string) {
  const { people } = await publicPeople();
  const p = people.find((x) => x.slug === slug);
  return p && p.exposure === "full" ? p : null;
}

export function albumCover(a: Album): MediaAsset | undefined {
  return a.assets.find((x) => x.id === a.coverId) ?? a.assets[0];
}

/** Resolves an event's related records, keeping only public ones. */
export async function eventRelations(e: TimelineEvent) {
  const [albums, videos, articles] = await Promise.all([publicAlbums(), publicVideos(), publicArticles()]);
  return {
    albums: albums.filter((a) => e.albumIds.includes(a.id) || a.eventId === e.id),
    videos: videos.filter((v) => e.videoIds.includes(v.id) || v.eventId === e.id),
    articles: articles.filter((a) => e.articleIds.includes(a.id)),
  };
}

export async function relatedArticles(a: Article, limit = 3) {
  const all = (await publicArticles()).filter((x) => x.id !== a.id);
  const score = (x: Article) => (x.category === a.category ? 2 : 0) + x.tags.filter((t) => a.tags.includes(t)).length;
  return all.sort((x, y) => score(y) - score(x)).slice(0, limit);
}

export async function eventsForArticle(a: Article) {
  return (await publicEvents()).filter((e) => e.articleIds.includes(a.id));
}

/* ───────────── Search ───────────── */

export interface SearchHit {
  type: "event" | "album" | "video" | "article" | "person" | "legacy";
  typeLabel: string;
  title: string;
  href: string;
  snippet: string;
  meta?: string;
  thumb?: string;
}

export async function searchIndex(): Promise<(SearchHit & { haystack: string })[]> {
  const [events, albums, videos, articles, { people }, legacy] = await Promise.all([
    publicEvents(), publicAlbums(), publicVideos(), publicArticles(), publicPeople(), publicLegacy(),
  ]);
  const hits: (SearchHit & { haystack: string })[] = [];
  const add = (h: SearchHit, extra: string) => hits.push({ ...h, haystack: foldVietnamese(`${h.title} ${h.snippet} ${extra}`) });

  events.forEach((e) => add({ type: "event", typeLabel: "Sự kiện", title: e.title, href: `/dong-thoi-gian/${e.slug}`, snippet: excerpt(e.description ?? "", 140), meta: EVENT_CATEGORIES[e.category] }, `${e.tags.join(" ")} ${e.schoolYear} ${e.location ?? ""}`));
  albums.forEach((a) => add({ type: "album", typeLabel: "Album", title: a.title, href: `/ky-uc/${a.slug}`, snippet: excerpt(a.description ?? "", 140), meta: `${a.assets.length} ảnh`, thumb: albumCover(a)?.thumb }, `${a.tags.join(" ")} ${a.assets.map((x) => `${x.caption ?? ""} ${x.photographer ?? ""}`).join(" ")}`));
  videos.forEach((v) => add({ type: "video", typeLabel: "Video", title: v.title, href: `/thuoc-phim/${v.slug}`, snippet: excerpt(v.description ?? "", 140), meta: VIDEO_CATEGORIES[v.category], thumb: v.poster?.thumb }, v.tags.join(" ")));
  articles.forEach((a) => add({ type: "article", typeLabel: "Bài viết", title: a.title, href: `/nhat-ky/${a.slug}`, snippet: a.subtitle ?? excerpt(a.body, 140), meta: ARTICLE_CATEGORIES[a.category], thumb: a.cover?.thumb }, `${a.body} ${a.author} ${a.tags.join(" ")}`));
  people.filter((p) => p.exposure === "full").forEach((p) => add({ type: "person", typeLabel: p.role === "teacher" ? "Thầy cô" : "Thành viên", title: p.title, href: `/chung-ta/${p.slug}`, snippet: p.bio ?? "", meta: p.group ?? p.subject }, ""));
  legacy.forEach((l) => add({ type: "legacy", typeLabel: "Di sản", title: l.title, href: `/di-san#${l.slug}`, snippet: excerpt(l.description ?? "", 140) }, ""));
  return hits;
}

export async function search(q: string, type?: string): Promise<SearchHit[]> {
  const terms = foldVietnamese(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const idx = await searchIndex();
  return idx
    .filter((h) => (!type || h.type === type) && terms.every((t) => h.haystack.includes(t)))
    .map((h) => {
      const title = foldVietnamese(h.title);
      const score = terms.reduce((s, t) => s + (title.includes(t) ? 3 : 1), 0);
      return { h, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 60)
    .map(({ h: { haystack: _ignored, ...hit } }) => hit);
}
