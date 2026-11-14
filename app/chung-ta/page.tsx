import type { Metadata } from "next";
import PageHero from "@/components/content/PageHero";
import PeopleConstellation, { type PersonStar } from "@/components/people/PeopleConstellation";
import { publicPeople } from "@/lib/queries";

export const metadata: Metadata = { title: "Chúng ta", description: "Chòm sao của lớp 12A3 — những người đã cùng nhau đi qua ba năm học." };
export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const { people, withheld } = await publicPeople();
  const stars: PersonStar[] = people.map((p) => ({ id: p.id, slug: p.slug, name: p.title, group: p.group ?? p.subject, full: p.exposure === "full", role: p.role }));
  return (
    <>
      <PageHero eyebrow="Chòm sao của chúng ta" title={<>Chúng <em>ta</em></>}
        lede="Mỗi người tự chọn mình xuất hiện thế nào: đầy đủ, hạn chế, hoặc không xuất hiện. Kho lưu trữ không bao giờ hiển thị thông tin liên lạc hay họ tên đầy đủ."
        aside={<p className="demo-strip"><span><strong>Hồ sơ mẫu.</strong> Tên hiển thị như “Thành viên 01” là chỗ giữ chỗ cho đến khi từng người tự xác nhận hồ sơ của mình.</span></p>} />
      <div className="shell"><PeopleConstellation people={stars} withheld={withheld} /></div>
    </>
  );
}
