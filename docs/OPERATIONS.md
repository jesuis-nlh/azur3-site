# Operating the archive

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_PASSWORD` | yes (for /admin) | shared editor password — long and random |
| `SESSION_SECRET` | yes (for /admin) | ≥32 random chars (`openssl rand -hex 32`); rotating it logs everyone out |
| `CONTRIBUTOR_CODE` | yes (for contributions) | code shared privately in the class group |
| `DATA_DIR` | recommended | persistent folder for `archive.json` + uploads |
| `NEXT_PUBLIC_SITE_URL` | recommended | canonical URL for metadata |

## Weekly routine

1. `/admin/submissions` — removal requests are listed first; handle them before anything else
   (open the record → **Lưu trữ & ẩn**).
2. Approve useful submissions → drafts. Ask the people in photos before setting
   consent to "Đã đồng ý".
3. Replace placeholder records (dashboard shows how many "Mẫu" remain). Turn off
   `site.demoMode` in `lib/site.ts` once real material dominates.

## Backups

Back up `DATA_DIR` (archive.json + uploads). It is plain files:

```bash
tar czf archive-$(date +%F).tgz -C "$DATA_DIR" .
```

Keep at least one copy off the server. Rejected submissions keep their files until deleted —
remove `uploads/submissions/<id>` for rejected items periodically.

## Retiring placeholder content

All seed placeholders have `demo: true`. Filter `/admin/<collection>?status=demo`, then edit
or delete. The abstract plates in `public/media/demo/` can be removed once nothing references
them.
