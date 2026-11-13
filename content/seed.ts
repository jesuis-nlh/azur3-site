/**
 * Seed archive.
 *
 * IMPORTANT — honesty rules for this file:
 * - Records with `demo: true` are STRUCTURAL PLACEHOLDERS. They show how the
 *   archive works and are labelled "Mẫu" on the site. They are not claims
 *   about what happened in 12A3. Replace them via /admin or the importer.
 * - Dates on demo records use month or year precision only, and are typical
 *   points of a Vietnamese school year (e.g. 20/11 is Vietnamese Teachers'
 *   Day), not verified class history.
 * - Records without `demo` are texts about the archive project itself.
 */
import type {
  Album, ArchiveDB, Article, FuzzyDate, LegacyItem, MediaAsset, Profile, TimelineEvent, VideoItem,
} from "@/lib/types";
import plates from "./demo-plates.json";

const NOW = "2026-11-13T00:00:00.000Z";

const demoGov = {
  status: "published" as const,
  visibility: "public" as const,
  consent: "not_required" as const,
  review: "needs_review" as const,
  demo: true,
};
const projectGov = {
  status: "published" as const,
  visibility: "public" as const,
  consent: "not_required" as const,
  review: "verified" as const,
};

function plate(n: number, alt: string, caption?: string): MediaAsset {
  const p = plates[(n - 1) % plates.length];
  return {
    id: `demo-${p.name}`,
    src: `/media/demo/${p.name}.webp`,
    preview: `/media/demo/${p.name}.webp`,
    thumb: `/media/demo/${p.name}-thumb.webp`,
    width: p.width,
    height: p.height,
    tone: p.tone,
    alt,
    caption: caption ?? "Ảnh minh hoạ trừu tượng — chờ ảnh gốc của lớp.",
    photographer: "Ảnh minh hoạ do kho lưu trữ tạo",
    source: { kind: "project", note: "Ảnh giữ chỗ, không mô tả sự kiện thật" },
    demo: true,
  };
}

const m = (value: string): FuzzyDate => ({ value, precision: "month" });
const y = (value: string): FuzzyDate => ({ value, precision: "year" });

function base(id: string, slug: string, title: string, extra: Partial<TimelineEvent> = {}) {
  return { id, slug, title, tags: [], people: [], createdAt: NOW, updatedAt: NOW, ...extra };
}

/* ───────────────────────── Timeline ───────────────────────── */

const ev = (
  id: string, slug: string, title: string, date: FuzzyDate, schoolYear: string,
  category: TimelineEvent["category"], description: string,
  rel: Partial<Pick<TimelineEvent, "albumIds" | "videoIds" | "articleIds" | "milestone" | "tags">> = {},
): TimelineEvent => ({
  ...base(id, slug, title),
  ...demoGov,
  eventDate: date,
  schoolYear,
  category,
  description,
  albumIds: rel.albumIds ?? [],
  videoIds: rel.videoIds ?? [],
  articleIds: rel.articleIds ?? [],
  milestone: rel.milestone,
  tags: rel.tags ?? [],
  source: { kind: "manual", note: "Khung sự kiện mẫu" },
  uncertain: ["eventDate", "description"],
});

const events: TimelineEvent[] = [
  ev("ev-01", "ngay-dau-tien", "Ngày đầu tiên của 12A3", m("2022-09"), "2022-2023", "ceremony",
    "Khung sự kiện cho buổi lớp lần đầu có mặt đủ trong một căn phòng. Hãy thêm ảnh, danh sách những ai nhớ được chuyện hôm ấy và một đoạn kể ngắn.",
    { milestone: true, albumIds: ["al-01"], tags: ["khởi đầu"] }),
  ev("ev-02", "tri-an-20-11-2022", "Ngày Nhà giáo Việt Nam 20/11", m("2022-11"), "2022-2023", "celebration",
    "20/11 là dịp tri ân thầy cô trên khắp Việt Nam. Khung này chờ những tấm thiệp, tiết mục hay lời chúc mà lớp đã dành cho thầy cô năm ấy.",
    { albumIds: ["al-02"], articleIds: ["ar-04"], tags: ["thầy cô"] }),
  ev("ev-03", "tet-dau-tien", "Cái Tết đầu tiên cùng nhau", m("2023-01"), "2022-2023", "class",
    "Một khung trống cho những ngày cuối năm âm lịch: lớp đã trang trí gì, ăn gì, chụp tấm ảnh nào trước khi nghỉ Tết.",
    { tags: ["tết"] }),
  ev("ev-04", "mua-thi-dau-tien", "Mùa thi đầu tiên", m("2023-05"), "2022-2023", "academic",
    "Khung cho học kỳ đầu tiên khép lại. Thêm những ghi chú, góc ôn thi, hoặc một câu chuyện nhỏ về đêm trước ngày thi.",
    { tags: ["học tập"] }),
  ev("ev-05", "nam-thu-hai", "Năm thứ hai bắt đầu", m("2023-09"), "2023-2024", "class",
    "Năm học mới, chỗ ngồi mới, những thói quen đã thành nếp. Khung này dành cho những thay đổi của lớp khi bước sang lớp 11.",
    { milestone: true, tags: ["chuyển giao"] }),
  ev("ev-06", "dem-van-nghe", "Đêm văn nghệ", m("2023-11"), "2023-2024", "performance",
    "Khung cho một tiết mục biểu diễn: ai tập, tập ở đâu, bài hát nào. Video có thể được liên kết từ nơi lưu trữ được phép.",
    { videoIds: ["vi-02"], albumIds: ["al-03"], tags: ["sân khấu"] }),
  ev("ev-07", "chuyen-di", "Chuyến đi của lớp", m("2024-03"), "2023-2024", "trip",
    "Khung cho một chuyến đi xa trường. Thêm ảnh, lộ trình và những khoảnh khắc ngoài kế hoạch.",
    { albumIds: ["al-04"], videoIds: ["vi-03"], tags: ["chuyến đi"] }),
  ev("ev-08", "giai-dau-lop", "Một trận đấu đáng nhớ", m("2024-04"), "2023-2024", "competition",
    "Khung cho một cuộc thi hay giải đấu mà lớp tham gia. Kết quả chỉ được ghi khi có nguồn xác minh.",
    { tags: ["thể thao"] }),
  ev("ev-09", "nam-cuoi", "Năm cuối cấp", m("2024-09"), "2024-2025", "class",
    "Khung mở đầu năm lớp 12: những dự định, những lo lắng và lời hứa ở lại bên nhau đến cuối.",
    { milestone: true, tags: ["năm cuối"] }),
  ev("ev-10", "chup-ky-yeu", "Buổi chụp kỷ yếu", m("2025-03"), "2024-2025", "celebration",
    "Khung cho buổi chụp ảnh kỷ yếu. Ảnh gốc từ nhiếp ảnh gia chỉ được đăng khi có sự đồng ý về bản quyền.",
    { albumIds: ["al-05"], videoIds: ["vi-04"], tags: ["kỷ yếu"] }),
  ev("ev-11", "le-tri-an-truong-thanh", "Lễ tri ân và trưởng thành", m("2025-05"), "2024-2025", "graduation",
    "Khung cho buổi lễ cuối cùng dưới mái trường: lời cảm ơn, những cái ôm và khoảnh khắc nhìn lại.",
    { milestone: true, albumIds: ["al-06"], articleIds: ["ar-03"], tags: ["tốt nghiệp"] }),
  ev("ev-12", "ky-thi-tot-nghiep", "Kỳ thi tốt nghiệp THPT 2025", m("2025-06"), "2024-2025", "academic",
    "Khung cho những ngày thi cuối cùng. Câu chuyện, lời động viên và tấm ảnh trước cổng điểm thi.",
    { milestone: true, tags: ["tốt nghiệp"] }),
];

/* ───────────────────────── Albums ───────────────────────── */

const album = (
  id: string, slug: string, title: string, topic: Album["topic"], schoolYear: string,
  eventId: string | undefined, plateNums: number[], date: FuzzyDate, description: string,
): Album => ({
  ...base(id, slug, title),
  ...demoGov,
  topic, schoolYear, eventId, eventDate: date, description,
  assets: plateNums.map((n, i) => plate(n, `Ảnh minh hoạ trừu tượng số ${i + 1} của album “${title}”`)),
  coverId: `demo-plate-${String(plateNums[0]).padStart(2, "0")}`,
  source: { kind: "manual", note: "Album mẫu" },
});

const albums: Album[] = [
  album("al-01", "buoi-dau", "Những buổi đầu", "classroom", "2022-2023", "ev-01", [1, 2, 3, 4, 5, 6], m("2022-09"),
    "Album mẫu cho những tấm ảnh đầu tiên của lớp."),
  album("al-02", "tri-an-thay-co", "Tri ân thầy cô", "event", "2022-2023", "ev-02", [7, 8, 9, 10], m("2022-11"),
    "Album mẫu cho dịp 20/11."),
  album("al-03", "san-khau", "Sân khấu", "stage", "2023-2024", "ev-06", [11, 12, 13, 14, 15], m("2023-11"),
    "Album mẫu cho những tiết mục biểu diễn."),
  album("al-04", "ngoai-truong", "Ngoài cổng trường", "trip", "2023-2024", "ev-07", [16, 1, 3, 5, 9, 2, 8], m("2024-03"),
    "Album mẫu cho những chuyến đi."),
  album("al-05", "ky-yeu", "Ngày chụp kỷ yếu", "portrait", "2024-2025", "ev-10", [4, 6, 10, 12, 14, 7], m("2025-03"),
    "Album mẫu cho buổi chụp kỷ yếu."),
  album("al-06", "loi-tam-biet", "Lời tạm biệt", "event", "2024-2025", "ev-11", [15, 13, 11, 16, 8], m("2025-05"),
    "Album mẫu cho buổi lễ trưởng thành."),
];

/* ───────────────────────── Videos ───────────────────────── */

const video = (
  id: string, slug: string, title: string, category: VideoItem["category"], date: FuzzyDate,
  posterN: number, description: string, eventId?: string, albumIds: string[] = [],
): VideoItem => ({
  ...base(id, slug, title),
  ...demoGov,
  category, eventDate: date, description, eventId, albumIds, articleIds: [],
  provider: "none",
  poster: plate(posterN, `Ảnh bìa minh hoạ cho video “${title}”`),
  source: { kind: "manual", note: "Chờ liên kết video từ nơi lưu trữ được phép" },
});

const videos: VideoItem[] = [
  video("vi-01", "nhin-lai-ba-nam", "Nhìn lại ba năm", "retrospective", y("2025"), 3,
    "Chỗ dành cho một bản dựng hồi tưởng. Khi có video, hãy tải lên YouTube (chế độ không công khai nếu cần) hoặc kho lưu trữ được phép rồi dán liên kết trong trang quản trị."),
  video("vi-02", "tiet-muc-van-nghe", "Tiết mục văn nghệ", "performance", m("2023-11"), 12,
    "Chỗ dành cho bản ghi một tiết mục của lớp.", "ev-06", ["al-03"]),
  video("vi-03", "tren-duong-di", "Trên đường đi", "activity", m("2024-03"), 16,
    "Chỗ dành cho những đoạn quay ngắn trên chuyến đi.", "ev-07", ["al-04"]),
  video("vi-04", "hau-truong-ky-yeu", "Hậu trường kỷ yếu", "graduation", m("2025-03"), 6,
    "Chỗ dành cho video hậu trường buổi chụp kỷ yếu.", "ev-10", ["al-05"]),
];

/* ───────────────────────── Articles ───────────────────────── */

const articles: Article[] = [
  {
    ...base("ar-01", "vi-sao-co-kho-luu-tru-nay", "Vì sao có kho lưu trữ này"),
    ...projectGov,
    subtitle: "Ảnh của chúng ta đang nằm rải rác trên Facebook, trong điện thoại và ổ đĩa của từng người. Đây là nơi gom chúng lại, cẩn thận.",
    author: "Ban biên tập kho lưu trữ",
    category: "announcement",
    featured: true,
    publishedAt: "2026-11-13T00:00:00.000Z",
    cover: plate(1, "Ảnh minh hoạ: một dải tinh vân xanh tím"),
    tags: ["dự án", "lưu trữ"],
    body: `Ba năm học tạo ra rất nhiều tư liệu: ảnh chụp vội trong giờ ra chơi, video tập văn nghệ, bài đăng trên trang của lớp, những tấm thiệp viết tay. Phần lớn chúng không mất đi, nhưng cũng không ở cùng một chỗ. Sau vài năm, đường dẫn hỏng, tài khoản bị khoá, điện thoại được thay.

Kho lưu trữ này có một việc đơn giản: giữ những ký ức đó ở một nơi có trật tự, tìm lại được, và thuộc về chính chúng ta.

## Ba nguyên tắc

**Không bịa.** Mỗi sự kiện, mỗi chú thích ảnh đều có nguồn. Khi chưa chắc ngày tháng hay tên người, kho ghi rõ là "cần xác minh" thay vì đoán.

**Có sự đồng ý.** Một tấm ảnh từng công khai trên Facebook không có nghĩa là được đăng lại ở mọi nơi. Ảnh có người chỉ xuất hiện khi những người trong ảnh đồng ý. Ai cũng có thể yêu cầu ẩn hồ sơ hoặc gỡ một tấm ảnh.

**Dành cho lâu dài.** Dữ liệu được lưu ở định dạng mở, có bản sao lưu, để mười năm sau vẫn đọc được.

> Mỗi ký ức là một vì sao. Kho lưu trữ chỉ là bầu trời để chúng có chỗ sáng.

## Bạn có thể làm gì

Nếu bạn còn giữ ảnh, video hay một câu chuyện, hãy vào mục **Đóng góp**. Mọi bài gửi đều được ban biên tập xem trước khi xuất bản.`,
  },
  {
    ...base("ar-02", "cach-gui-mot-ky-uc", "Cách gửi một ký ức"),
    ...projectGov,
    subtitle: "Hướng dẫn ngắn để ảnh, video và câu chuyện của bạn vào kho lưu trữ đúng cách.",
    author: "Ban biên tập kho lưu trữ",
    category: "announcement",
    publishedAt: "2026-11-13T00:00:00.000Z",
    cover: plate(5, "Ảnh minh hoạ: quỹ đạo mờ trên nền trời tím"),
    tags: ["hướng dẫn", "đóng góp"],
    body: `Một ký ức tốt cho kho lưu trữ cần ba thứ: **chuyện gì**, **khi nào**, và **ai đồng ý chia sẻ**.

## Trước khi gửi

- Chọn bản gốc thay vì ảnh chụp màn hình. Ảnh tải từ Facebook bị nén mạnh; nếu còn file gốc trong điện thoại, hãy dùng file đó.
- Ghi lại thời điểm sự kiện xảy ra, không phải ngày bạn đăng ảnh. Nếu chỉ nhớ tháng hoặc năm, cứ ghi như vậy.
- Hỏi những người có mặt rõ trong ảnh xem họ có đồng ý không.

## Khi gửi

Vào mục **Đóng góp**, nhập mã đóng góp mà lớp đã chia sẻ riêng, chọn loại nội dung và tải file lên. Bạn sẽ thấy tiến độ tải lên và thông báo khi hoàn tất.

## Sau khi gửi

Bài gửi vào hàng chờ duyệt, không tự động xuất hiện trên trang. Ban biên tập sẽ kiểm tra trùng lặp, thông tin và sự đồng ý trước khi xuất bản.

## Muốn gỡ một nội dung?

Chọn loại **Yêu cầu gỡ / chỉnh sửa** trong mục Đóng góp và ghi rõ đường dẫn. Yêu cầu gỡ được ưu tiên xử lý.`,
  },
  {
    ...base("ar-03", "ba-nam-dem-bang-nhung-dieu-nho", "Ba năm, đếm bằng những điều nhỏ"),
    ...demoGov,
    subtitle: "Bài mẫu cho chuyên mục Suy ngẫm — thay bằng bài viết thật của một thành viên.",
    author: "Tác giả mẫu",
    category: "reflection",
    featured: true,
    publishedAt: "2026-11-13T00:00:00.000Z",
    eventDate: y("2025"),
    cover: plate(13, "Ảnh minh hoạ: ánh sáng ấm loang trên nền trời đêm"),
    tags: ["suy ngẫm"],
    body: `*Đây là bài mẫu để minh hoạ bố cục đọc. Nội dung không kể lại sự kiện có thật.*

Người ta thường nhớ một lớp học qua những ngày lớn: khai giảng, bế giảng, tấm ảnh kỷ yếu. Nhưng phần lớn thời gian của ba năm lại nằm ở những điều nhỏ hơn nhiều.

## Những thứ không ai chụp lại

Tiếng ghế kéo lúc chuông reo. Chỗ ngồi quen thuộc cạnh cửa sổ. Một câu đùa chỉ người trong lớp mới hiểu. Những điều này hiếm khi có ảnh, nên chúng dễ trôi đi nhất.

Một bài viết như thế này là cách để giữ chúng lại: không cần chính xác từng ngày, chỉ cần đúng với cảm giác của người viết.

![Ảnh minh hoạ: dải sao mờ](/media/demo/plate-09.webp "Ảnh minh hoạ trừu tượng — vị trí cho một tấm ảnh trong bài.")

## Gợi ý cho người viết

- Bắt đầu từ một chi tiết cụ thể, rồi mới nói đến ý nghĩa.
- Nhắc đến người khác chỉ khi họ đồng ý.
- Nếu không chắc thời điểm, hãy viết "khoảng mùa xuân năm lớp 11" thay vì đoán ngày.

> Không phải ký ức nào cũng cần ảnh. Có những ký ức chỉ cần một người kể lại.`,
  },
  {
    ...base("ar-04", "thu-gui-thay-co", "Thư gửi thầy cô"),
    ...demoGov,
    subtitle: "Khung mẫu cho chuyên mục Tri ân thầy cô.",
    author: "Tác giả mẫu",
    category: "teachers",
    publishedAt: "2026-11-13T00:00:00.000Z",
    eventDate: m("2022-11"),
    cover: plate(8, "Ảnh minh hoạ: ánh sáng vàng nhạt trong tinh vân"),
    tags: ["thầy cô", "20/11"],
    body: `*Bài mẫu. Chuyên mục này dành cho những lá thư, lời cảm ơn và câu chuyện về thầy cô — chỉ đăng khi thầy cô được nhắc đến đồng ý.*

Một lá thư tri ân hay thường không dài. Nó kể một khoảnh khắc cụ thể — một lời khuyên, một buổi học, một lần được tin tưởng — và nói vì sao khoảnh khắc ấy còn ở lại.

## Cấu trúc gợi ý

1. Một kỷ niệm cụ thể.
2. Điều bạn học được.
3. Lời cảm ơn, ngắn và thật.`,
  },
  {
    ...base("ar-05", "phong-van-mau", "Mười năm nữa, bạn muốn nhớ điều gì?"),
    ...demoGov,
    subtitle: "Khung mẫu cho chuyên mục Phỏng vấn: một bộ câu hỏi để hỏi nhau.",
    author: "Ban biên tập kho lưu trữ",
    category: "interview",
    publishedAt: "2026-11-13T00:00:00.000Z",
    cover: plate(10, "Ảnh minh hoạ: hai vùng sáng xanh và tím"),
    tags: ["phỏng vấn"],
    body: `*Bài mẫu với bộ câu hỏi phỏng vấn. Câu trả lời sẽ do chính các thành viên viết.*

## Bộ câu hỏi

**Bạn nhớ gì về ngày đầu tiên vào lớp?**

**Có một khoảnh khắc nào bạn chỉ muốn kể cho người trong lớp nghe?**

**Điều gì của 12A3 mà bạn mang theo đến bây giờ?**

**Mười năm nữa, bạn muốn mở lại trang này và thấy điều gì?**`,
  },
];

/* ───────────────────────── People ───────────────────────── */

const groups = ["Tổ 1", "Tổ 2", "Tổ 3", "Tổ 4"];
const restrictedIdx = new Set([4, 11, 19, 27, 32]);
const hiddenIdx = new Set([8, 23]);

const students: Profile[] = Array.from({ length: 35 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  const restricted = restrictedIdx.has(i + 1);
  const hidden = hiddenIdx.has(i + 1);
  return {
    ...base(`pr-${n}`, `thanh-vien-${n}`, `Thành viên ${n}`),
    status: "published",
    visibility: hidden ? "hidden" : restricted ? "restricted" : "public",
    consent: hidden ? "declined" : restricted ? "pending" : "granted",
    review: "needs_review",
    demo: true,
    role: "student",
    group: groups[i % 4],
    showPortrait: false,
    showBio: !restricted,
    bio: restricted ? undefined : "Hồ sơ mẫu. Chủ hồ sơ có thể tự viết vài dòng giới thiệu và chọn hiển thị hay không.",
    memory: restricted ? undefined : i % 3 === 0 ? "Chỗ dành cho một ký ức ngắn do chính thành viên này viết." : undefined,
    source: { kind: "manual", note: "Hồ sơ mẫu" },
  } satisfies Profile;
});

const teachers: Profile[] = [
  {
    ...base("pr-gv1", "giao-vien-chu-nhiem", "Giáo viên chủ nhiệm"),
    ...demoGov, consent: "granted",
    role: "teacher", subject: "Chủ nhiệm", showPortrait: false, showBio: true,
    bio: "Hồ sơ mẫu cho giáo viên chủ nhiệm. Tên và lời giới thiệu chỉ hiển thị khi thầy cô đồng ý.",
  },
  {
    ...base("pr-gv2", "giao-vien-bo-mon", "Giáo viên bộ môn"),
    ...demoGov, consent: "granted",
    role: "teacher", subject: "Bộ môn", showPortrait: false, showBio: true,
    bio: "Hồ sơ mẫu cho một thầy cô bộ môn.",
  },
];

/* ───────────────────────── Legacy ───────────────────────── */

const legacy: LegacyItem[] = [
  {
    ...base("lg-01", "truyen-thong-cua-lop", "Một truyền thống của lớp"),
    ...demoGov, kind: "tradition", verified: false, eventDate: y("2023"),
    description: "Khung cho một thói quen chỉ 12A3 mới có — một câu nói, một nghi thức nhỏ, một món ăn mỗi dịp đặc biệt.",
  },
  {
    ...base("lg-02", "thanh-tich-tap-the", "Thành tích tập thể"),
    ...demoGov, kind: "achievement", verified: false, eventDate: y("2024"),
    description: "Khung cho một thành tích chung của lớp. Chỉ hiển thị là đã xác minh khi có giấy khen, thông báo của trường hoặc nguồn tương đương.",
  },
  {
    ...base("lg-03", "giai-thuong-ca-nhan", "Giải thưởng của một thành viên"),
    ...demoGov, kind: "achievement", verified: false, eventDate: y("2024"),
    description: "Khung cho giải thưởng cá nhân — chỉ đăng khi chủ nhân đồng ý và có nguồn xác minh.",
  },
  {
    ...base("lg-04", "du-an-dang-nho", "Một dự án đáng nhớ"),
    ...demoGov, kind: "project", verified: false, eventDate: y("2024"),
    description: "Khung cho một dự án lớp đã cùng làm: một tờ báo tường, một buổi gây quỹ, một sản phẩm khoa học.",
  },
  {
    ...base("lg-05", "kho-luu-tru-12a3", "Kho lưu trữ 12A3"),
    ...projectGov, kind: "milestone", verified: true, eventDate: m("2026-11"),
    evidence: "Chính trang web này.",
    description: "Kho lưu trữ số của lớp được dựng lên để gom ảnh, video và câu chuyện về một nơi có trật tự, có sự đồng ý.",
  },
];

export const seed: ArchiveDB = {
  version: 1,
  events,
  albums,
  videos,
  articles,
  profiles: [...teachers, ...students],
  legacy,
  submissions: [],
  imports: [],
  batches: [],
  audit: [],
};
