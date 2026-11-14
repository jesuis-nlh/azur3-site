import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import StarMark from "@/components/ui/StarMark";
import { isAdmin } from "@/lib/auth";
import { adminConfigured } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main id="noi-dung" className="admin-login">
      <div className="admin-login__card">
        <StarMark size={40} />
        <h1>Quản trị kho lưu trữ</h1>
        <p>Chỉ ban biên tập. Mọi thao tác được ghi vào nhật ký.</p>
        <LoginForm configured={adminConfigured()} />
      </div>
    </main>
  );
}
