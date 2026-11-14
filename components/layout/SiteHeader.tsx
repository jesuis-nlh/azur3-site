"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/lib/site";
import StarMark from "@/components/ui/StarMark";
import Glyph from "@/components/ui/Glyph";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu: lock scroll, close on Escape, keep focus inside
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>("a, button"));
        const firstEl = items[0], lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
      <div className="site-header__inner shell">
        <Link href="/" className="brand">
          <StarMark size={30} />
          <span className="brand__text">
            <span className="brand__name">{site.className}</span>
            <span className="brand__meta">{site.cohort.start}—{site.cohort.end}</span>
          </span>
          <span className="sr-only"> — trang chủ</span>
        </Link>

        <nav className="primary-nav" aria-label="Điều hướng chính">
          <ul>
            {nav.slice(0, 7).map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <Link href="/tim-kiem" className="icon-btn" aria-label="Tìm kiếm trong kho lưu trữ">
            <Glyph name="search" />
          </Link>
          <Link href="/dong-gop" className="btn btn--sm header-cta" data-magnetic>
            Đóng góp
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="icon-btn menu-toggle"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Đóng menu" : "Mở menu"}</span>
            <Glyph name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div id="site-menu" ref={panelRef} className="menu-panel" hidden={!open}>
        <nav className="shell" aria-label="Menu đầy đủ">
          <ol className="menu-panel__list">
            {nav.map((item, i) => (
              <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                  <span className="coord">{String(i + 1).padStart(2, "0")}</span>
                  <span className="menu-panel__label">{item.label}</span>
                  <span className="menu-panel__en" lang="en">{item.en}</span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="menu-panel__foot">
            <Link href="/dong-gop" className="btn btn--primary">Thêm một vì sao <Glyph name="arrow" className="arrow" /></Link>
            <Link href="/tim-kiem" className="btn">Tìm kiếm</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
