import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./components.css";
import "./pages.css";
import { site } from "@/lib/site";

const display = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  // one weight, roman + italic: keep the display face light
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--ff-display",
  display: "swap",
  // No preloads: with inlined CSS the @font-face rules arrive with the HTML, so preloading adds
  // no discovery benefit — it only forced all faces to download up front and starved the LCP
  // image/CSS of bandwidth on slow networks (measured: worst mobile LCP 3.4 s → 1.9 s).
  preload: false,
});
const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--ff-body",
  display: "swap",
  preload: false, // see the display font note above
});
const mono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--ff-mono",
  display: "swap",
  preload: false, // only used for small coordinates; don't compete with the hero fonts
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.className}` },
  description: site.description,
  openGraph: { title: site.title, description: site.description, locale: "vi_VN", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#070812",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#noi-dung">Chuyển đến nội dung</a>
        {children}
      </body>
    </html>
  );
}
