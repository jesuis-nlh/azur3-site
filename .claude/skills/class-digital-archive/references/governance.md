# Content governance

## The model (lib/types.ts)

Every record has: `status` (draft/published/archived), `visibility` (public/restricted/hidden),
`consent` (granted/pending/declined/not_required), `review` (unreviewed/needs_review/verified),
optional `demo`, `uncertain[]`, `source{kind,url,note,ref}`, `rights{holder,license}`,
`publishedAt` (when it was posted) **and** `eventDate` (when it happened) — never conflate them.

`FuzzyDate` = `{ value: "2023" | "2023-11" | "2023-11-20", precision, approximate? }`.
Record only the precision you actually know.

## Public gate

`isPublic = published && visibility === "public" && consent ∈ {granted, not_required}`.
`not_required` is for texts about the project itself and abstract placeholders — never for
photos of people.

Profiles: `profileExposure()` → `full` | `limited` (unnamed dim star, no bio/portrait) | `none`.
`fullName` is never rendered publicly. Portrait/bio render only if `showPortrait`/`showBio`.
The people constellation draws letter strokes of "12A3" — **never draw lines that imply
relationships** between real people.

## Checklist before publishing a record

- [ ] Source recorded (and URL for Facebook posts)
- [ ] `eventDate` precision honest; `approximate` if inferred
- [ ] Captions state only what is known; unknown names omitted
- [ ] Everyone clearly identifiable in photos has agreed → `consent: granted`
- [ ] Photographer/author credited if known; `rights.holder` set
- [ ] Achievements: `verified: true` only with evidence (giấy khen, school notice, article)
- [ ] `demo` cleared if this replaces a placeholder
- [ ] alt text written for every image (describe what is visible, not who, unless consented)

## Contributions & removals

`/dong-gop` → `/api/contribute` → `submissions` (pending). Contributor code required except for
`removal` and `correction` — anyone affected must always be able to ask. Removal requests sort
first in `/admin/submissions`; act by **"Lưu trữ & ẩn"** first (instant), investigate after.
"Duyệt → tạo bản nháp" creates a draft with `consent: pending` unless the submitter ticked
both people-agreed and allow-publication.

## Legal context (Vietnam) — not legal advice

Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (in force 01/01/2026) + Nghị định 356/2025/NĐ-CP;
Bộ luật Dân sự 2015 Điều 32 (right to one's image); Luật Sở hữu trí tuệ (photographer
copyright). The site describes itself as operating "in the spirit of" these — never claim
compliance without a lawyer's review. A photo being public on Facebook does not grant
republication rights.
