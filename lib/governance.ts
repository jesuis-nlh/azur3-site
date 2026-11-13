import type { Governance, Profile } from "./types";

/**
 * The single gate between the archive and the public website.
 * A record is public only when an editor published it, it is marked public,
 * and consent was granted (or is not required, e.g. project texts).
 */
export function isPublic(r: Governance): boolean {
  return (
    r.status === "published" &&
    r.visibility === "public" &&
    (r.consent === "granted" || r.consent === "not_required")
  );
}

/** Profiles may also appear as a limited, anonymous-ish star when restricted. */
export function profileExposure(p: Profile): "full" | "limited" | "none" {
  if (p.status !== "published" || p.visibility === "hidden") return "none";
  if (p.consent === "declined") return "none";
  if (p.visibility === "restricted" || p.consent !== "granted") return "limited";
  return "full";
}

export const GOVERNANCE_LABELS = {
  status: { draft: "Bản nháp", published: "Đã xuất bản", archived: "Lưu trữ" },
  visibility: { public: "Công khai", restricted: "Hạn chế", hidden: "Ẩn" },
  consent: { granted: "Đã đồng ý", pending: "Chờ đồng ý", declined: "Từ chối", not_required: "Không cần" },
  review: { unreviewed: "Chưa duyệt", needs_review: "Cần xác minh", verified: "Đã xác minh" },
} as const;
