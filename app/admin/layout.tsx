import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = { title: { default: "Quản trị", template: "%s — Quản trị 12A3" }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
