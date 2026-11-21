import type { Metadata } from "next";
import PageHero from "@/components/content/PageHero";
import Yearbook, { type Spread } from "@/components/yearbook/Yearbook";
import { albumCover, publicAlbums, publicArticles, publicEvents, publicPeople } from "@/lib/queries";
import { formatFuzzy } from "@/lib/dates";
import { schoolYearLabel, site } from "@/lib/site";

export const metadata: Metadata = { title: "Kỷ yếu số", description: "Kỷ yếu tương tác của lớp 12A3 — lật từng trang như một cuốn sách." };
export const dynamic = "force-dynamic";

export default async function YearbookPage() {
  const [events, albums, articles, { people, withheld }] = await Promise.all([publicEvents(), publicAlbums(), publicArticles(), publicPeople()]);
  const img = (n: number) => {
    const a = albums[n % Math.max(1, albums.length)];
    const c = a ? albumCover(a) : undefined;
    return c ? { src: c.preview ?? c.src, thumb: c.thumb, width: c.width, alt: c.alt, caption: c.caption, tone: c.tone } : undefined;
  };
  const roman = ["I", "II", "III"];

  const spreads: Spread[] = [
    {
      id: "bia", chapter: "Bìa", kicker: `${site.school} · ${site.city}`, title: site.className, accent: `${site.cohort.start}–${site.cohort.end}`,
      text: ["Kỷ yếu số của một lớp học. Mở từng trang để đi qua ba năm, theo đúng thứ tự chúng đã diễn ra.", "Mọi trang đều lấy nội dung từ kho lưu trữ — khi kho được bổ sung tư liệu thật, kỷ yếu cũng thay đổi theo."],
      image: img(0),
    },
    {
      id: "loi-mo-dau", chapter: "Lời mở đầu", kicker: "Trước khi lật trang", title: "Ba năm,", accent: "một bầu trời",
      text: ["Một cuốn kỷ yếu in thường dừng lại ở ngày tốt nghiệp. Cuốn này thì không: nó lớn lên mỗi khi có người gửi thêm một ký ức.", "Những trang dưới đây đi theo ba năm học, rồi đến những con người, những tấm ảnh và lời cuối."],
      cta: { label: "Đọc câu chuyện đầy đủ", href: "/cau-chuyen" },
    },
    ...site.schoolYears.map((y, n): Spread => {
      const ev = events.filter((e) => e.schoolYear === y);
      return {
        id: `nam-${y}`, chapter: `${roman[n]}. Năm ${schoolYearLabel(y)}`, kicker: `Lớp ${10 + n}`, title: schoolYearLabel(y),
        text: [ev.length ? `${ev.length} sự kiện được ghi lại trong năm học này.` : "Năm học này chưa có sự kiện nào được ghi lại.", "Chọn một sự kiện để xem ảnh, video và lời kể liên quan."],
        image: img(n + 1),
        list: ev.map((e) => ({ label: e.title, href: `/dong-thoi-gian/${e.slug}`, meta: formatFuzzy(e.eventDate) })),
      };
    }),
    {
      id: "chung-ta", chapter: "Chúng ta", kicker: "Chòm sao", title: "Những người", accent: "đã ở đó",
      text: [`${people.filter((p) => p.role === "student").length} vì sao hiện trong chòm sao của lớp${withheld ? `, ${withheld} người chọn không xuất hiện` : ""}.`, "Mỗi người tự quyết định mình hiện diện thế nào trong kỷ yếu."],
      list: people.filter((p) => p.exposure === "full").slice(0, 8).map((p) => ({ label: p.title, href: `/chung-ta/${p.slug}`, meta: p.group ?? p.subject })),
      cta: { label: "Xem cả chòm sao", href: "/chung-ta" },
    },
    {
      id: "ky-uc", chapter: "Ký ức", kicker: "Thiên hà khoảnh khắc", title: "Những tấm ảnh",
      text: [`${albums.reduce((n, a) => n + a.assets.length, 0)} ảnh trong ${albums.length} album.`],
      thumbs: albums.slice(0, 4).map((a) => { const c = albumCover(a)!; return { src: c.thumb ?? c.src, alt: c.alt, href: `/ky-uc/${a.slug}` }; }),
      cta: { label: "Mở kho ảnh", href: "/ky-uc" },
    },
    {
      id: "loi-cuoi", chapter: "Lời cuối", kicker: "Chưa phải trang cuối", title: "Còn trống", accent: "một trang",
      text: ["Trang này dành cho điều bạn muốn thêm vào: một tấm ảnh, một đoạn video, một câu chuyện chưa ai kể."],
      list: articles.slice(0, 2).map((a) => ({ label: a.title, href: `/nhat-ky/${a.slug}` })),
      cta: { label: "Thêm một vì sao", href: "/dong-gop" },
      image: img(5),
    },
  ];

  return (
    <>
      <PageHero eyebrow="Kỷ yếu tương tác" title={<>Kỷ yếu <em>số</em></>} lede="Lật từng trang như một cuốn sách in — nhưng là cuốn sách vẫn đang được viết tiếp." />
      <div className="shell"><Yearbook spreads={spreads} /></div>
    </>
  );
}
