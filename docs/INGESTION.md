# Importing material

Only import material you took yourself or that its owner has given you for the archive.
Never scrape Facebook or use someone else's account.

## 1. Photo folders

```bash
DATA_DIR=/path/to/data npm run ingest -- --source ~/Pictures/12A3 --kind folder --label "Ảnh của Lan"
```

## 2. Facebook exports

On Facebook: Settings → *Download your information* → choose the page/profile data you own,
format **JSON**, media quality **High**. Unzip it, then:

```bash
DATA_DIR=/path/to/data npm run ingest -- --source ~/Downloads/facebook-export --kind facebook --label "Trang lớp 12A3"
```

Post files (`your_posts_*.json`) and album files (`album/*.json`) are read; captions are repaired
from Facebook's broken encoding; upload times become `publishedAt`, not event dates.

## 3. Review

Open `/admin/imports` → **Nạp vào hàng duyệt** → tick items → **Chấp nhận → album nháp**.
Each item lists its issues (no date, date inferred from upload time, possible duplicate, no
caption, consent unconfirmed). Exact duplicates are skipped; near-duplicates are flagged.

The result is a **draft** album with `consent: pending`. Write alt text and captions, confirm
consent with the people in the photos, then publish from the album editor.

## What the importer reports

`✓ N mục · D trùng · E lỗi` plus each error (unsupported/corrupt files). Videos are listed for
review but not copied — upload them to YouTube/Vimeo and paste the link into a video record.
