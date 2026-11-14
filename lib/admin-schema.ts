/**
 * Field definitions that drive the generic admin editor.
 * Adding a field here makes it editable in /admin with no extra UI code.
 */
import type { CollectionName } from "./types";
import { ALBUM_TOPICS, ARTICLE_CATEGORIES, EVENT_CATEGORIES, VIDEO_CATEGORIES } from "./types";
import { site } from "./site";

export type FieldDef =
  | { name: string; label: string; type: "text" | "textarea" | "markdown" | "url"; required?: boolean; hint?: string }
  | { name: string; label: string; type: "select"; options: Record<string, string>; required?: boolean; hint?: string }
  | { name: string; label: string; type: "fuzzydate"; hint?: string }
  | { name: string; label: string; type: "tags"; hint?: string }
  | { name: string; label: string; type: "refs"; collection: CollectionName; hint?: string }
  | { name: string; label: string; type: "ref"; collection: CollectionName; hint?: string }
  | { name: string; label: string; type: "checkbox"; hint?: string }
  | { name: string; label: string; type: "number"; hint?: string }
  | { name: string; label: string; type: "image"; hint?: string };

const years = Object.fromEntries(site.schoolYears.map((y) => [y, y.replace("-", "–")]));

const common: FieldDef[] = [
  { name: "title", label: "Tiêu đề", type: "text", required: true },
  { name: "slug", label: "Đường dẫn (slug)", type: "text", hint: "Để trống để tạo tự động từ tiêu đề. Chỉ chữ thường không dấu, số và gạch ngang." },
  { name: "description", label: "Mô tả", type: "textarea" },
  { name: "eventDate", label: "Thời điểm diễn ra", type: "fuzzydate", hint: "Ghi đúng độ chính xác bạn biết: năm, tháng hoặc ngày." },
  { name: "publishedAt", label: "Ngày đăng gốc", type: "text", hint: "ISO, ví dụ 2023-11-20T08:00:00Z — ngày bài/ảnh được đăng lần đầu (khác ngày sự kiện)." },
  { name: "tags", label: "Thẻ", type: "tags", hint: "Cách nhau bằng dấu phẩy" },
  { name: "people", label: "Người được gắn (đã đồng ý)", type: "refs", collection: "profiles", hint: "Chỉ gắn người đã đồng ý được nhắc tên." },
];

const provenance: FieldDef[] = [
  { name: "source.kind", label: "Loại nguồn", type: "select", options: { manual: "Ban biên tập nhập", facebook: "Bài đăng Facebook", facebook_export: "Bản xuất Facebook", personal: "Tư liệu cá nhân", drive: "Thư mục chia sẻ", yearbook: "Kỷ yếu in", contribution: "Bài đóng góp", project: "Kho lưu trữ" } },
  { name: "source.url", label: "URL nguồn gốc", type: "url" },
  { name: "source.note", label: "Ghi chú nguồn", type: "text" },
  { name: "rights.holder", label: "Chủ sở hữu bản quyền", type: "text" },
  { name: "rights.license", label: "Giấy phép", type: "select", options: { unknown: "Chưa rõ", all_rights_reserved: "Giữ mọi quyền", class_internal: "Nội bộ lớp", cc_by: "CC BY", cc_by_nc: "CC BY-NC" } },
  { name: "uncertain", label: "Trường cần xác minh", type: "tags", hint: "Ví dụ: eventDate, people, description" },
];

export const SCHEMAS: Record<CollectionName, { label: string; singular: string; publicPath: string; fields: FieldDef[] }> = {
  events: {
    label: "Sự kiện", singular: "sự kiện", publicPath: "/dong-thoi-gian/",
    fields: [
      ...common,
      { name: "schoolYear", label: "Năm học", type: "select", options: years, required: true },
      { name: "category", label: "Loại", type: "select", options: EVENT_CATEGORIES, required: true },
      { name: "milestone", label: "Là cột mốc", type: "checkbox" },
      { name: "location", label: "Địa điểm", type: "text" },
      { name: "body", label: "Lời kể (Markdown)", type: "markdown" },
      { name: "albumIds", label: "Album liên quan", type: "refs", collection: "albums" },
      { name: "videoIds", label: "Video liên quan", type: "refs", collection: "videos" },
      { name: "articleIds", label: "Bài viết liên quan", type: "refs", collection: "articles" },
      ...provenance,
    ],
  },
  albums: {
    label: "Album", singular: "album", publicPath: "/ky-uc/",
    fields: [
      ...common,
      { name: "topic", label: "Chủ đề", type: "select", options: ALBUM_TOPICS, required: true },
      { name: "schoolYear", label: "Năm học", type: "select", options: years },
      { name: "eventId", label: "Sự kiện", type: "ref", collection: "events" },
      ...provenance,
    ],
  },
  videos: {
    label: "Video", singular: "video", publicPath: "/thuoc-phim/",
    fields: [
      ...common,
      { name: "category", label: "Loại", type: "select", options: VIDEO_CATEGORIES, required: true },
      { name: "provider", label: "Nơi lưu trữ", type: "select", options: { none: "Chưa có", youtube: "YouTube", vimeo: "Vimeo", file: "File (URL https tới mp4/webm)" } },
      { name: "url", label: "URL video", type: "url", hint: "YouTube nên để chế độ Không công khai nếu chưa muốn ai tìm thấy." },
      { name: "captionsUrl", label: "URL phụ đề (.vtt)", type: "url" },
      { name: "durationSec", label: "Thời lượng (giây)", type: "number" },
      { name: "poster", label: "Ảnh bìa", type: "image" },
      { name: "eventId", label: "Sự kiện", type: "ref", collection: "events" },
      { name: "albumIds", label: "Album liên quan", type: "refs", collection: "albums" },
      { name: "articleIds", label: "Bài viết liên quan", type: "refs", collection: "articles" },
      ...provenance,
    ],
  },
  articles: {
    label: "Bài viết", singular: "bài viết", publicPath: "/nhat-ky/",
    fields: [
      { name: "title", label: "Tiêu đề", type: "text", required: true },
      { name: "subtitle", label: "Sapo", type: "textarea" },
      { name: "slug", label: "Đường dẫn (slug)", type: "text" },
      { name: "author", label: "Tác giả", type: "text", required: true },
      { name: "category", label: "Chuyên mục", type: "select", options: ARTICLE_CATEGORIES, required: true },
      { name: "featured", label: "Nổi bật", type: "checkbox" },
      { name: "publishedAt", label: "Ngày đăng (ISO)", type: "text" },
      { name: "eventDate", label: "Thời điểm được kể", type: "fuzzydate" },
      { name: "cover", label: "Ảnh bìa", type: "image" },
      { name: "body", label: "Nội dung (Markdown)", type: "markdown", required: true, hint: "## Tiêu đề mục · **đậm** · *nghiêng* · > trích dẫn · - danh sách · ![mô tả](/đường-dẫn \"chú thích\") · @video(https://…)" },
      { name: "tags", label: "Thẻ", type: "tags" },
      { name: "people", label: "Người được nhắc (đã đồng ý)", type: "refs", collection: "profiles" },
      ...provenance,
    ],
  },
  profiles: {
    label: "Hồ sơ", singular: "hồ sơ", publicPath: "/chung-ta/",
    fields: [
      { name: "title", label: "Tên hiển thị", type: "text", required: true },
      { name: "slug", label: "Đường dẫn (slug)", type: "text" },
      { name: "fullName", label: "Họ tên đầy đủ (KHÔNG BAO GIỜ hiển thị công khai)", type: "text" },
      { name: "role", label: "Vai trò", type: "select", options: { student: "Học sinh", teacher: "Thầy cô" }, required: true },
      { name: "group", label: "Tổ / nhóm", type: "text" },
      { name: "subject", label: "Môn (thầy cô)", type: "text" },
      { name: "bio", label: "Giới thiệu (do chủ hồ sơ viết)", type: "textarea" },
      { name: "memory", label: "Một ký ức (do chủ hồ sơ viết)", type: "textarea" },
      { name: "portrait", label: "Chân dung", type: "image" },
      { name: "showPortrait", label: "Chủ hồ sơ cho phép hiện chân dung", type: "checkbox" },
      { name: "showBio", label: "Chủ hồ sơ cho phép hiện giới thiệu", type: "checkbox" },
    ],
  },
  legacy: {
    label: "Di sản", singular: "mục di sản", publicPath: "/di-san#",
    fields: [
      ...common.filter((f) => f.name !== "people"),
      { name: "kind", label: "Loại", type: "select", options: { achievement: "Thành tích", tradition: "Truyền thống", milestone: "Cột mốc", project: "Dự án", contribution: "Đóng góp" }, required: true },
      { name: "verified", label: "Đã xác minh có nguồn", type: "checkbox", hint: "Chỉ tick khi có giấy khen, thông báo chính thức hoặc nguồn tương đương." },
      { name: "evidence", label: "Nguồn xác minh", type: "text" },
      { name: "eventId", label: "Sự kiện", type: "ref", collection: "events" },
      ...provenance,
    ],
  },
};

export const COLLECTIONS = Object.keys(SCHEMAS) as CollectionName[];
export function isCollection(x: string): x is CollectionName {
  return x in SCHEMAS;
}
