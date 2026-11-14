import { GOVERNANCE_LABELS, isPublic } from "@/lib/governance";
import type { Governance } from "@/lib/types";

export default function GovBadges({ r }: { r: Governance }) {
  return (
    <span className="gov">
      <span className={`gov__b ${isPublic(r) ? "is-ok" : ""}`}>{isPublic(r) ? "Đang hiển thị" : "Không công khai"}</span>
      <span className="gov__b">{GOVERNANCE_LABELS.status[r.status]}</span>
      <span className="gov__b">{GOVERNANCE_LABELS.consent[r.consent]}</span>
      <span className={`gov__b ${r.review === "verified" ? "is-ok" : "is-warn"}`}>{GOVERNANCE_LABELS.review[r.review]}</span>
      {r.demo ? <span className="gov__b is-demo">Mẫu</span> : null}
    </span>
  );
}
