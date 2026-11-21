# Triển khai

Có hai lựa chọn. Chọn theo việc bạn có cần **lưu thay đổi** (trang quản trị, bài đóng góp) hay chưa.

| | Vercel | Máy chủ có ổ đĩa lưu trữ (Render, Railway, VPS) |
|---|---|---|
| Website công khai | ✅ đầy đủ | ✅ đầy đủ |
| Trang quản trị `/admin` | ⚠️ xem được, **không lưu được** | ✅ |
| Gửi đóng góp `/dong-gop` | ⚠️ hiện thông báo "bản xem trước" | ✅ |
| Nhập ảnh từ Facebook/thư mục | ❌ | ✅ |
| Phù hợp cho | bản xem trước, chia sẻ cho cả lớp xem | vận hành thật |

Lý do: kho lưu trữ lưu dữ liệu vào file (`DATA_DIR/archive.json` và thư mục ảnh). Vercel chạy
ứng dụng trên hạ tầng serverless có ổ đĩa **chỉ đọc**, nên mọi thay đổi không được giữ lại.
Website tự phát hiện điều này: nội dung mẫu vẫn hiển thị, trang quản trị và trang đóng góp báo
rõ là đang ở chế độ chỉ đọc. Muốn dùng Vercel để vận hành thật, cần thay `lib/store.ts` và
`lib/uploads.ts` bằng cơ sở dữ liệu (ví dụ Postgres) và kho lưu trữ ảnh (ví dụ Vercel Blob) —
xem `docs/ARCHITECTURE.md`.

## Vercel (bản xem trước) — khoảng 3 phút

1. Vào <https://vercel.com/new>, đăng nhập bằng GitHub.
2. Chọn **Import** repo `jesuis-nlh/azur3-site`. Nếu không thấy repo, bấm *Adjust GitHub App
   Permissions* và cho phép Vercel truy cập repo này.
3. Vercel tự nhận diện **Next.js**. Không cần đổi Build Command hay Output Directory.
4. Environment Variables (không bắt buộc cho bản xem trước):
   - `NEXT_PUBLIC_SITE_URL` = địa chỉ Vercel cấp, ví dụ `https://azur3-site.vercel.app`
   - Bỏ trống `ADMIN_PASSWORD`, `SESSION_SECRET`, `CONTRIBUTOR_CODE` — trên Vercel chúng không
     có tác dụng vì không lưu được dữ liệu. Để trống thì trang quản trị bị khoá, an toàn hơn.
5. Bấm **Deploy**. Từ đó, mỗi lần đẩy code lên nhánh mặc định của repo, Vercel tự triển khai lại.

Lưu ý: nhánh mặc định hiện tại của repo là `claude/stoic-hopper-rj87ft` (repo trống trước khi
dự án bắt đầu). Nếu muốn dùng `main`, đổi nhánh mặc định trong GitHub → Settings → Branches,
và đổi *Production Branch* trong Vercel → Project → Settings → Git.

## Máy chủ có ổ đĩa lưu trữ (vận hành thật)

Ví dụ với Render (Web Service):

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Thêm **Persistent Disk**, mount tại `/data`
- Environment: `DATA_DIR=/data`, `ADMIN_PASSWORD`, `SESSION_SECRET` (≥ 32 ký tự,
  `openssl rand -hex 32`), `CONTRIBUTOR_CODE`, `NEXT_PUBLIC_SITE_URL`

Sao lưu định kỳ thư mục `DATA_DIR` — xem `docs/OPERATIONS.md`.
