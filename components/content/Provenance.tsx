import { GOVERNANCE_LABELS } from "@/lib/governance";
import { formatFuzzy, formatIso } from "@/lib/dates";
import type { BaseRecord } from "@/lib/types";
import Link from "next/link";

const SOURCE_LABELS: Record<string, string> = {
  facebook: "Bài đăng Facebook", facebook_export: "Bản xuất dữ liệu Facebook", personal: "Tư liệu cá nhân",
  drive: "Thư mục chia sẻ", yearbook: "Kỷ yếu in", contribution: "Bài đóng góp", manual: "Ban biên tập nhập", project: "Kho lưu trữ",
};
const FIELD_LABELS: Record<string, string> = { eventDate: "thời gian", description: "mô tả", people: "người trong ảnh", location: "địa điểm", title: "tiêu đề" };

/** Shows where a record comes from and how certain we are about it. */
export default function Provenance({ item }: { item: BaseRecord }) {
  return (
    <aside className="provenance" aria-label="Nguồn và trạng thái xác minh">
      <p className="eyebrow">Nguồn & xác minh</p>
      <dl>
        <dt>Thời điểm</dt>
        <dd>{formatFuzzy(item.eventDate)}{item.eventDate?.approximate ? " (ước tính)" : ""}</dd>
        {item.publishedAt ? (<><dt>Đăng lần đầu</dt><dd>{formatIso(item.publishedAt)}</dd></>) : null}
        <dt>Nguồn</dt>
        <dd>
          {item.source ? SOURCE_LABELS[item.source.kind] ?? item.source.kind : "Chưa ghi nguồn"}
          {item.source?.note ? ` — ${item.source.note}` : ""}
          {item.source?.url ? <> · <a href={item.source.url} rel="noopener noreferrer" target="_blank">bản gốc</a></> : null}
        </dd>
        <dt>Xác minh</dt>
        <dd>{GOVERNANCE_LABELS.review[item.review]}{item.uncertain?.length ? ` — cần kiểm tra: ${item.uncertain.map((f) => FIELD_LABELS[f] ?? f).join(", ")}` : ""}</dd>
        {item.rights?.holder ? (<><dt>Bản quyền</dt><dd>{item.rights.holder}</dd></>) : null}
      </dl>
      <p className="small faint" style={{ margin: 0 }}>
        Thấy sai hoặc muốn gỡ? <Link href={`/dong-gop?loai=correction&ref=${encodeURIComponent(item.slug)}`}>Gửi đính chính</Link>
      </p>
    </aside>
  );
}
