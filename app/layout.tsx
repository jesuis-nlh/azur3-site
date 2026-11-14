import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./components.css";
import "./pages.css";
import { site } from "@/lib/site";

const display = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--ff-display",
  display: "swap",
});
const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
  variable: "--ff-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--ff-mono",
  display: "swap",
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
      <head>
        {/* Reveal animations only hide content once JS is confirmed */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip-link" href="#noi-dung">Chuyển đến nội dung</a>
        {children}
      </body>
    </html>
  );
}
