import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./components.css";
import "./pages.css";
import { site } from "@/lib/site";

const display = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  // one weight, roman + italic: the display face is the LCP on most pages, so it must stay light
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--ff-display",
  display: "swap",
});
const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--ff-body",
  display: "swap",
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
    <html lang="vi" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#noi-dung">Chuyển đến nội dung</a>
        {children}
      </body>
    </html>
  );
}
