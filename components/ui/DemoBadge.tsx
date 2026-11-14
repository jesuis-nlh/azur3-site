import type { Governance } from "@/lib/types";

/** Labels placeholder or unverified material so it is never mistaken for history. */
export default function DemoBadge({ item, className = "" }: { item: Partial<Governance>; className?: string }) {
  if (item.demo) return <span className={`badge badge--demo ${className}`} title="Nội dung mẫu — sẽ được thay bằng tư liệu thật">Mẫu</span>;
  if (item.review === "needs_review") return <span className={`badge badge--warn ${className}`} title="Thông tin chưa được xác minh">Cần xác minh</span>;
  return null;
}
