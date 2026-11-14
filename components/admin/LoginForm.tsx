"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="admin-login__form">
      <label htmlFor="pw">Mật khẩu quản trị</label>
      <input id="pw" name="password" type="password" autoComplete="current-password" required className="admin-input" disabled={!configured} />
      {state?.error ? <p role="alert" className="admin-error">{state.error}</p> : null}
      {!configured ? <p className="admin-error">Chưa cấu hình ADMIN_PASSWORD và SESSION_SECRET (≥ 32 ký tự) trên máy chủ.</p> : null}
      <button type="submit" className="admin-btn" disabled={pending || !configured}>{pending ? "Đang kiểm tra…" : "Đăng nhập"}</button>
    </form>
  );
}
