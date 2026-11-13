/**
 * Archive data model.
 *
 * Every record carries provenance (source), rights, consent, review and
 * publication state. Public pages only ever see records that pass
 * `isPublic()` in lib/governance.ts.
 */

export type PublicationStatus = "draft" | "published" | "archived";
/** public = anyone; restricted = admins only (profiles: limited card); hidden = admins only, never listed */
export type Visibility = "public" | "restricted" | "hidden";
export type ConsentStatus = "granted" | "pending" | "declined" | "not_required";
export type ReviewStatus = "unreviewed" | "needs_review" | "verified";

export type SourceKind =
  | "facebook"
  | "facebook_export"
  | "personal"
  | "drive"
  | "yearbook"
  | "contribution"
  | "manual"
  | "project";

export interface Source {
  kind: SourceKind;
  url?: string;
  note?: string;
  /** e.g. filename inside an export, original post id */
  ref?: string;
}

/** Dates in the archive are honest about their precision. */
export interface FuzzyDate {
  /** "2023", "2023-11" or "2023-11-20" */
  value: string;
  precision: "year" | "month" | "day";
  /** true when the date was inferred (e.g. from EXIF or a post timestamp) and must be confirmed */
  approximate?: boolean;
}

export interface Rights {
  /** Who holds the copyright, if known */
  holder?: string;
  license?: "all_rights_reserved" | "class_internal" | "cc_by" | "cc_by_nc" | "unknown";
  usageNote?: string;
}

export interface Governance {
  status: PublicationStatus;
  visibility: Visibility;
  consent: ConsentStatus;
  review: ReviewStatus;
  /** Field names whose value is uncertain and needs a human check */
  uncertain?: string[];
  /** Placeholder/demonstration content that must be replaced by real material */
  demo?: boolean;
}

export interface BaseRecord extends Governance {
  id: string;
  slug: string;
  title: string;
  description?: string;
  source?: Source;
  /** When the material was originally published (e.g. Facebook post time) */
  publishedAt?: string;
  /** When the moment actually happened */
  eventDate?: FuzzyDate;
  tags: string[];
  /** Profile ids — only for people who authorised being tagged */
  people: string[];
  rights?: Rights;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  /** URLs. Uploaded assets are served through /media/u/... with access checks. */
  src: string;
  preview?: string;
  thumb?: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  photographer?: string;
  takenAt?: FuzzyDate;
  sha256?: string;
  /** 64-bit perceptual difference hash as hex */
  dhash?: string;
  source?: Source;
  /** Dominant tone used for blur-up placeholders */
  tone?: string;
  demo?: boolean;
}

export const EVENT_CATEGORIES = {
  ceremony: "Lễ nghi",
  class: "Hoạt động lớp",
  competition: "Thi đấu",
  academic: "Học tập",
  extracurricular: "Ngoại khoá",
  trip: "Chuyến đi",
  celebration: "Kỷ niệm",
  performance: "Biểu diễn",
  graduation: "Tốt nghiệp",
  everyday: "Thường ngày",
} as const;
export type EventCategory = keyof typeof EVENT_CATEGORIES;

export interface TimelineEvent extends BaseRecord {
  category: EventCategory;
  /** "2022-2023" */
  schoolYear: string;
  milestone?: boolean;
  location?: string;
  body?: string;
  albumIds: string[];
  videoIds: string[];
  articleIds: string[];
}

export const ALBUM_TOPICS = {
  event: "Sự kiện",
  portrait: "Chân dung",
  classroom: "Lớp học",
  trip: "Chuyến đi",
  stage: "Sân khấu",
  everyday: "Thường ngày",
} as const;
export type AlbumTopic = keyof typeof ALBUM_TOPICS;

export interface Album extends BaseRecord {
  topic: AlbumTopic;
  schoolYear?: string;
  coverId?: string;
  eventId?: string;
  assets: MediaAsset[];
}

export const VIDEO_CATEGORIES = {
  class: "Video lớp",
  performance: "Biểu diễn",
  activity: "Hoạt động",
  interview: "Phỏng vấn",
  graduation: "Tốt nghiệp",
  documentary: "Tư liệu",
  personal: "Cá nhân",
  retrospective: "Hồi tưởng",
} as const;
export type VideoCategory = keyof typeof VIDEO_CATEGORIES;

export interface VideoItem extends BaseRecord {
  category: VideoCategory;
  /** youtube | vimeo | file (an https URL to an mp4/webm on authorised storage) */
  provider: "youtube" | "vimeo" | "file" | "none";
  url?: string;
  durationSec?: number;
  poster?: MediaAsset;
  captionsUrl?: string;
  eventId?: string;
  albumIds: string[];
  articleIds: string[];
}

export const ARTICLE_CATEGORIES = {
  story: "Chuyện lớp",
  memory: "Ký ức trường",
  interview: "Phỏng vấn",
  teachers: "Tri ân thầy cô",
  reflection: "Suy ngẫm",
  retrospective: "Hồi cứu",
  graduation: "Tốt nghiệp",
  announcement: "Thông báo",
  contribution: "Bài đóng góp",
} as const;
export type ArticleCategory = keyof typeof ARTICLE_CATEGORIES;

export interface Article extends BaseRecord {
  subtitle?: string;
  author: string;
  category: ArticleCategory;
  cover?: MediaAsset;
  /** Archive-flavoured Markdown, see lib/markdown.tsx */
  body: string;
  featured?: boolean;
}

export interface Profile extends BaseRecord {
  /** title = preferred display name */
  role: "student" | "teacher";
  fullName?: string;
  group?: string;
  subject?: string;
  portrait?: MediaAsset;
  bio?: string;
  memory?: string;
  /** Visitors only see what the person opted to show */
  showPortrait: boolean;
  showBio: boolean;
}

export interface LegacyItem extends BaseRecord {
  kind: "achievement" | "tradition" | "milestone" | "project" | "contribution";
  /** Awards are only shown as fact when verified with evidence */
  verified: boolean;
  evidence?: string;
  eventId?: string;
}

export type SubmissionType = "photo" | "video" | "article" | "event" | "correction" | "caption" | "memory" | "removal";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface SubmissionFile {
  id: string;
  originalName: string;
  mime: string;
  size: number;
  /** relative path inside DATA_DIR/uploads */
  path: string;
  preview?: string;
  width?: number;
  height?: number;
  sha256: string;
}

export interface Submission {
  id: string;
  type: SubmissionType;
  name: string;
  /** Optional, only so moderators can reply. Never published. */
  contact?: string;
  title: string;
  body: string;
  eventDate?: string;
  relatedUrl?: string;
  files: SubmissionFile[];
  consent: {
    ownsOrAuthorised: boolean;
    peopleAgreed: boolean;
    allowPublication: boolean;
  };
  status: SubmissionStatus;
  moderatorNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportItem {
  id: string;
  batchId: string;
  kind: "photo" | "video" | "post";
  title: string;
  description?: string;
  source: Source;
  publishedAt?: string;
  eventDate?: FuzzyDate;
  asset?: MediaAsset;
  duplicateOf?: string;
  issues: string[];
  suggestedAlbum?: string;
  state: "needs_review" | "accepted" | "rejected";
}

export interface ImportBatch {
  id: string;
  label: string;
  createdAt: string;
  sourceKind: SourceKind;
  stats: { total: number; imported: number; duplicates: number; errors: number };
  errors: { file: string; reason: string }[];
}

export interface ArchiveDB {
  version: 1;
  events: TimelineEvent[];
  albums: Album[];
  videos: VideoItem[];
  articles: Article[];
  profiles: Profile[];
  legacy: LegacyItem[];
  submissions: Submission[];
  imports: ImportItem[];
  batches: ImportBatch[];
  audit: { at: string; action: string; target: string }[];
}

export type CollectionName = "events" | "albums" | "videos" | "articles" | "profiles" | "legacy";
