"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { foldVietnamese } from "@/lib/text";
import Glyph from "@/components/ui/Glyph";

export interface PersonStar {
  id: string;
  slug: string;
  name: string;
  group?: string;
  full: boolean;
  role: "student" | "teacher";
}

/** Strokes of the glyph "12A3" in a 1000 × 380 box. Lines follow letters, never relationships. */
const STROKES: [number, number][][] = [
  [[70, 115], [130, 62], [130, 320]],
  [[222, 112], [252, 72], [302, 56], [352, 72], [376, 116], [360, 168], [300, 222], [226, 320], [392, 320]],
  [[452, 320], [541, 60], [630, 320]],
  [[486, 222], [596, 222]],
  [[700, 92], [742, 63], [800, 58], [850, 80], [862, 126], [830, 166], [782, 182], [842, 198], [872, 242], [862, 292], [812, 322], [752, 324], [704, 296]],
];

function strokeLength(s: [number, number][]) {
  let l = 0;
  for (let i = 1; i < s.length; i++) l += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
  return l;
}

function pointsAlong(n: number): { x: number; y: number }[] {
  const lens = STROKES.map(strokeLength);
  const total = lens.reduce((a, b) => a + b, 0);
  // allot stars per stroke proportionally, at least 2 per stroke
  const counts = lens.map((l) => Math.max(2, Math.round((l / total) * n)));
  while (counts.reduce((a, b) => a + b, 0) > n) counts[counts.indexOf(Math.max(...counts))]--;
  while (counts.reduce((a, b) => a + b, 0) < n) counts[counts.indexOf(Math.max(...counts))]++;
  const pts: { x: number; y: number }[] = [];
  STROKES.forEach((s, si) => {
    const c = counts[si], L = lens[si];
    for (let k = 0; k < c; k++) {
      let d = c === 1 ? L / 2 : (k / (c - 1)) * L;
      for (let i = 1; i < s.length; i++) {
        const seg = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
        if (d <= seg || i === s.length - 1) {
          const t = Math.min(1, d / seg);
          pts.push({ x: s[i - 1][0] + (s[i][0] - s[i - 1][0]) * t, y: s[i - 1][1] + (s[i][1] - s[i - 1][1]) * t });
          break;
        }
        d -= seg;
      }
    }
  });
  return pts;
}

export default function PeopleConstellation({ people, withheld }: { people: PersonStar[]; withheld: number }) {
  const students = people.filter((p) => p.role === "student");
  const teachers = people.filter((p) => p.role === "teacher");
  const pts = useMemo(() => pointsAlong(students.length), [students.length]);
  const [active, setActive] = useState<PersonStar | null>(null);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const groups = [...new Set(students.map((p) => p.group).filter(Boolean))] as string[];
  const folded = foldVietnamese(q.trim());
  const matches = (p: PersonStar) => (!group || p.group === group) && (!folded || foldVietnamese(p.name).includes(folded));
  const filtering = Boolean(folded || group);

  return (
    <div className="constellation">
      <div className="constellation__sky" onMouseLeave={() => setActive(null)}>
        <svg viewBox="0 0 1000 380" role="group" aria-label={`Chòm sao 12A3: ${students.length} vì sao, mỗi vì sao là một thành viên`}>
          <g className="constellation__lines">
            {STROKES.map((s, i) => (
              <polyline key={i} className="line-draw" style={{ "--len": 900 } as React.CSSProperties} data-reveal="fade"
                points={s.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(169,174,200,.22)" strokeWidth="1" />
            ))}
          </g>
          {students.map((p, i) => {
            const pt = pts[i];
            if (!pt) return null;
            const hit = matches(p);
            const r = p.full ? 4.2 : 2.4;
            const body = (
              <>
                <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />
                {active?.id === p.id ? <circle cx={pt.x} cy={pt.y} r={14} fill="none" stroke="#E7C27A" strokeOpacity=".9" /> : null}
                <circle cx={pt.x} cy={pt.y} r={r * 3.2} fill="url(#person-glow)" opacity={p.full && hit ? 0.9 : 0} />
                <circle cx={pt.x} cy={pt.y} r={r} fill={p.full ? "#F4F3FF" : "#8A8FAB"} opacity={filtering && !hit ? 0.15 : p.full ? 1 : 0.55} />
              </>
            );
            return p.full ? (
              <Link key={p.id} href={`/chung-ta/${p.slug}`} className="constellation__star" aria-label={p.name}
                onMouseEnter={() => setActive(p)} onFocus={() => setActive(p)} onBlur={() => setActive(null)}>{body}</Link>
            ) : (
              <g key={p.id} className="constellation__star constellation__star--limited" onMouseEnter={() => setActive(p)} aria-hidden="true">{body}</g>
            );
          })}
          <defs>
            <radialGradient id="person-glow"><stop offset="0" stopColor="#63D9FF" stopOpacity=".55" /><stop offset="1" stopColor="#63D9FF" stopOpacity="0" /></radialGradient>
          </defs>
        </svg>
        <p className="constellation__label" aria-live="polite">
          {active ? (active.full ? <><span className="h3">{active.name}</span>{active.group ? <span className="coord"> · {active.group}</span> : null}</> : <span className="muted">Thành viên này chọn hiển thị hạn chế</span>) : <span className="faint small">Di chuột hoặc dùng Tab để gặp từng vì sao</span>}
        </p>
      </div>
      <p className="small faint constellation__note">
        Mỗi vì sao là một thành viên, xếp theo nét chữ “12A3” — các đường nối là nét chữ, không thể hiện quan hệ giữa ai với ai.
        {withheld ? ` ${withheld} thành viên chọn không xuất hiện.` : ""}
      </p>

      <div className="directory">
        <div className="directory__controls">
          <label className="timeline__search">
            <Glyph name="search" size={16} />
            <span className="sr-only">Tìm theo tên</span>
            <input className="input" type="search" placeholder="Tìm theo tên hiển thị" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          {groups.length ? (
            <div className="chips" role="group" aria-label="Lọc theo tổ">
              <button type="button" className="chip" aria-pressed={!group} onClick={() => setGroup(null)}>Tất cả</button>
              {groups.map((g) => <button key={g} type="button" className="chip" aria-pressed={group === g} onClick={() => setGroup(group === g ? null : g)}>{g}</button>)}
            </div>
          ) : null}
        </div>

        {teachers.length && !filtering ? (
          <section aria-labelledby="teachers-h" className="directory__section">
            <h2 id="teachers-h" className="eyebrow eyebrow--memory">Thầy cô</h2>
            <ul className="directory__grid">
              {teachers.map((p) => <li key={p.id}><PersonCard p={p} /></li>)}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="students-h" className="directory__section">
          <h2 id="students-h" className="eyebrow">Thành viên</h2>
          {students.filter(matches).length === 0 ? (
            <div className="empty"><p className="h3">Không tìm thấy ai</p><p>Có thể người đó chọn không hiển thị, hoặc thử tên khác.</p></div>
          ) : (
            <ul className="directory__grid">
              {students.filter(matches).map((p) => <li key={p.id}><PersonCard p={p} /></li>)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function PersonCard({ p }: { p: PersonStar }) {
  const inner = (
    <>
      <span className={`person-card__star${p.full ? "" : " is-limited"}`} aria-hidden="true" />
      <span className="person-card__name">{p.name}</span>
      <span className="small faint">{p.full ? p.group ?? (p.role === "teacher" ? "Thầy cô" : "") : "Hồ sơ hạn chế"}</span>
    </>
  );
  return p.full ? <Link href={`/chung-ta/${p.slug}`} className="person-card">{inner}</Link> : <div className="person-card person-card--limited">{inner}</div>;
}
