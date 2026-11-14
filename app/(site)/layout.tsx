import CosmicBackground from "@/components/cosmic/CosmicBackground";
import Interactions from "@/components/cosmic/Interactions";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CosmicBackground />
      <SiteHeader />
      <main id="noi-dung" tabIndex={-1}>{children}</main>
      <SiteFooter />
      <Interactions />
    </>
  );
}
