import type { Metadata } from "next";
import PageHero from "@/components/content/PageHero";
import ContributeForm from "@/components/contribute/ContributeForm";

export const metadata: Metadata = { title: "Đóng góp", description: "Gửi ảnh, video, câu chuyện hoặc yêu cầu gỡ cho kho lưu trữ 12A3." };

export default async function ContributePage({ searchParams }: { searchParams: Promise<{ loai?: string; ref?: string }> }) {
  const { loai, ref } = await searchParams;
  return (
    <>
      <PageHero eyebrow="Đóng góp" title={<>Thêm <em>một vì sao</em></>}
        lede="Gửi một ký ức vào kho chung. Mọi bài gửi đều được ban biên tập xem trước — không có gì tự động xuất hiện trên trang."
        aside={
          <ol className="steps">
            <li><span className="num">01</span> Bạn gửi</li>
            <li><span className="num">02</span> Ban biên tập kiểm tra trùng lặp, thông tin, quyền</li>
            <li><span className="num">03</span> Hỏi ý người trong ảnh nếu cần</li>
            <li><span className="num">04</span> Xuất bản</li>
          </ol>
        } />
      <div className="shell contribute-shell"><ContributeForm initialType={loai} refSlug={ref?.slice(0, 80)} /></div>
    </>
  );
}
