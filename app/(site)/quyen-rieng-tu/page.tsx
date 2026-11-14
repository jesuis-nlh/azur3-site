import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/content/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Quyền riêng tư", description: "Cách kho lưu trữ 12A3 thu thập, hiển thị và gỡ bỏ thông tin cá nhân." };

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Chính sách" title={<>Quyền <em>riêng tư</em></>} lede="Một kho lưu trữ về con người phải bắt đầu từ sự đồng ý của chính những con người ấy." />
      <div className="shell">
        <div className="prose prose--policy">
          <p className="notice">Đây là chính sách vận hành của một dự án lưu trữ phi thương mại do thành viên lớp tự quản lý. Nó <strong>không phải ý kiến pháp lý</strong> và chưa được luật sư thẩm định. Văn bản dẫn chiếu bên dưới đã được tra cứu vào tháng 11/2026; hãy kiểm tra lại văn bản chính thức trước khi dựa vào.</p>

          <h2 id="nguyen-tac">Nguyên tắc</h2>
          <ul>
            <li><strong>Thu thập tối thiểu.</strong> Kho chỉ lưu tên hiển thị, nội dung bạn gửi và — nếu bạn tự nguyện cung cấp — một cách liên hệ để ban biên tập hỏi lại. Không lưu số điện thoại, địa chỉ hay ngày sinh.</li>
            <li><strong>Không tự động xuất bản.</strong> Mọi bài gửi vào hàng chờ duyệt. Ảnh có người thấy rõ mặt chỉ được đăng khi những người đó đồng ý.</li>
            <li><strong>Công khai trên mạng ≠ được phép đăng lại.</strong> Một tấm ảnh từng công khai trên Facebook không mặc nhiên được đăng lại ở đây.</li>
            <li><strong>Bạn quyết định hồ sơ của mình.</strong> Mỗi người chọn hiển thị đầy đủ, hạn chế (chỉ là một vì sao không tên) hoặc không xuất hiện. Họ tên đầy đủ và thông tin liên lạc không bao giờ được hiển thị công khai.</li>
            <li><strong>Không bịa đặt.</strong> Ngày tháng, chú thích, danh tính không chắc chắn được đánh dấu “cần xác minh”; thành tích chỉ ghi là sự thật khi có nguồn.</li>
          </ul>

          <h2 id="phan-loai">Bốn loại nội dung</h2>
          <ol>
            <li><strong>Công khai</strong> — đã duyệt, đã có sự đồng ý, ai cũng xem được.</li>
            <li><strong>Hạn chế</strong> — chỉ ban biên tập xem được; hồ sơ hạn chế xuất hiện như một vì sao không tên.</li>
            <li><strong>Ẩn / lưu trữ nội bộ</strong> — được giữ để bảo tồn nhưng không hiển thị.</li>
            <li><strong>Bài gửi chưa duyệt</strong> — chỉ ban biên tập xem được, file gốc không bao giờ được phục vụ công khai.</li>
          </ol>

          <h2 id="go-bo">Yêu cầu gỡ hoặc sửa</h2>
          <p>Bất kỳ ai xuất hiện trong kho — kể cả người không phải thành viên lớp — đều có thể yêu cầu gỡ ảnh, ẩn hồ sơ, sửa chú thích hoặc rút lại sự đồng ý. Dùng loại <Link href="/dong-gop?loai=removal">“Yêu cầu gỡ”</Link> trong mục Đóng góp; yêu cầu này không cần mã đóng góp và được xử lý ưu tiên. Trong lúc xem xét, nội dung liên quan đến quyền riêng tư sẽ được ẩn trước.</p>

          <h2 id="ky-thuat">Biện pháp kỹ thuật</h2>
          <ul>
            <li>Ảnh hiển thị trên trang là bản xem trước đã loại bỏ dữ liệu EXIF (bao gồm toạ độ GPS). File gốc chỉ ban biên tập truy cập được.</li>
            <li>Trang quản trị yêu cầu đăng nhập, phiên được ký bằng khoá bí mật và hết hạn sau 8 giờ.</li>
            <li>Video YouTube/Vimeo chỉ được tải khi bạn bấm phát, dùng chế độ hạn chế cookie.</li>
            <li>Trang không dùng công cụ phân tích hay quảng cáo của bên thứ ba.</li>
            <li>Dữ liệu được lưu ở định dạng mở (JSON và file ảnh gốc) để sao lưu và chuyển đổi lâu dài.</li>
          </ul>

          <h2 id="phap-ly">Văn bản tham chiếu</h2>
          <ul>
            <li><strong>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15</strong>, thông qua ngày 26/6/2025, có hiệu lực từ 01/01/2026, và <strong>Nghị định 356/2025/NĐ-CP</strong> hướng dẫn thi hành — quy định quyền được biết, đồng ý, truy cập, chỉnh sửa, xoá dữ liệu và rút lại sự đồng ý.</li>
            <li><strong>Bộ luật Dân sự 2015, Điều 32</strong> — quyền của cá nhân đối với hình ảnh: việc sử dụng hình ảnh của người khác cần sự đồng ý của người đó.</li>
            <li><strong>Luật Sở hữu trí tuệ</strong> — quyền tác giả thuộc về người chụp ảnh, quay video hoặc viết bài; kho lưu trữ ghi công và chỉ đăng khi tác giả cho phép.</li>
          </ul>
          <p>Kho lưu trữ cố gắng vận hành theo tinh thần của các văn bản trên, nhưng <strong>không tuyên bố đã tuân thủ đầy đủ</strong> về mặt pháp lý.</p>

          <h2 id="luu-tru">Lưu giữ và sao lưu</h2>
          <p>Nội dung đã xuất bản được giữ lâu dài như một kho lưu trữ lịch sử của lớp, trừ khi có yêu cầu gỡ. Bài gửi bị từ chối và file gốc của chúng nên được xoá định kỳ bởi ban biên tập (xem tài liệu vận hành). Bản sao lưu được giữ ngoài máy chủ chính.</p>

          <h2 id="lien-he">Người chịu trách nhiệm</h2>
          <p>Kho lưu trữ do ban biên tập là thành viên lớp {site.className}, {site.school}, khoá {site.cohort.start}–{site.cohort.end} quản lý. Liên hệ qua <Link href="/dong-gop?loai=correction">mục Đóng góp</Link>.</p>
        </div>
      </div>
    </>
  );
}
