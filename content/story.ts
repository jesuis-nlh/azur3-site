/**
 * "Câu chuyện" chapters. The prose describes the shape of a three-year
 * journey without asserting specific facts; concrete history comes from the
 * linked timeline records (`schoolYear` / `categories`). Edit freely once the
 * class has written its own words.
 */
export interface Chapter {
  id: string;
  numeral: string;
  kicker: string;
  title: string;
  /** italic accent appended to the title */
  accent?: string;
  body: string[];
  schoolYear?: string;
  categories?: string[];
  plate?: number;
}

export const chapters: Chapter[] = [
  {
    id: "khoi-dau", numeral: "I", kicker: "Mùa thu 2022", title: "Khởi đầu", accent: "những người lạ",
    body: [
      "Mọi lớp học đều bắt đầu như nhau: một danh sách tên, một căn phòng, những chỗ ngồi chưa ai quen. Điều làm nên 12A3 không có trong danh sách ấy — nó đến sau, từng ngày một.",
      "Chương này dành cho những tuần đầu tiên: ai là người bắt chuyện trước, buổi sinh hoạt lớp đầu tiên ra sao, và khoảnh khắc nào khiến căn phòng bắt đầu giống một lớp.",
    ],
    schoolYear: "2022-2023", plate: 2,
  },
  {
    id: "chuyen-giao", numeral: "II", kicker: "Năm học 2022–2023", title: "Những lần chuyển giao",
    body: [
      "Năm đầu là năm của thói quen mới: lịch học, những môn chuyên, nhịp kiểm tra. Có những điều thay đổi lặng lẽ — một nhóm bạn hình thành, một người bắt đầu đảm nhận việc chung.",
      "Những cột mốc ở đây được lấy từ dòng thời gian. Khi một sự kiện chưa có ngày chính xác, kho lưu trữ ghi theo tháng hoặc năm thay vì đoán.",
    ],
    schoolYear: "2022-2023",
  },
  {
    id: "nhung-nam-hoc", numeral: "III", kicker: "Năm học 2023–2024", title: "Những năm học", accent: "đáng nhớ",
    body: [
      "Năm giữa thường là năm dài nhất trong ký ức: đủ quen để dám làm điều mới, chưa đủ gần để lo chuyện chia xa.",
      "Đây là nơi cho những chuyến đi, những tiết mục, những trận đấu và những buổi chiều bình thường mà về sau ai cũng nhắc.",
    ],
    schoolYear: "2023-2024", plate: 11,
  },
  {
    id: "hoat-dong", numeral: "IV", kicker: "Xuyên suốt ba năm", title: "Hoạt động lớp",
    body: [
      "Không phải hoạt động nào cũng có giải thưởng. Phần lớn chỉ là những lần cả lớp cùng làm một việc — chuẩn bị một tiết mục, trang trí một góc lớp, góp tiền mua một món quà.",
      "Ảnh và video của những dịp này được sắp trong mục Ký ức và Thước phim, mỗi album gắn với sự kiện của nó.",
    ],
    categories: ["class", "performance", "trip", "extracurricular"],
  },
  {
    id: "thanh-tich", numeral: "V", kicker: "Ghi nhận", title: "Thành tích", accent: "đã xác minh",
    body: [
      "Kho lưu trữ chỉ ghi một thành tích là sự thật khi có nguồn: giấy khen, thông báo của trường, bài báo, hoặc xác nhận của người trong cuộc.",
      "Những gì chưa xác minh vẫn được giữ, nhưng được đánh dấu rõ ràng — để ký ức không bị phóng đại theo thời gian.",
    ],
    categories: ["competition", "academic"],
  },
  {
    id: "tot-nghiep", numeral: "VI", kicker: "Mùa hè 2025", title: "Tốt nghiệp",
    body: [
      "Năm cuối đi nhanh hơn hai năm trước cộng lại. Chụp kỷ yếu, lễ tri ân, những ngày ôn thi, rồi một buổi sáng tất cả bước ra khỏi cổng trường lần cuối với tư cách học sinh.",
      "Chương này giữ những khoảnh khắc khép lại — và lời tạm biệt mà mỗi người muốn để lại.",
    ],
    schoolYear: "2024-2025", plate: 15,
  },
  {
    id: "sau-tot-nghiep", numeral: "VII", kicker: "Từ 2025", title: "Sau tốt nghiệp", accent: "vẫn là một lớp",
    body: [
      "Câu chuyện không dừng ở lễ bế giảng. Chương này để ngỏ cho những cập nhật mà các thành viên tự nguyện chia sẻ: đang học ở đâu, đang làm gì, lần gặp lại gần nhất.",
      "Không ai bắt buộc phải xuất hiện ở đây. Mỗi dòng cập nhật chỉ được đăng khi chính người đó gửi và đồng ý.",
    ],
  },
];
